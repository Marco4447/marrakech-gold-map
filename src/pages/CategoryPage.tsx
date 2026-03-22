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

const CATEGORY_MAP: Record<string, { label: string; dbMatch: string; intro: string }> = {
  cafes: { label: "Cafés", dbMatch: "cafe", intro: "Des terrasses ombragées du souk aux coffee shops branchés de Guéliz, les cafés de Marrakech sont des institutions. Thé à la menthe fumant, jus d'orange frais pressé et pâtisseries au miel — chaque quartier a ses adresses secrètes où le temps s'arrête." },
  restaurants: { label: "Restaurants", dbMatch: "restaurant", intro: "La cuisine marrakchie est un voyage en soi. Des riads intimistes aux tables gastronomiques, la ville ocre cache des trésors culinaires pour tous les palais. Tajines mijotés, couscous du vendredi, street food nocturne — voici les adresses que les locaux se partagent." },
  rooftops: { label: "Rooftops", dbMatch: "rooftop", intro: "Marrakech se vit d'en haut. Au coucher du soleil, les terrasses s'illuminent et la vue sur l'Atlas devient magique. Cocktails, musique lounge et panoramas à 360° — les rooftops sont l'âme de la nuit marrakchie." },
  clubs: { label: "Clubs & Bars", dbMatch: "club", intro: "La vie nocturne de Marrakech rivalise avec les plus grandes capitales. Des clubs historiques aux bars à cocktails intimistes, la ville ne dort jamais. House, R&B, gnawa — chaque nuit a sa bande-son." },
  hammams: { label: "Hammams & Spas", dbMatch: "activity", intro: "Le hammam est un rituel sacré à Marrakech. Vapeur, gommage au savon noir, massage à l'huile d'argan — ces adresses offrent une parenthèse de bien-être entre tradition millénaire et luxe contemporain." },
  hotels: { label: "Riads & Hôtels", dbMatch: "riad", intro: "Dormir à Marrakech, c'est choisir entre le charme d'un riad centenaire en médina et le luxe d'un palace avec vue sur l'Atlas. Piscines cachées, patios fleuris et hospitalité légendaire." },
  shopping: { label: "Shopping", dbMatch: "shopping", intro: "Des souks labyrinthiques aux concept stores de Guéliz, Marrakech est un paradis pour les chineurs. Cuir, céramique, tissage, mode contemporaine — l'artisanat marocain se réinvente à chaque coin de rue." },
  culture: { label: "Culture & Musées", dbMatch: "culture", intro: "Marrakech est une ville-musée à ciel ouvert. Palais, médersas, galeries d'art contemporain et musées — chaque ruelle de la médina raconte dix siècles d'histoire." },
  activites: { label: "Activités", dbMatch: "activity", intro: "Quad dans la palmeraie, vol en montgolfière au-dessus de l'Atlas, cours de cuisine dans un riad — Marrakech offre des expériences uniques pour tous les aventuriers." },
};

const NEIGHBORHOODS = ["Médina", "Guéliz", "Hivernage", "Palmeraie", "Kasbah"];

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  const cat = category ? CATEGORY_MAP[category] : null;

  usePageMeta({
    title: cat ? `Meilleurs ${cat.label} à Marrakech — Adresses locales` : "Marrakech",
    description: cat ? `Liste des ${cat.label.toLowerCase()} authentiques à Marrakech vérifiés par des locaux. Pas de tourist traps.` : undefined,
    url: category ? `https://weshkech.com/marrakech/${category}` : undefined,
  });

  useEffect(() => {
    if (!cat) return;
    supabase
      .from("places")
      .select("id, name, slug, category, neighborhood, image_url, rating, description, price_range")
      .ilike("category", `%${cat.dbMatch}%`)
      .order("rating", { ascending: false })
      .then(({ data }) => { if (data) setPlaces(data as Place[]); setLoading(false); });
  }, [category]);

  // Schema.org ItemList
  useEffect(() => {
    if (!cat || places.length === 0) return;
    const schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `Meilleurs ${cat.label} à Marrakech`,
      "description": `${cat.label} authentiques à Marrakech`,
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
  }, [cat, places]);

  if (!cat) {
    return (
      <div className="min-h-[100dvh] bg-[var(--bg-primary)] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-semibold text-[var(--text-primary)]">Catégorie introuvable</p>
        <button onClick={() => navigate("/")} className="text-sm text-[var(--ochre)] underline mt-2">Retour</button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)] px-5 pt-12 pb-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-default)] flex items-center justify-center active:scale-95 transition-transform">
            <ArrowLeft className="w-4 h-4 text-[var(--text-primary)]" />
          </button>
          <h1 className="font-display text-lg font-black text-[var(--text-primary)]">{cat.label} à Marrakech</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-8 space-y-8">
        {/* H1 + Intro */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-black tracking-tight text-[var(--text-primary)] mb-3">
            Les meilleurs {cat.label.toLowerCase()} à Marrakech
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{cat.intro}</p>
        </motion.div>

        {/* Neighborhood pills */}
        <div className="flex gap-2 flex-wrap">
          {NEIGHBORHOODS.map(n => {
            const nSlug = n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
            return (
              <Link key={n} to={`/marrakech/${category}/${nSlug}`}
                className="px-3 py-1.5 rounded-md border border-[var(--border-default)] text-xs text-[var(--text-muted)] hover:text-[var(--ochre)] hover:border-[var(--ochre)] transition-colors">
                {n}
              </Link>
            );
          })}
        </div>

        {/* Spots grid */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-[var(--bg-card)] animate-pulse rounded-xl" />)}
          </div>
        ) : places.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-12">Aucun spot trouvé dans cette catégorie.</p>
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
                    <p className="text-[10px] text-[var(--ochre)] uppercase tracking-wide">{p.neighborhood}</p>
                    {p.description && <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-0.5">{p.description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      {p.rating && (
                        <span className="flex items-center gap-0.5 text-[10px] text-[var(--ochre-light)]">
                          <Star className="w-3 h-3 fill-[var(--ochre-light)] text-[var(--ochre-light)]" /> {p.rating}
                        </span>
                      )}
                      {p.price_range && <span className="text-[10px] text-[var(--text-muted)]">{p.price_range}</span>}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA */}
        <Link to="/" className="block w-full py-3 rounded-xl text-center text-sm font-bold bg-[var(--ochre)] text-[#0E0904] uppercase tracking-wide active:scale-[0.97] transition-transform">
          Voir sur la carte
        </Link>
      </div>
    </div>
  );
}
