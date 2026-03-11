import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BoostUpsell from "@/components/BoostUpsell";
import { Camera, X, Loader2, Send, MapPin, Video, Check, Trash2, Star, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { validateMediaFile, processMediaForUpload, IG_MAX_VIDEO_BYTES, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } from "@/lib/mediaProcessor";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SIX_HOURS = 6 * 60 * 60 * 1000;
const MAX_POSTS_PER_WINDOW = 3;
const GLOBAL_TIMEOUT_MS = 30000;
const MAX_VIDEO_DURATION = 5; // seconds
const MAX_PHOTO_SIZE_BYTES = 8 * 1024 * 1024; // 8MB (Instagram-like)
const MAX_VIDEO_SIZE_BYTES = IG_MAX_VIDEO_BYTES; // 50MB

interface FlashPostProps {
  open: boolean;
  onClose: () => void;
  onPosted?: () => void;
  /** Pre-fill place name for Auto-Vibe flow */
  initialPlace?: string | null;
}

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif", "gif", "avif"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm", "m4v", "3gp", "avi"]);

const inferMediaKind = (f: File): "photo" | "video" | null => {
  if (f.type.startsWith("image/")) return "photo";
  if (f.type.startsWith("video/")) return "video";

  const ext = f.name.split(".").pop()?.toLowerCase() || "";
  if (IMAGE_EXTENSIONS.has(ext)) return "photo";
  if (VIDEO_EXTENSIONS.has(ext)) return "video";

  return null;
};
const MOODS = [
  { key: "hot", emoji: "🔥", label: "Hot", color: "hsl(15,80%,50%)" },
  { key: "chill", emoji: "🍸", label: "Chill", color: "hsl(200,60%,50%)" },
  { key: "secret", emoji: "✨", label: "Secret", color: "hsl(280,60%,55%)" },
  { key: "foodie", emoji: "🥗", label: "Foodie", color: "hsl(120,50%,45%)" },
] as const;

// Circular progress ring for video recording
function RecordingRing({ progress, size = 80 }: { progress: number; size?: number }) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  return (
    <svg width={size} height={size} className="absolute inset-0 -rotate-90 pointer-events-none">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} opacity={0.3} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="hsl(15,80%,50%)" strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-[stroke-dashoffset] duration-100"
      />
    </svg>
  );
}

