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

const CATEGORY_LABELS: Record<string, string> = {
  cafes: "Cafés", restaurants: "Restaurants", rooftops: "Rooftops", clubs: "Clubs & Bars",
  hammams: "Hammams & Spas", hotels: "Riads & Hôtels", shopping: "Shopping",
  culture: "Culture & Musées", activites: "Activités",
};

const CATEGORY_DB: Record<string, string> = {
  cafes: "cafe", restaurants: "restaurant", rooftops: "rooftop", clubs: "club",
  hammams: "activity", hotels: "riad", shopping: "shopping",
  culture: "culture", activites: "activity",
};

const HOOD_LABELS: Record<string, string> = {
  medina: "Médina", gueliz: "Guéliz", hivernage: "Hivernage",
  palmeraie: "Palmeraie", kasbah: "Kasbah", mellah: "Mellah",
};

export default function CategoryNeighborhoodPage() {
  const { category, neighborhood } = useParams<{ category: string; neighborhood: string }>();
  const navigate = useNavigate();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  const catLabel = category ? CATEGORY_LABELS[category] : null;
  const catDb = category ? CATEGORY_DB[category] : null;
  const hoodLabel = neighborhood ? HOOD_LABELS[neighborhood] : null;

  usePageMeta({
    title: catLabel && hoodLabel ? `Meilleurs ${catLabel} à ${hoodLabel}, Marrakech` : "Marrakech",
    description: catLabel && hoodLabel ? `${catLabel} authentiques à ${hoodLabel}, Marrakech. Adresses locales vérifiées, pas de tourist traps.` : undefined,
    url: category && neighborhood ? `https://weshkech.com/marrakech/${category}/${neighborhood}` : undefined,
  });

  useEffect(() => {
    if (!catDb || !hoodLabel) return;
    supabase
      .from("places")
      .select("id, name, slug, category, neighborhood, image_url, rating, description, price_range")
      .ilike("category", `%${catDb}%`)
      .ilike("neighborhood", `%${hoodLabel}%`)
      .order("rating", { ascending: false })
      .then(({ data }) => { if (data) setPlaces(data as Place[]); setLoading(false); });
  }, [category, neighborhood]);

  // Schema.org ItemList + Place
  useEffect(() => {
    if (!catLabel || !hoodLabel || places.length === 0) return;
    const schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `Meilleurs ${catLabel} à ${hoodLabel}, Marrakech`,
      "description": `${catLabel} à ${hoodLabel}, Marrakech`,
      "numberOfItems": places.length,
      "itemListElement": places.slice(0, 10).map((p, i) => ({
        "@type": "ListItem", "position": i + 1, "name": p.name,
        "url": `https://weshkech.com/spot/${p.slug || p.id}`,
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [catLabel, hoodLabel, places]);

  if (!catLabel || !hoodLabel) {
    return (
      <div className="min-h-[100dvh] bg-[var(--bg-primary)] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-semibold text-[var(--text-primary)]">Page introuvable</p>
        <button onClick={() => navigate("/")} className="text-sm text-[var(--ochre)] underline mt-2">Retour</button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)] px-5 pt-12 pb-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate(`/marrakech/${category}`)} className="w-9 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-default)] flex items-center justify-center active:scale-95 transition-transform">
            <ArrowLeft className="w-4 h-4 text-[var(--text-primary)]" />
          </button>
          <div>
            <h1 className="font-display text-base font-black text-[var(--text-primary)]">{catLabel} à {hoodLabel}</h1>
            <p className="text-[10px] text-[var(--text-muted)]">Marrakech</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-black tracking-tight text-[var(--text-primary)] mb-2">
            Meilleurs {catLabel.toLowerCase()} à {hoodLabel}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {places.length} adresse{places.length !== 1 ? "s" : ""} {catLabel.toLowerCase()} à {hoodLabel}, Marrakech. Vérifiées par des locaux.
          </p>
        </motion.div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
          <Link to="/" className="hover:text-[var(--ochre)]">Accueil</Link>
          <span>›</span>
          <Link to={`/marrakech/${category}`} className="hover:text-[var(--ochre)]">{catLabel}</Link>
          <span>›</span>
          <span className="text-[var(--ochre)]">{hoodLabel}</span>
        </div>

        {/* Spots */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-[var(--bg-card)] animate-pulse rounded-xl" />)}
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-[var(--text-muted)]">Aucun {catLabel.toLowerCase()} trouvé à {hoodLabel}.</p>
            <Link to={`/marrakech/${category}`} className="text-xs text-[var(--ochre)] underline mt-2 inline-block">Voir tous les {catLabel.toLowerCase()}</Link>
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
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">{p.name}</p>
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
      </div>
    </div>
  );
}
