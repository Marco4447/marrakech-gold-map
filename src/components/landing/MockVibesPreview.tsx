import { motion } from "framer-motion";
import { Heart, Bookmark, Lock } from "lucide-react";

interface MockVibe {
  id: string;
  placeName: string;
  neighborhood: string;
  category: string;
  imageUrl: string;
  insiderTip: string;
  postedBy: {
    username: string;
    initials: string;
    badge: "Insider" | "Fondateur";
  };
  likesCount: number;
  savesCount: number;
}

const MOCK_VIBES: MockVibe[] = [
  {
    id: "1",
    placeName: "Le Rooftop Secret",
    neighborhood: "Guéliz",
    category: "Rooftop",
    imageUrl: "/images/mk-rooftop-1.jpg",
    insiderTip: "Demandez la table 4 au fond, c'est la seule avec la vue sur l'Atlas. Ne venez pas avant 23h.",
    postedBy: { username: "@mehdi_nights", initials: "MN", badge: "Fondateur" },
    likesCount: 347,
    savesCount: 128,
  },
  {
    id: "2",
    placeName: "Coco Marrakech",
    neighborhood: "Hivernage",
    category: "Speakeasy",
    imageUrl: "/images/coco-photo-1.jpg",
    insiderTip: "Sonnez 2 fois à la porte rouge. Mot de passe : 'Atlas'. Le barman s'appelle Youssef, dites que vous venez de la part de Karim.",
    postedBy: { username: "@sarah.expat", initials: "SE", badge: "Insider" },
    likesCount: 231,
    savesCount: 89,
  },
  {
    id: "3",
    placeName: "Kabana",
    neighborhood: "Médina",
    category: "Resto Caché",
    imageUrl: "/images/kabana-photo-2.jpg",
    insiderTip: "Le menu secret n'est pas affiché. Demandez le 'Menu Riad' — tajine truffe + champagne rosé, 380 DH.",
    postedBy: { username: "@youssef.kech", initials: "YK", badge: "Insider" },
    likesCount: 189,
    savesCount: 67,
  },
];

const BADGE_STYLES: Record<string, string> = {
  Fondateur: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Insider: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export default function MockVibesPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.6 }}
      className="relative z-10 w-[calc(100%-2rem)] max-w-[400px] mx-auto mt-4"
    >
      {/* Section title */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-xs font-semibold tracking-[0.12em] uppercase text-white/40">
          Aperçu — Ce soir à Kech
        </span>
      </div>

      {/* Vibes cards */}
      <div className="space-y-2.5">
        {MOCK_VIBES.map((vibe, i) => (
          <motion.div
            key={vibe.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + i * 0.12, duration: 0.5 }}
            className="relative rounded-2xl overflow-hidden border border-white/[0.06]"
          >
            {/* Image — progressively more blurred */}
            <div className="relative h-[140px]">
              <img
                src={vibe.imageUrl}
                alt=""
                className="w-full h-full object-cover"
                style={{ filter: `blur(${4 + i * 3}px)` }}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

              {/* Category + Neighborhood */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span className="text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.1] border border-white/[0.1] text-white/60 backdrop-blur-sm">
                  {vibe.category}
                </span>
                <span className="text-2xs text-white/40">{vibe.neighborhood}</span>
              </div>

              {/* Engagement */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-2">
                <span className="flex items-center gap-1 text-2xs text-white/50">
                  <Heart className="w-3 h-3" /> {vibe.likesCount}
                </span>
                <span className="flex items-center gap-1 text-2xs text-white/50">
                  <Bookmark className="w-3 h-3" /> {vibe.savesCount}
                </span>
              </div>

              {/* Bottom content */}
              <div className="absolute bottom-0 inset-x-0 p-3 space-y-1.5">
                <h3 className="text-[14px] font-bold text-white leading-tight">
                  {vibe.placeName}
                </h3>
                <p className="text-xs text-white/50 leading-relaxed line-clamp-2 italic">
                  "{vibe.insiderTip.slice(0, 50)}..."
                </p>

                {/* Author */}
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-white/[0.1] border border-white/[0.08] flex items-center justify-center">
                    <span className="text-[7px] font-bold text-white/60">{vibe.postedBy.initials}</span>
                  </div>
                  <span className="text-2xs text-white/40">{vibe.postedBy.username}</span>
                  <span className={`text-2xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${BADGE_STYLES[vibe.postedBy.badge]}`}>
                    {vibe.postedBy.badge}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lock overlay CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center justify-end pb-4 pointer-events-none rounded-b-2xl"
      >
        <Lock className="w-5 h-5 text-white/30 mb-2" />
        <p className="text-[12px] font-semibold text-white/50">
          Inscris-toi pour tout voir
        </p>
        <p className="text-2xs text-white/25 mt-0.5">
          +12 spots cachés débloqués ce soir
        </p>
      </motion.div>
    </motion.div>
  );
}
