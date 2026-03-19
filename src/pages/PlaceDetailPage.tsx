import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navigation, Share2, ExternalLink, Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getShareUrl } from "@/lib/shareUrl";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";
import PlaceHero from "@/components/place/PlaceHero";
import PlaceQuickTags from "@/components/place/PlaceQuickTags";
import PlacePracticalInfo from "@/components/place/PlacePracticalInfo";
import PlacePhotoGallery from "@/components/place/PlacePhotoGallery";

interface PlaceData {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  category: string | null;
  neighborhood: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
  rating: number | null;
  opening_hours: string | null;
  price_range: string | null;
  music_style: string | null;
  dress_code: string | null;
  menu_url: string | null;
  drinks_menu_url: string | null;
  instagram_handle: string | null;
  is_partner: boolean;
  is_founder: boolean;
  vip_perk_description: string | null;
}

export default function PlaceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [place, setPlace] = useState<PlaceData | null>(null);

  usePageMeta({
    title: place ? `${place.name} — ${place.category || "Spot"}` : "Spot",
    description: place ? `${place.name} à ${place.neighborhood || "Marrakech"}. ${place.description?.slice(0, 120) || "Découvre ce spot sur Weshkech."}` : undefined,
    image: place?.image_url || undefined,
    url: place?.slug ? `https://weshkech.com/spot/${place.slug}` : undefined,
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { navigate("/"); return; }

    const load = async () => {
      const { data } = await supabase
        .from("places")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!data) { navigate("/", { replace: true }); return; }
      setPlace(data as PlaceData);

      const { data: photoData } = await supabase
        .from("place_photos")
        .select("photo_url")
        .eq("place_id", data.id)
        .order("sort_order", { ascending: true });

      setPhotos(photoData?.map((p) => p.photo_url) || []);
      setLoading(false);
    };
    load();
  }, [slug, navigate]);

  if (loading || !place) {
    return (
      <div className="h-[100dvh] w-full bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Build hero media: prefer first video from photos, fallback to first photo, then image_url
  const videoFromPhotos = photos.find((url) => /\.(mp4|webm|mov|m4v)$/i.test(url.split("?")[0]));
  const heroMedia = videoFromPhotos || photos[0] || place.image_url || "";

  // Build gallery (non-video photos for the secondary gallery)
  const galleryImages = photos.filter((url) => !/\.(mp4|webm|mov|m4v)$/i.test(url.split("?")[0]));
  const allGalleryMedia = photos.length > 0 ? photos : (place.image_url ? [place.image_url] : []);

  // Tags from category, music, neighborhood
  const tags: string[] = [];
  if (place.category) place.category.split(",").forEach((c) => tags.push(c.trim()));
  if (place.neighborhood) tags.push(place.neighborhood);
  if (place.music_style) tags.push(place.music_style);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

  const handleShare = async () => {
    const url = getShareUrl("place", place.slug || place.id);
    const text = `${place.name} sur Weshkech 🔥`;
    if (navigator.share) {
      try { await navigator.share({ title: place.name, text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié !");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Hero */}
      <PlaceHero
        mediaUrl={heroMedia}
        placeName={place.name}
        category={place.category}
        neighborhood={place.neighborhood}
        isPartner={place.is_partner}
      />

      {/* Quick Tags */}
      <PlaceQuickTags tags={tags} />

      {/* Main Content */}
      <div className="px-4 pb-8 md:px-8 lg:px-16">
        <div className="max-w-5xl mx-auto md:grid md:grid-cols-5 md:gap-8">
          {/* Left column — About */}
          <div className="md:col-span-3 space-y-6">
            {/* Description */}
            {place.description && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-4"
              >
                <h2 className="font-display text-lg font-bold text-foreground">À propos</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-body">
                  {place.description}
                </p>
              </motion.div>
            )}

            {/* VIP Perk */}
            {place.vip_perk_description && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-gold/30 bg-gold/5 p-4"
              >
                <p className="text-[10px] uppercase tracking-widest font-bold text-gold mb-1">🎁 Offre VIP</p>
                <p className="text-sm text-foreground font-medium">{place.vip_perk_description}</p>
              </motion.div>
            )}

            {/* Photo/Video Gallery */}
            {allGalleryMedia.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <h2 className="font-display text-lg font-bold text-foreground mb-3">Galerie</h2>
                <div className="rounded-2xl overflow-hidden border border-border">
                  <PlacePhotoGallery
                    images={allGalleryMedia}
                    placeName={place.name}
                    isPartner={place.is_partner}
                    viewerCount={0}
                    onClose={() => {}}
                  />
                </div>
              </motion.div>
            )}

            {/* Menu links */}
            {(place.menu_url || place.drinks_menu_url) && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-2"
              >
                {place.menu_url && (
                  <a
                    href={place.menu_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-gold" />
                    Voir le menu
                  </a>
                )}
                {place.drinks_menu_url && (
                  <a
                    href={place.drinks_menu_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-gold" />
                    Carte des boissons
                  </a>
                )}
              </motion.div>
            )}
          </div>

          {/* Right column — Practical Info */}
          <div className="md:col-span-2 mt-6 md:mt-0 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <PlacePracticalInfo
                neighborhood={place.neighborhood}
                address={place.address}
                openingHours={place.opening_hours}
                priceRange={place.price_range}
                musicStyle={place.music_style}
                dressCode={place.dress_code}
              />
            </motion.div>

            {/* Instagram */}
            {place.instagram_handle && (
              <motion.a
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                href={`https://instagram.com/${place.instagram_handle.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border bg-card hover:bg-secondary transition-colors"
              >
                <Instagram className="w-5 h-5 text-gold" />
                <span className="text-sm font-medium text-foreground">
                  @{place.instagram_handle.replace("@", "")}
                </span>
              </motion.a>
            )}

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-col gap-2.5 pt-2"
            >
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold text-sm transition-all active:scale-[0.97] text-primary-foreground shadow-lg shadow-gold/20"
                style={{ background: "linear-gradient(135deg, hsl(43 76% 52%), hsl(43 70% 62%))" }}
              >
                <Navigation className="w-4 h-4" />
                Itinéraire
              </a>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold text-sm border border-border bg-card text-foreground hover:bg-secondary transition-all active:scale-[0.97]"
              >
                <Share2 className="w-4 h-4" />
                Partager
              </button>
            </motion.div>

            {/* Founder badge */}
            {place.is_founder && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gold/10 border border-gold/20">
                <span className="text-sm">🛡️</span>
                <span className="text-xs font-bold text-gold uppercase tracking-wider">Membre fondateur</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
