import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, CheckCircle2, XCircle, AlertTriangle, Loader2, ArrowLeft, Camera, KeyboardIcon } from "lucide-react";
import QrScanner from "qr-scanner";
import GoldConfetti from "@/components/GoldConfetti";

type ScanResult = {
  status: "valid" | "already_used" | "expired" | "invalid" | "max_reached" | "error";
  offer_title?: string;
  place_name?: string;
  message?: string;
};

export default function ScanPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualId, setManualId] = useState("");
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const passId = searchParams.get("pass");

  const validate = async (pid: string) => {
    if (!pid || !user) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("validate-vip-pass", {
        body: { pass_id: pid },
      });
      if (error) throw error;
      setResult(data as ScanResult);
    } catch (e: any) {
      setResult({ status: "error", message: e?.message || "Erreur de validation" });
    } finally {
      setLoading(false);
    }
  };

  // Extract pass ID from scanned URL or raw ID
  const extractPassId = (raw: string): string | null => {
    try {
      const url = new URL(raw);
      return url.searchParams.get("pass") || url.pathname.split("/pass/").pop() || null;
    } catch {
      // Not a URL, treat as raw ID (UUID format)
      const trimmed = raw.trim();
      if (trimmed.length >= 20) return trimmed;
      return null;
    }
  };

  useEffect(() => {
    if (passId && user && !authLoading) {
      validate(passId);
    }
  }, [passId, user, authLoading]);

  // Camera scanner lifecycle
  useEffect(() => {
    if (!cameraMode || !videoRef.current) return;

    setCameraError(null);
    const scanner = new QrScanner(
      videoRef.current,
      (scanResult) => {
        const pid = extractPassId(scanResult.data);
        if (pid) {
          scanner.stop();
          setCameraMode(false);
          validate(pid);
        }
      },
      {
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: "environment",
      }
    );

    scannerRef.current = scanner;
    scanner.start().catch((err) => {
      setCameraError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      setCameraMode(false);
    });

    return () => {
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;
    };
  }, [cameraMode, user]);

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4 px-6">
        <QrCode className="w-12 h-12 text-gold/40" />
        <p className="text-muted-foreground text-center">Connecte-toi avec ton compte partenaire pour scanner les passes VIP.</p>
        <button onClick={() => navigate("/")} className="text-gold underline text-sm">Retour</button>
      </div>
    );
  }

  const getStatusUI = () => {
    if (!result) return null;
    switch (result.status) {
      case "valid":
        return {
          icon: CheckCircle2,
          color: "text-green-400",
          bg: "bg-green-500/10 border-green-500/30",
          title: "✅ VALIDÉ",
          subtitle: result.offer_title || "Pass accepté",
        };
      case "already_used":
        return {
          icon: XCircle,
          color: "text-orange-400",
          bg: "bg-orange-500/10 border-orange-500/30",
          title: "⚠️ DÉJÀ UTILISÉ",
          subtitle: "Ce pass a déjà été validé",
        };
      case "expired":
        return {
          icon: XCircle,
          color: "text-destructive",
          bg: "bg-destructive/10 border-destructive/30",
          title: "❌ EXPIRÉ",
          subtitle: "Ce pass n'est plus valide",
        };
      case "max_reached":
        return {
          icon: AlertTriangle,
          color: "text-orange-400",
          bg: "bg-orange-500/10 border-orange-500/30",
          title: "🚫 LIMITE ATTEINTE",
          subtitle: "Le nombre maximum de validations a été atteint",
        };
      default:
        return {
          icon: XCircle,
          color: "text-destructive",
          bg: "bg-destructive/10 border-destructive/30",
          title: "❌ INVALIDE",
          subtitle: result.message || "Pass introuvable",
        };
    }
  };

  const statusUI = getStatusUI();

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative">
      {/* Confetti on valid scan */}
      {result?.status === "valid" && <GoldConfetti />}

      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3 border-b border-border">
        <button onClick={() => { if (cameraMode) { setCameraMode(false); } else { navigate("/"); } }}
          className="w-9 h-9 rounded-full bg-surface flex items-center justify-center active:scale-95">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div>
          <h1 className="font-display text-lg font-bold text-foreground">Scanner VIP</h1>
          <p className="text-xs text-muted-foreground">
            {cameraMode ? "Pointez la caméra vers le QR code" : "Scannez les passes clients"}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Vérification en cours…</p>
            </motion.div>
          ) : statusUI ? (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className={`w-full max-w-sm rounded-3xl border-2 ${statusUI.bg} p-8 text-center space-y-4`}>
              <statusUI.icon className={`w-16 h-16 mx-auto ${statusUI.color}`} />
              <h2 className="font-display text-2xl font-black text-foreground">{statusUI.title}</h2>
              <p className="text-sm text-muted-foreground">{statusUI.subtitle}</p>
              {result?.place_name && (
                <p className="text-xs text-muted-foreground/60">{result.place_name}</p>
              )}
              <button onClick={() => { setResult(null); setManualId(""); }}
                className="mt-4 px-6 py-2.5 rounded-xl bg-gold/15 text-gold text-sm font-semibold">
                Scanner un autre pass
              </button>
            </motion.div>
          ) : cameraMode ? (
            <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="w-full max-w-sm space-y-4 text-center">
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black border-2 border-gold/30">
                <video ref={videoRef} className="w-full h-full object-cover" />
                {/* Corner guides */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-gold rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-gold rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-gold rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-gold rounded-br-lg" />
                </div>
                {/* Scanning line animation */}
                <div className="absolute left-4 right-4 h-0.5 bg-gold/60 animate-[scan-line_2s_ease-in-out_infinite]" />
              </div>
              {cameraError && (
                <p className="text-xs text-destructive">{cameraError}</p>
              )}
              <button
                onClick={() => setCameraMode(false)}
                className="flex items-center justify-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground"
              >
                <KeyboardIcon className="w-4 h-4" />
                Saisie manuelle
              </button>
            </motion.div>
          ) : (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="w-full max-w-sm space-y-6 text-center">
              <QrCode className="w-16 h-16 text-gold/30 mx-auto" />
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Scannez un pass VIP</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Scannez le QR code du client ou entrez l'ID manuellement.
                </p>
              </div>

              {/* Camera button */}
              <button
                onClick={() => setCameraMode(true)}
                className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-gold/15 border border-gold/30 text-gold font-semibold text-sm active:scale-[0.98] transition-transform"
              >
                <Camera className="w-5 h-5" />
                Ouvrir la caméra
              </button>

              {/* Separator */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">ou</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Manual input */}
              <div className="flex gap-2">
                <input
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="ID du pass…"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground"
                />
                <button
                  onClick={() => manualId.trim() && validate(manualId.trim())}
                  disabled={!manualId.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gold/15 text-gold text-sm font-bold disabled:opacity-50">
                  Vérifier
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
