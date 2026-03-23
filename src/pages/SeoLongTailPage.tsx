import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Star, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";

interface Place {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
  neighborhood: string | null;
  image_url: string | null;
  rating: number | null;
  description: string | null;
  price_range: string | null;
}

const CAT_MAP: Record<string, { label: string; plural: string; db: string }> = {
  cafe: { label: "café", plural: "cafés", db: "cafe" },
  restaurant: { label: "restaurant", plural: "restaurants", db: "restaurant" },
  hammam: { label: "hammam", plural: "hammams", db: "activity" },
  rooftop: { label: "rooftop", plural: "rooftops", db: "rooftop" },
  "galerie-art": { label: "galerie d'art", plural: "galeries d'art", db: "culture" },
  souk: { label: "souk", plural: "souks", db: "shopping" },
  riad: { label: "riad", plural: "riads", db: "riad" },
  bar: { label: "bar", plural: "bars", db: "bar" },
};

const HOOD_MAP: Record<string, string> = {
  medina: "Médina",
  gueliz: "Guéliz",
  mellah: "Mellah",
  hivernage: "Hivernage",
  palmeraie: "Palmeraie",
  kasbah: "Kasbah",
};

function parseSlug(raw: string): { catKey: string; hoodKey: string } | null {
  // Format: cafe-medina or restaurant-gueliz or galerie-art-medina
  for (const catKey of Object.keys(CAT_MAP)) {
    for (const hoodKey of Object.keys(HOOD_MAP)) {
      if (raw === `${catKey}-${hoodKey}-marrakech`) {
        return { catKey, hoodKey };
      }
    }
  }
  return null;
}

export default function SeoLongTailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  const parsed = slug ? parseSlug(slug) : null;
  const cat = parsed ? CAT_MAP[parsed.catKey] : null;
  const hood = parsed ? HOOD_MAP[parsed.hoodKey] : null;

  usePageMeta({
    title: cat && hood ? `Meilleur ${cat.label} ${hood} Marrakech 2025` : "Marrakech",
    description: cat && hood ? `Top ${cat.plural} à ${hood} Marrakech. Adresses locales vérifiées par des locaux.` : undefined,
    url: slug ? `https://weshkech.com/meilleur-${slug}` : undefined,
  });

  useEffect(() => {
    if (!cat || !hood) return;
    supabase
      .from("places")
      .select("id, name, slug, category, neighborhood, image_url, rating, description, price_range")
      .ilike("category", `%${cat.db}%`)
      .ilike("neighborhood", `%${hood}%`)
      .order("rating", { ascending: false })
      .then(({ data }) => { if (data) setPlaces(data as Place[]); setLoading(false); });
  }, [slug]);

  // Schema.org ItemList
  useEffect(() => {
    if (!cat || !hood || places.length === 0) return;
    const schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `Meilleurs ${cat.plural} à ${hood}, Marrakech`,
      "description": `${cat.plural} authentiques à ${hood}, Marrakech`,
      "numberOfItems": places.length,
      "itemListElement": places.slice(0, 10).map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "name": p.name,
        "url": `https://weshkech.com/spot/${p.slug || p.id}`,
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [cat, hood, places]);

  if (!cat || !hood) {
    return (
      <div className="min-h-[100dvh] bg-[var(--bg-primary)] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-semibold text-[var(--text-primary)]">Page introuvable</p>
        <button onClick={() => navigate("/")} className="text-sm text-[var(--ochre)] underline mt-2">Retour</button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)]">
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)] px-5 pt-12 pb-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-default)] flex items-center justify-center active:scale-95 transition-transform">
            <ArrowLeft className="w-4 h-4 text-[var(--text-primary)]" />
          </button>
          <div>
            <h1 className="font-display text-base font-black text-[var(--text-primary)]">Meilleur {cat.label} à {hood}</h1>
            <p className="text-[10px] text-[var(--text-muted)]">Marrakech · Adresses locales</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-black tracking-tight text-[var(--text-primary)] mb-2">
            Les meilleurs {cat.plural} à {hood}, Marrakech
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Découvrez les {cat.plural} incontournables du quartier {hood} à Marrakech, sélectionnés par des locaux. {places.length > 0 ? `${places.length} adresse${places.length > 1 ? "s" : ""} vérifiée${places.length > 1 ? "s" : ""}.` : ""}
          </p>
        </motion.div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
          <Link to="/" className="hover:text-[var(--ochre)]">Accueil</Link>
          <span>›</span>
          <Link to={`/quartier/${parsed!.hoodKey}`} className="hover:text-[var(--ochre)]">{hood}</Link>
          <span>›</span>
          <span className="text-[var(--ochre)]">{cat.plural}</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-[var(--bg-card)] animate-pulse rounded-xl" />)}
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-[var(--text-muted)]">Aucun {cat.label} trouvé à {hood}.</p>
            <Link to="/" className="text-xs text-[var(--ochre)] underline mt-2 inline-block">Voir la carte</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {places.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Link to={`/spot/${p.slug || p.id}`}
                  className="flex gap-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-3 hover:border-[var(--ochre)]/40 transition-colors">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-20 h-20 rounded-lg object-cover shrink-0" loading="lazy" style={{ backgroundColor: "var(--bg-card)" }} />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-[var(--bg-surface)] flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-[var(--ochre)]/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate">{p.name}</p>
                      {i < 3 && <span className="text-[10px] text-[var(--ochre)] font-bold">#{i + 1}</span>}
                    </div>
                    {p.description && <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-0.5">{p.description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      {p.rating && <span className="flex items-center gap-0.5 text-[10px] text-[var(--ochre-light)]"><Star className="w-3 h-3 fill-[var(--ochre-light)] text-[var(--ochre-light)]" /> {p.rating}</span>}
                      {p.price_range && <span className="text-[10px] text-[var(--text-muted)]">{p.price_range}</span>}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        <Link to="/" className="block w-full py-3 rounded-xl text-center text-sm font-bold bg-[var(--ochre)] text-[#0E0904] uppercase tracking-wide active:scale-[0.97] transition-transform">
          Voir sur la carte
        </Link>

        {/* Related links */}
        <div className="space-y-2 pt-4 border-t border-[var(--border-subtle)]">
          <p className="text-[9px] uppercase tracking-wide text-[var(--text-muted)] font-semibold">Autres quartiers</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(HOOD_MAP).filter(([k]) => k !== parsed!.hoodKey).map(([k, v]) => (
              <Link key={k} to={`/meilleur-${parsed!.catKey}-${k}-marrakech`}
                className="px-3 py-1.5 rounded-md border border-[var(--border-default)] text-xs text-[var(--text-muted)] hover:text-[var(--ochre)] hover:border-[var(--ochre)] transition-colors">
                {cat.plural} à {v}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
