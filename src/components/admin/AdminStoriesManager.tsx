import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Star, Eye, EyeOff, Upload, Image, Video } from "lucide-react";
import { timeAgo } from "@/lib/timeAgo";
import { logAdminAction } from "@/lib/auditLog";

interface AdminStory {
  id: string;
  source_type: string;
  media_url: string;
  media_type: string;
  badge: string | null;
  caption: string | null;
  is_featured: boolean;
  is_hidden: boolean;
  created_at: string;
  expires_at: string;
  place_id: string | null;
  user_id: string | null;
}

export default function AdminStoriesManager() {
  const [stories, setStories] = useState<AdminStory[]>([]);
  const [places, setPlaces] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // New story form
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [badge, setBadge] = useState("HOT TONIGHT");
  const [placeId, setPlaceId] = useState("");
  const [publishing, setPublishing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchAll = async () => {
    // Fetch ALL stories (admin sees hidden/expired too)
    const { data } = await supabase
      .from("stories" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setStories((data as any[]) || []);

    const { data: p } = await supabase.from("places").select("id, name").order("name");
    setPlaces(p || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleToggleHidden = async (story: AdminStory) => {
    const newHidden = !story.is_hidden;
    await supabase.from("stories" as any).update({ is_hidden: newHidden } as any).eq("id", story.id);
    logAdminAction({ action: newHidden ? "hide_story" : "show_story", targetTable: "stories", targetId: story.id, oldValue: { is_hidden: story.is_hidden }, newValue: { is_hidden: newHidden } });
    toast.success(story.is_hidden ? "Story visible" : "Story masquée");
    fetchAll();
  };

  const handleToggleFeatured = async (story: AdminStory) => {
    const newFeatured = !story.is_featured;
    await supabase.from("stories" as any).update({ is_featured: newFeatured } as any).eq("id", story.id);
    logAdminAction({ action: newFeatured ? "feature_story" : "unfeature_story", targetTable: "stories", targetId: story.id, oldValue: { is_featured: story.is_featured }, newValue: { is_featured: newFeatured } });
    toast.success(story.is_featured ? "Retirée de la une" : "Mise en avant !");
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette story ?")) return;
    await supabase.from("stories" as any).delete().eq("id", id);
    toast.success("Story supprimée");
    fetchAll();
  };

  const handlePublish = async () => {
    if (!mediaFile) { toast.error("Sélectionnez un fichier"); return; }
    setPublishing(true);
    try {
      const ext = mediaFile.name.split(".").pop();
      const path = `stories/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("vibes_media").upload(path, mediaFile, { contentType: mediaFile.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("vibes_media").getPublicUrl(path);

      const mediaType = mediaFile.type.startsWith("video") ? "video" : "photo";
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from("stories" as any).insert({
        source_type: "admin",
        user_id: user?.id,
        place_id: placeId || null,
        media_url: urlData.publicUrl,
        media_type: mediaType,
        badge: badge || null,
        caption: caption || null,
        is_featured: true,
      } as any);

      toast.success("Story admin publiée !");
      setMediaFile(null);
      setCaption("");
      setBadge("HOT TONIGHT");
      setPlaceId("");
      fetchAll();
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    }
    setPublishing(false);
  };

  if (loading) return <div className="p-6 text-center text-muted-foreground">Chargement…</div>;

  return (
    <div className="space-y-6 p-4">
      {/* Publish new admin story */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Upload className="w-4 h-4 text-gold" /> Publier une story admin
        </h3>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-gold/40 transition-colors flex items-center justify-center gap-2"
        >
          {mediaFile ? (
            <>
              {mediaFile.type.startsWith("video") ? <Video className="w-4 h-4" /> : <Image className="w-4 h-4" />}
              {mediaFile.name}
            </>
          ) : (
            "📸 Photo ou vidéo"
          )}
        </button>

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Légende (optionnel)"
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
        />

        <div className="flex gap-2">
          <select
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
          >
            <option value="HOT TONIGHT">🔥 HOT TONIGHT</option>
            <option value="ROOFTOP">🌅 ROOFTOP</option>
            <option value="CLUB">🎵 CLUB</option>
            <option value="RESTAURANT">🍽️ RESTAURANT</option>
            <option value="EVENT">🎉 EVENT</option>
          </select>

          <select
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
          >
            <option value="">Aucun lieu</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handlePublish}
          disabled={publishing || !mediaFile}
          className="w-full py-2.5 rounded-xl font-bold text-sm text-primary-foreground disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
        >
          {publishing ? "Publication…" : "Publier la story"}
        </button>
      </div>

      {/* Stories list */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-foreground">
          Stories actives ({stories.filter((s) => !s.is_hidden && new Date(s.expires_at) > new Date()).length})
        </h3>
        {stories.map((s) => {
          const expired = new Date(s.expires_at) < new Date();
          return (
            <div
              key={s.id}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                s.is_hidden || expired ? "border-border/50 opacity-50" : "border-border"
              } bg-card`}
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                {s.media_type === "video" ? (
                  <video src={s.media_url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={s.media_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-foreground capitalize">{s.source_type}</span>
                  {s.badge && (
                    <span className="text-2xs px-1.5 py-0.5 rounded-full bg-gold/20 text-gold font-bold">{s.badge}</span>
                  )}
                  {s.is_featured && <Star className="w-3 h-3 text-gold fill-gold" />}
                  {expired && <span className="text-2xs text-destructive font-bold">EXPIRÉE</span>}
                </div>
                <p className="text-2xs text-muted-foreground truncate">{s.caption || "Sans légende"} · {timeAgo(s.created_at)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleToggleFeatured(s)} className="p-1.5 rounded-lg hover:bg-muted" title="Mettre en avant">
                  <Star className={`w-4 h-4 ${s.is_featured ? "text-gold fill-gold" : "text-muted-foreground"}`} />
                </button>
                <button onClick={() => handleToggleHidden(s)} className="p-1.5 rounded-lg hover:bg-muted" title={s.is_hidden ? "Rendre visible" : "Masquer"}>
                  {s.is_hidden ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-destructive/10" title="Supprimer">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          );
        })}
        {stories.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Aucune story pour le moment</p>
        )}
      </div>
    </div>
  );
}