// Success confetti animation
function SuccessAnimation({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <motion.div
      className="fixed inset-0 z-[2600] flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.3, 1] }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-24 h-24 rounded-full bg-gold/20 backdrop-blur-xl flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Check className="w-12 h-12 text-gold" strokeWidth={3} />
        </motion.div>
      </motion.div>
      {/* Confetti particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{ background: ["hsl(43,76%,52%)", "hsl(15,80%,50%)", "hsl(280,60%,55%)", "hsl(200,60%,50%)"][i % 4] }}
          initial={{ x: 0, y: 0, scale: 0 }}
          animate={{
            x: Math.cos((i * 30 * Math.PI) / 180) * (80 + Math.random() * 40),
            y: Math.sin((i * 30 * Math.PI) / 180) * (80 + Math.random() * 40),
            scale: [0, 1.2, 0],
            opacity: [0, 1, 0],
          }}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
        />
      ))}
    </motion.div>
  );
}

export default function FlashPost({ open, onClose, onPosted, initialPlace }: FlashPostProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"photo" | "video">("photo");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [postLimitReached, setPostLimitReached] = useState(false);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoName, setGeoName] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [nearbyPlace, setNearbyPlace] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showBoostUpsell, setShowBoostUpsell] = useState(false);
  const [isOfficial, setIsOfficial] = useState(false);
  const [isPartner, setIsPartner] = useState(false);
  const [partnerCredits, setPartnerCredits] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Video recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStart = useRef<number>(0);
  const chunksRef = useRef<Blob[]>([]);

  // Check if user is partner
  useEffect(() => {
    if (!user || !open) return;
    const checkPartner = async () => {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "partner")
        .single();
      const hasPartnerRole = !!roleData;
      setIsPartner(hasPartnerRole);
      if (hasPartnerRole) {
        const { data: creditData } = await supabase
          .from("partner_credits")
          .select("credits")
          .eq("user_id", user.id)
          .single();
        setPartnerCredits(creditData?.credits ?? 0);
      }
    };
    checkPartner();
  }, [user, open]);

  // Check post limit on open
  const checkPostLimit = useCallback(() => {
    // Désactivé pour éviter les faux blocages entre mobile / navigation privée
    setPostLimitReached(false);
  }, []);

  // Auto-get geolocation + nearest place
  const getGeo = useCallback(async () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGeoLocation(coords);
        setGeoLoading(false);

        // Try to find nearest place
        try {
          const { data } = await supabase.from("places").select("name, latitude, longitude");
          if (data && data.length > 0) {
            let nearest = data[0];
            let minDist = Infinity;
            data.forEach((p: any) => {
              const d = Math.sqrt((p.latitude - coords.lat) ** 2 + (p.longitude - coords.lng) ** 2);
              if (d < minDist) { minDist = d; nearest = p; }
            });
            // Within ~200m
            if (minDist < 0.002) {
              setNearbyPlace(nearest.name);
              setGeoName(nearest.name);
            }
          }
        } catch { /* ignore */ }
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Auto-fill place from Auto-Vibe
  useEffect(() => {
    if (open && initialPlace) {
      setGeoName(initialPlace);
      setNearbyPlace(initialPlace);
    }
  }, [open, initialPlace]);

  const doFetch = async (url: string, options: RequestInit, token: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers as Record<string, string>,
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`HTTP_${res.status}: ${msg}`);
      }
      return res;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // === CAPTURE HANDLERS ===

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const f = input.files?.[0];
    input.value = "";

    if (!f) return;

    const mediaKind = inferMediaKind(f);
    if (!mediaKind) {
      toast.error("Format non supporté", {
        description: "Choisis une photo (JPG/PNG/HEIC) ou une vidéo (MP4/WebM).",
      });
      return;
    }

    // Validate with Instagram-like constraints
    const check = validateMediaFile(f, "feed");
    if (!check.valid) {
      toast.error("Fichier non valide", { description: check.error });
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setMediaType(mediaKind);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    checkPostLimit();
    getGeo();
  };

  // Long press for video recording
  const handleCaptureStart = () => {
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      startVideoRecording();
    }, 400);
  };

  const handleCaptureEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (isRecording) {
      stopVideoRecording();
    } else if (!isLongPress) {
      // Short tap = open camera
      fileRef.current?.click();
    }
    setIsLongPress(false);
  };

  const handleCaptureCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isRecording) {
      stopVideoRecording();
    }

    setIsLongPress(false);
  };

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      streamRef.current = stream;
      chunksRef.current = [];

      // Use mp4 on Safari/iOS, webm elsewhere
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : MediaRecorder.isTypeSupported("video/mp4")
          ? "video/mp4"
          : "";
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const recordedType = recorder.mimeType || "video/mp4";
        const recordedExt = recordedType.includes("webm") ? "webm" : "mp4";
        const blob = new Blob(chunksRef.current, { type: recordedType });
        const videoFile = new File([blob], `vibe-${Date.now()}.${recordedExt}`, { type: recordedType });
        setFile(videoFile);
        setPreview(URL.createObjectURL(blob));
        setMediaType("video");
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        checkPostLimit();
        getGeo();
      };

      recorder.start(100);
      setIsRecording(true);
      recordingStart.current = Date.now();

      recordingInterval.current = setInterval(() => {
        const elapsed = (Date.now() - recordingStart.current) / 1000;
        const progress = Math.min(elapsed / MAX_VIDEO_DURATION, 1);
        setRecordingProgress(progress);
        if (elapsed >= MAX_VIDEO_DURATION) {
          stopVideoRecording();
        }
      }, 50);
    } catch (err) {
      console.error("Camera access denied:", err);
      toast.error("Accès caméra refusé", { description: "Autorise l'accès à la caméra pour filmer." });
      setIsLongPress(false);
    }
  };

  const stopVideoRecording = () => {
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingProgress(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (recordingInterval.current) clearInterval(recordingInterval.current);
    };
  }, []);

  const handleUpload = async () => {
    const manualLocation = geoName.trim();

    if (!file) return;

    if (postLimitReached) {
      toast.error("Limite atteinte", {
        description: "Attends un peu puis réessaie.",
      });
      return;
    }

    if (!selectedMood) {
      toast.error("Mood requis", {
        description: "Choisis un mood avant de publier.",
      });
      return;
    }

    if (!manualLocation && !geoLocation) {
      toast.error("Lieu requis", {
        description: "Renseigne un lieu ou active la localisation.",
      });
      return;
    }

    let resolvedLocation = manualLocation || (geoLocation ? `${geoLocation.lat.toFixed(5)}, ${geoLocation.lng.toFixed(5)}` : "");
    let resolvedCoords = geoLocation;

    // Fallback mobile: si GPS refusé, essaie de retrouver les coordonnées via le nom du lieu
    if (!resolvedCoords && manualLocation) {
      try {
        const { data: matchedPlace } = await supabase
          .from("places")
          .select("name, latitude, longitude")
          .ilike("name", `%${manualLocation}%`)
          .limit(1)
          .maybeSingle();

        if (matchedPlace?.latitude != null && matchedPlace?.longitude != null) {
          resolvedCoords = {
            lat: matchedPlace.latitude,
            lng: matchedPlace.longitude,
          };
          resolvedLocation = matchedPlace.name || manualLocation;
        }
      } catch {
        // On continue même sans coordonnées (Live d'abord)
      }
    }

    if (!resolvedLocation) {
      toast.error("Lieu requis", {
        description: "Saisis un lieu avant d'envoyer.",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(5);

    try {
      // Process image (resize/compress to Instagram specs) or validate video duration
      const processed = await processMediaForUpload(file, "feed");
      const uploadFile = processed.file;
      const finalMediaType = processed.mediaType;
      if (processed.wasProcessed) {
        console.log("Image processed: resized & compressed to IG specs");
      }

      setUploadProgress(15);

      const globalTimeout = setTimeout(() => {
        console.error("Upload global timeout reached");
        toast.error("Envoi trop long", { description: "Réessaie avec une meilleure connexion." });
        setUploading(false);
        setUploadProgress(0);
      }, GLOBAL_TIMEOUT_MS);

    
      let token = SUPABASE_PUBLISHABLE_KEY;
      try {
        const sessionPromise = supabase.auth.getSession();
        const sessionResult = await Promise.race([
          sessionPromise,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("SESSION_TIMEOUT")), 9000)),
        ]);
        if (sessionResult.data?.session?.access_token) {
          token = sessionResult.data.session.access_token;
        }
      } catch {
        console.warn("Session fetch failed, using anon key");
      }

      const ext = file.name.split(".").pop() || (mediaType === "video" ? "mp4" : "jpg");
      let fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      setUploadProgress(30);

      const contentType = file.type || (mediaType === "video" ? "video/mp4" : "image/jpeg");

      const uploadMedia = async (name: string) => {
        await doFetch(`${SUPABASE_URL}/storage/v1/object/vibes/${name}`, {
          method: "POST",
          headers: { "content-type": contentType, "x-upsert": "false" },
          body: file,
        }, token);
      };

      try {
        await uploadMedia(fileName);
      } catch (firstError) {
        const msg = String(firstError);
        if (msg.includes("409") || msg.toLowerCase().includes("already exists")) {
          fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-r.${ext}`;
          await uploadMedia(fileName);
        } else {
          throw firstError;
        }
      }

      setUploadProgress(75);
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/vibes/${fileName}`;

      await doFetch(`${SUPABASE_URL}/rest/v1/vibes`, {
        method: "POST",
        headers: { "content-type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          image_url: publicUrl,
          location: resolvedLocation,
          username: user?.user_metadata?.full_name || user?.email?.split("@")[0] || null,
          user_id: user?.id || null,
          caption: null,
          likes: 0,
          mood: selectedMood,
          media_type: mediaType,
          is_official: isOfficial,
          latitude: resolvedCoords?.lat || null,
          longitude: resolvedCoords?.lng || null,
        }),
      }, token);

      // Deduct credit if official
      if (isOfficial && user) {
        await supabase
          .from("partner_credits")
          .update({ credits: Math.max(0, partnerCredits - 1) })
          .eq("user_id", user.id);
        setPartnerCredits((c) => Math.max(0, c - 1));
      }

      // Also create a user story (24h visibility)
      if (user) {
        try {
          await supabase.from("stories" as any).insert({
            source_type: isOfficial ? "partner" : "user",
            user_id: user.id,
            media_url: publicUrl,
            media_type: mediaType,
            badge: isOfficial ? null : "INSIDER",
            caption: null,
            latitude: resolvedCoords?.lat || null,
            longitude: resolvedCoords?.lng || null,
          } as any);
        } catch {}
      }

      const willAppearOnMap = resolvedCoords?.lat != null && resolvedCoords?.lng != null;

      setUploadProgress(100);
      toast.success("Vibe publié", {
        description: willAppearOnMap
          ? "Visible maintenant dans Live Vibes pendant 6h."
          : "Visible maintenant dans Live Vibes. Active le GPS pour l'afficher aussi sur la map.",
      });
      clearTimeout(globalTimeout);

      // Show success animation then close (B2C boost upsell disabled)
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        resetState();
        onPosted?.();
        onClose();
      }, 1200);
    } catch (err) {
      clearTimeout(globalTimeout);
      console.error("Upload error:", err);
      toast.error("Envoi du vibe échoué", {
        description: "Le réseau a interrompu l'envoi. Réessaie avec 4G/Wi‑Fi stable.",
      });
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setMediaType("photo");
    setSelectedMood(null);
    setUploading(false);
    setUploadProgress(0);
    setGeoLocation(null);
    setGeoName("");
    setNearbyPlace(null);
    setShowSuccess(false);
    setIsOfficial(false);
    setPostLimitReached(false);
  };

  const handleClose = () => {
    if (uploading) return;
    stopVideoRecording();
    resetState();
    onClose();
  };

  const missingMood = !selectedMood;
  const missingGeo = !geoLocation && !geoName.trim();

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-background/70 backdrop-blur-md z-[2500]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[2501] max-h-[92vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className="bg-card rounded-t-3xl border-t border-border shadow-2xl">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              <div className="px-6 pb-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Flash Post ⚡
                  </h2>
                  <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Incitation message */}
                <div className="bg-gold/10 border border-gold/20 rounded-xl px-4 py-2.5 mb-4">
                  <p className="text-xs text-gold-light font-medium text-center leading-relaxed">
                    📸 Appui court = Photo · Appui long = Vidéo (5s max)
                  </p>
                </div>

                {postLimitReached && !preview ? (
                  <div className="flex flex-col items-center text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                      <span className="text-2xl">🌟</span>
                    </div>
                    <h3 className="font-display text-base font-semibold text-foreground mb-2">
                      Assez de vibes pour le moment !
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Limite : {MAX_POSTS_PER_WINDOW} vibes par période de 6h
                    </p>
                    <button onClick={handleClose} className="mt-5 w-full bg-surface hover:bg-surface-elevated text-foreground font-medium py-3 rounded-xl transition-colors border border-border">
                      Compris !
                    </button>
                  </div>
                ) : !preview ? (
                  /* Step 1: Hybrid capture */
                  <>
                    <div className="flex flex-col items-center gap-4">
                      {/* Main capture button with long-press */}
                      <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
                        {isRecording && <RecordingRing progress={recordingProgress} size={80} />}
                        <button
                          onPointerDown={handleCaptureStart}
                          onPointerUp={handleCaptureEnd}
                          onPointerCancel={handleCaptureCancel}
                          onPointerLeave={handleCaptureCancel}
                          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all select-none ${
                            isRecording
                              ? "bg-destructive scale-110 shadow-lg shadow-destructive/30"
                              : "bg-gold/10 border-2 border-dashed border-gold/50 hover:border-gold hover:bg-gold/20"
                          }`}
                        >
                          {isRecording ? (
                            <div className="w-5 h-5 rounded-sm bg-card" />
                          ) : (
                            <Camera className="w-7 h-7 text-gold" />
                          )}
                        </button>
                      </div>

                      <div className="text-center">
                        {isRecording ? (
                          <p className="text-sm font-semibold text-destructive">
                            Enregistrement... {Math.ceil(MAX_VIDEO_DURATION - recordingProgress * MAX_VIDEO_DURATION)}s
                          </p>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-foreground">Appui court : Photo</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Appui long : Vidéo (5s max)</p>
                          </>
                        )}
                      </div>

                      {/* Or pick from gallery */}
                      <button
                        onClick={() => galleryRef.current?.click()}
                        className="text-xs text-gold underline underline-offset-2"
                      >
                        Choisir depuis la galerie
                      </button>
                    </div>

                    {/* Camera input (with capture) */}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    {/* Gallery input (no capture = opens file picker) */}
                    <input
                      ref={galleryRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <p className="text-[10px] text-muted-foreground text-center mt-3">
                      Disparaît après 6 heures
                    </p>
                  </>
                ) : (
                  /* Step 2: Mood + Location + Publish */
                  <>
                    {/* Media preview */}
                    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-4">
                      {mediaType === "video" ? (
                        <video
                          ref={videoRef}
                          src={preview}
                          className="w-full h-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={() => { setFile(null); setPreview(null); setSelectedMood(null); setMediaType("photo"); }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/70 backdrop-blur-md flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-foreground" />
                      </button>

                      {/* Media type badge */}
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-background/70 backdrop-blur-md px-2 py-1 rounded-lg">
                        {mediaType === "video" ? (
                          <><Video className="w-3 h-3 text-destructive" /><span className="text-[10px] text-foreground font-medium">Vidéo</span></>
                        ) : (
                          <><Camera className="w-3 h-3 text-gold" /><span className="text-[10px] text-foreground font-medium">Photo</span></>
                        )}
                      </div>

                      {/* Geo badge */}
                      {geoLocation && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-background/70 backdrop-blur-md px-2 py-1 rounded-lg">
                          <MapPin className="w-3 h-3 text-gold" />
                          <span className="text-[10px] text-foreground">📍 Localisé</span>
                        </div>
                      )}
                      {geoLoading && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-background/70 backdrop-blur-md px-2 py-1 rounded-lg">
                          <Loader2 className="w-3 h-3 text-gold animate-spin" />
                          <span className="text-[10px] text-foreground">Localisation...</span>
                        </div>
                      )}
                    </div>

                    {/* Mood selector */}
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">
                      Choisis ton mood
                    </p>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {MOODS.map((mood) => (
                        <button
                          key={mood.key}
                          onClick={() => setSelectedMood(mood.key)}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                            selectedMood === mood.key
                              ? "border-gold bg-gold/15 scale-105"
                              : "border-border bg-surface hover:border-gold/30"
                          }`}
                        >
                          <span className="text-2xl">{mood.emoji}</span>
                          <span className={`text-[10px] font-semibold ${selectedMood === mood.key ? "text-gold" : "text-muted-foreground"}`}>
                            {mood.label}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Official Vibe option for partners */}
                    {isPartner && (
                      <div className="mb-4">
                        <button
                          onClick={() => {
                            if (partnerCredits <= 0) {
                              onClose();
                              navigate("/shop");
                              return;
                            }
                            setIsOfficial(!isOfficial);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                            isOfficial
                              ? "border-gold bg-gold/10"
                              : "border-border bg-surface hover:border-gold/30"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Star className={`w-5 h-5 ${isOfficial ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                            <div className="text-left">
                              <p className={`text-sm font-semibold ${isOfficial ? "text-gold" : "text-foreground"}`}>
                                Vibe Officielle ⭐
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Épinglée en haut · Visible partout · 1 crédit
                              </p>
                            </div>
                          </div>
                          {partnerCredits > 0 ? (
                            <span className="text-xs font-bold text-gold bg-gold/10 px-2 py-1 rounded-lg">
                              {partnerCredits} cr.
                            </span>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Acheter</span>
                            </div>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Location with nearby suggestion */}
                    <div className="mb-4">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5 mb-1">
                        <MapPin className="w-3 h-3" /> Lieu (obligatoire)
                      </label>

                      {nearbyPlace && geoName === nearbyPlace && (
                        <div className="bg-gold/10 border border-gold/20 rounded-xl px-3 py-2 mb-2 flex items-center justify-between">
                          <p className="text-xs text-foreground font-medium">
                            📍 Vous êtes au <strong>{nearbyPlace}</strong> ?
                          </p>
                          <Check className="w-4 h-4 text-gold" />
                        </div>
                      )}

                      <input
                        value={geoName}
                        onChange={(e) => setGeoName(e.target.value)}
                        placeholder="Ex: Jemaa el-Fna"
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
                      />
                      <p className="mt-1.5 text-[10px] text-muted-foreground">
                        GPS recommandé pour apparaître sur la map. Sans GPS, ton vibe reste visible en Live Vibes.
                      </p>
                    </div>

                    {/* Progress bar */}
                    {uploading && (
                      <div className="mb-4">
                        <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gold rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          {uploadProgress < 70 ? "Envoi en cours…" : uploadProgress < 100 ? "Presque terminé…" : "Publié !"}
                        </p>
                      </div>
                    )}

                    {/* Publish button */}
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
                    >
                      {uploading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />Envoi...</>
                      ) : (
                        <><Send className="w-4 h-4" />Publier mon vibe</>
                      )}
                    </button>
                    {missingMood && (
                      <p className="text-[11px] text-destructive text-center mt-2">
                        Choisis un mood avant l'envoi.
                      </p>
                    )}
                    {missingGeo && (
                      <p className="text-[11px] text-destructive text-center mt-2">
                        Ajoute un lieu (ou active le GPS) pour publier.
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground text-center mt-3">
                      Visible pendant 6 heures uniquement
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          <SuccessAnimation show={showSuccess} />

          <BoostUpsell
            show={showBoostUpsell}
            onClose={() => {
              setShowBoostUpsell(false);
              resetState();
              onPosted?.();
              onClose();
            }}
            onBoost={(tier) => {
              setShowBoostUpsell(false);
              resetState();
              onPosted?.();
              onClose();
              toast.success(`Boost "${tier}" bientôt disponible ! 🚀`);
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
}
