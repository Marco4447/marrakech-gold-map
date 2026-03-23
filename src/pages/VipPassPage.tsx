import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface PassData {
  id: string;
  status: string;
  expires_at: string;
  generated_at: string;
  offer: {
    title: string;
    description: string;
    perk_type: string;
    place: {
      name: string;
      image_url: string | null;
    };
  };
}

const BASE_URL = "https://weshkech.com";

export default function VipPassPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pass, setPass] = useState<PassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!id) { navigate("/"); return; }
    const load = async () => {
      const { data } = await supabase
        .from("vip_passes" as any)
        .select("id, status, expires_at, generated_at, offer_id")
        .eq("id", id)
        .single();

      if (!data) { navigate("/"); return; }

      // Fetch offer details
      const { data: offer } = await supabase
        .from("vip_offers" as any)
        .select("title, description, perk_type, place_id")
        .eq("id", (data as any).offer_id)
        .single();

      if (!offer) { navigate("/"); return; }

      // Fetch place
      const { data: place } = await supabase
        .from("places")
        .select("name, image_url")
        .eq("id", (offer as any).place_id)
        .single();

      setPass({
        id: (data as any).id,
        status: (data as any).status,
        expires_at: (data as any).expires_at,
        generated_at: (data as any).generated_at,
        offer: {
          title: (offer as any).title,
          description: (offer as any).description,
          perk_type: (offer as any).perk_type,
          place: { name: place?.name || "—", image_url: place?.image_url || null },
        },
      });
      setLoading(false);
    };
    load();
  }, [id]);

  // Countdown
  useEffect(() => {
    if (!pass) return;
    const update = () => {
      const diff = new Date(pass.expires_at).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Expiré"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`);
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [pass]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!pass) return null;

  const isExpired = new Date(pass.expires_at) < new Date();
  const isRedeemed = pass.status === "redeemed";
  const isValid = pass.status === "active" && !isExpired;
  const scanUrl = `${BASE_URL}/scan?pass=${pass.id}`;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-surface flex items-center justify-center active:scale-95 transition-transform">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <h1 className="font-display text-lg font-bold text-foreground">Mon Pass VIP</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm"
        >
          {/* Pass card */}
          <div className={`rounded-3xl overflow-hidden border-2 ${
            isValid ? "border-gold/40" : isRedeemed ? "border-green-500/30" : "border-destructive/30"
          }`}>
            {/* Top */}
            <div className="p-6 text-center" style={{
              background: isValid
                ? "linear-gradient(135deg, #1a1508, #2a2010)"
                : "hsl(var(--card))"
            }}>
              <p className="text-2xs uppercase tracking-[0.2em] text-gold/60 font-semibold mb-2">VIP PASS</p>
              <h2 className="font-display text-xl font-black text-foreground">{pass.offer.place.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{pass.offer.title}</p>

              {/* Status badge */}
              <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-bold ${
                isValid
                  ? "bg-gold/15 text-gold"
                  : isRedeemed
                  ? "bg-green-500/15 text-green-400"
                  : "bg-destructive/15 text-destructive"
              }`}>
                {isValid && <Clock className="w-3 h-3" />}
                {isRedeemed && <CheckCircle2 className="w-3 h-3" />}
                {isExpired && !isRedeemed && <XCircle className="w-3 h-3" />}
                {isValid ? timeLeft : isRedeemed ? "UTILISÉ" : "EXPIRÉ"}
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="border-t border-dashed border-border" />
              <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-background" />
              <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-background" />
            </div>

            {/* QR */}
            <div className="p-6 bg-card flex flex-col items-center">
              {isValid ? (
                <>
                  <div className="bg-white p-3 rounded-2xl">
                    <QRCodeSVG
                      value={scanUrl}
                      size={180}
                      level="M"
                      imageSettings={{
                        src: "/logo_72.png",
                        x: undefined,
                        y: undefined,
                        height: 28,
                        width: 28,
                        excavate: true,
                      }}
                    />
                  </div>
                  <p className="text-2xs text-muted-foreground mt-3 text-center">
                    Montre ce QR code au staff pour valider
                  </p>
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {isRedeemed ? "Ce pass a déjà été utilisé" : "Ce pass a expiré"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <p className="text-2xs text-muted-foreground/50 text-center mt-4">
            {pass.offer.description}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
