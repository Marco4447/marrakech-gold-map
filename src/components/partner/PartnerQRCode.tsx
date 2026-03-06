import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Download, QrCode, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const BASE_URL = "https://marrakech-gold-map.lovable.app";

interface Props {
  userId: string;
  placeId: string | null;
}

type PrintFormat = "poster" | "table" | "sticker";

export default function PartnerQRCode({ userId, placeId }: Props) {
  const [slug, setSlug] = useState<string | null>(null);
  const [placeName, setPlaceName] = useState("");
  const [loading, setLoading] = useState(true);
  const [format, setFormat] = useState<PrintFormat>("poster");

  useEffect(() => {
    if (!placeId) { setLoading(false); return; }
    const load = async () => {
      const { data } = await supabase
        .from("places")
        .select("name, slug" as any)
        .eq("id", placeId)
        .single();
      if (data) {
        setSlug((data as any).slug);
        setPlaceName(data.name);
      }
      setLoading(false);
    };
    load();
  }, [placeId]);

  const qrUrl = slug ? `${BASE_URL}/go/${slug}` : null;

  const handleDownload = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !qrUrl) return;

    const sizes: Record<PrintFormat, { w: string; h: string; qr: number; titleSize: string }> = {
      poster: { w: "210mm", h: "297mm", qr: 300, titleSize: "36px" },
      table: { w: "100mm", h: "140mm", qr: 180, titleSize: "22px" },
      sticker: { w: "80mm", h: "80mm", qr: 140, titleSize: "16px" },
    };
    const s = sizes[format];

    printWindow.document.write(`<!DOCTYPE html><html><head><title>QR - ${placeName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { width: ${s.w}; height: ${s.h}; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; background: #0a0a08; color: #F5E6A3; text-align: center; gap: 20px; }
        .title { font-size: ${s.titleSize}; font-weight: 900; letter-spacing: 0.05em; }
        .qr-wrap { background: white; padding: 16px; border-radius: 16px; }
        .cta { font-size: 14px; letter-spacing: 0.15em; text-transform: uppercase; opacity: 0.7; }
        .url { font-size: 11px; opacity: 0.4; margin-top: 8px; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>
        <div class="title">${placeName}</div>
        <div class="qr-wrap"><img src="" id="qr" width="${s.qr}" height="${s.qr}" /></div>
        <div class="cta">✨ Scan to unlock VIP perks ✨</div>
        <div class="url">${qrUrl}</div>
      </body></html>`);

    // Render QR to canvas and inject
    setTimeout(() => {
      const svg = document.querySelector("#partner-qr-svg svg") as SVGSVGElement;
      if (!svg) return;
      const canvas = document.createElement("canvas");
      canvas.width = s.qr;
      canvas.height = s.qr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const img = new Image();
      const svgData = new XMLSerializer().serializeToString(svg);
      img.onload = () => {
        ctx.drawImage(img, 0, 0, s.qr, s.qr);
        const qrImg = printWindow.document.getElementById("qr") as HTMLImageElement;
        if (qrImg) qrImg.src = canvas.toDataURL("image/png");
        setTimeout(() => printWindow.print(), 300);
      };
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    }, 100);
  };

  if (loading) return <Loader2 className="w-5 h-5 text-gold animate-spin mx-auto my-8" />;

  if (!placeId || !slug) {
    return (
      <div className="text-center py-12 space-y-3">
        <QrCode className="w-10 h-10 text-gold/30 mx-auto" />
        <p className="text-sm text-muted-foreground">Lie ton compte à un lieu pour générer ton QR code permanent.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* QR Preview */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card/80 border border-gold/20 rounded-2xl p-6 flex flex-col items-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold/60 font-semibold mb-3">QR Code permanent</p>
        <h3 className="font-display text-lg font-bold text-foreground mb-4">{placeName}</h3>
        <div id="partner-qr-svg" className="bg-white p-4 rounded-2xl">
          <QRCodeSVG
            value={qrUrl!}
            size={200}
            level="H"
            imageSettings={{
              src: "/logo_72.png",
              x: undefined,
              y: undefined,
              height: 32,
              width: 32,
              excavate: true,
            }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">{qrUrl}</p>
      </motion.div>

      {/* Format selector */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Format d'impression</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: "poster" as PrintFormat, label: "Poster", desc: "A4" },
            { key: "table" as PrintFormat, label: "Table", desc: "10×14cm" },
            { key: "sticker" as PrintFormat, label: "Sticker", desc: "8×8cm" },
          ]).map((f) => (
            <button key={f.key} onClick={() => setFormat(f.key)}
              className={`py-3 rounded-xl text-center transition-all ${
                format === f.key
                  ? "bg-gold/15 border border-gold/30 text-gold"
                  : "bg-surface border border-border text-muted-foreground"
              }`}>
              <p className="text-xs font-bold">{f.label}</p>
              <p className="text-[10px] opacity-60">{f.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Download */}
      <button onClick={handleDownload}
        className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-primary-foreground active:scale-[0.98] transition-all"
        style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
      >
        <Download className="w-4 h-4" /> Télécharger le QR ({format})
      </button>
    </div>
  );
}
