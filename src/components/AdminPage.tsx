import { useState, useRef, useEffect } from "react";
import { Upload, Image, MapPin, Send, ArrowLeft, Check, Loader2, BarChart3, Users, MessageCircle, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type PassStat = { place_name: string; count: number };
type PartnerRequest = { id: string; business_name: string; category: string; offer_description: string; whatsapp_number: string; status: string; created_at: string };

export default function AdminPage({ onBack }: { onBack: () => void }) {
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passStats, setPassStats] = useState<PassStat[]>([]);
  const [partnerRequests, setPartnerRequests] = useState<PartnerRequest[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("place_name")
        .eq("status", "free_pass");
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((b) => {
          counts[b.place_name] = (counts[b.place_name] || 0) + 1;
        });
        setPassStats(
          Object.entries(counts)
            .map(([place_name, count]) => ({ place_name, count }))
            .sort((a, b) => b.count - a.count)
        );
      }
    };
    const fetchPartnerRequests = async () => {
      const { data } = await supabase
        .from("partner_requests" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setPartnerRequests(data as any);
    };
    fetchStats();
    fetchPartnerRequests();
  }, [success]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setSuccess(false);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("vibes")
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/vibes/${fileName}`;

      const { error: insertError } = await supabase.from("vibes").insert({
        image_url: imageUrl,
        caption: caption || null,
        location: location || null,
        likes: Math.floor(Math.random() * 300) + 50,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setFile(null);
      setPreview(null);
      setCaption("");
      setLocation("");
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateStatus = async (req: PartnerRequest, newStatus: "approved" | "rejected") => {
    setUpdatingId(req.id);
    try {
      // Update partner_requests status
      const { error } = await supabase
        .from("partner_requests" as any)
        .update({ status: newStatus } as any)
        .eq("id", req.id);
      if (error) throw error;

      // If approved, mark matching place as partner
      if (newStatus === "approved") {
        await supabase
          .from("places")
          .update({ is_partner: true, has_active_offer: true } as any)
          .ilike("name", req.business_name);
      }

      // Update local state
      setPartnerRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: newStatus } : r))
      );
      toast.success(newStatus === "approved" ? `${req.business_name} approuvé ✅` : `${req.business_name} rejeté`);
    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-5 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold">
              <span className="text-gold">Admin</span>
              <span className="text-foreground"> Panel</span>
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">Gestion complète</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-5">
        {/* Partner Requests Dashboard — FIRST */}
        <div className="border-b border-border pb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-gold" />
            <h2 className="font-display text-base font-semibold text-foreground">Demandes Partenaires</h2>
            <span className="text-xs text-muted-foreground">({partnerRequests.length})</span>
          </div>
          {partnerRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune demande pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {partnerRequests.map((req) => (
                <div key={req.id} className="bg-surface border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{req.business_name}</p>
                      <p className="text-xs text-muted-foreground">{req.category}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      req.status === "pending"
                        ? "bg-gold/10 text-gold"
                        : req.status === "approved"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80">🎁 {req.offer_description}</p>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/${req.whatsapp_number.replace(/[\s()-]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:text-gold-light transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  </div>
                  {/* Action buttons */}
                  {req.status === "pending" && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleUpdateStatus(req, "approved")}
                        disabled={updatingId === req.id}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 font-medium py-2 rounded-xl text-xs transition-colors disabled:opacity-50"
                      >
                        {updatingId === req.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        Approuver
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(req, "rejected")}
                        disabled={updatingId === req.id}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 font-medium py-2 rounded-xl text-xs transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Rejeter
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bookings per partner */}
        <div className="border-b border-border pb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-gold" />
            <h2 className="font-display text-base font-semibold text-foreground">Bookings par partenaire</h2>
          </div>
          {passStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun booking pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {passStats.map((stat) => (
                <div key={stat.place_name} className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3">
                  <span className="text-sm text-foreground font-medium truncate mr-3">{stat.place_name}</span>
                  <span className="text-sm font-bold text-gold whitespace-nowrap">{stat.count} clients</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload vibe */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Image className="w-4 h-4 text-gold" />
            <h2 className="font-display text-base font-semibold text-foreground">Poster une vibe</h2>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border hover:border-gold/50 bg-surface transition-colors flex flex-col items-center justify-center gap-3 overflow-hidden"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-gold" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Sélectionner une photo</p>
                  <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WebP</p>
                </div>
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          <div className="space-y-3 mt-4">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption…"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
            />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Lieu…"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
            />
            <button
              onClick={handleSubmit}
              disabled={!file || uploading}
              className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Upload…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Publier
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-xl p-3 mt-3"
              >
                <Check className="w-4 h-4 text-gold" />
                <span className="text-sm text-gold font-medium">Vibe publiée !</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
