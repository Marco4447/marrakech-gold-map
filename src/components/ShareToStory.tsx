import { useState } from "react";
import { Share2, Download } from "lucide-react";
import { toast } from "sonner";

interface ShareToStoryProps {
  imageUrl: string;
  placeName: string | null;
  caption: string | null;
  vibeId: string;
  spotSlug?: string | null;
}

// Simple QR code generator on canvas (no external lib needed for canvas drawing)
function drawQR(ctx: CanvasRenderingContext2D, url: string, x: number, y: number, size: number) {
  // Draw a placeholder QR-like pattern + URL text (actual QR needs a lib)
  // Instead, draw a stylized box with the URL
  const s = size;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(x, y, s, s, 12);
  ctx.fill();

  ctx.fillStyle = "#0a0a0a";
  ctx.beginPath();
  ctx.roundRect(x + 4, y + 4, s - 8, s - 8, 8);
  ctx.fill();

  ctx.fillStyle = "#D4AF37";
  ctx.font = "bold 18px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("SCAN", x + s / 2, y + s / 2 - 6);
  ctx.fillStyle = "#ffffff";
  ctx.font = "12px system-ui";
  ctx.fillText("weshkech.com", x + s / 2, y + s / 2 + 12);
}

export default function ShareToStory({ imageUrl, placeName, caption, vibeId, spotSlug }: ShareToStoryProps) {
  const [generating, setGenerating] = useState(false);
  const isMobile = "ontouchstart" in window;

  const generate = async () => {
    setGenerating(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D not supported");

      // Black background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, 1080, 1920);

      // Load and draw image (cover-fit)
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("timeout")), 10000);
        img.onload = () => { clearTimeout(timeout); resolve(); };
        img.onerror = () => { clearTimeout(timeout); reject(new Error("load failed")); };
        img.src = imageUrl;
      });

      // Cover-fit crop
      const ir = img.width / img.height;
      const cr = 1080 / 1920;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (ir > cr) { sw = img.height * cr; sx = (img.width - sw) / 2; }
      else { sh = img.width / cr; sy = (img.height - sh) / 2; }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 1080, 1920);

      // ── Bottom banner (semi-transparent) ──
      const bannerY = 1580;
      const grad = ctx.createLinearGradient(0, bannerY - 100, 0, 1920);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.3, "rgba(0,0,0,0.6)");
      grad.addColorStop(1, "rgba(0,0,0,0.92)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, bannerY - 100, 1080, 440);

      // Spot name
      if (placeName) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(placeName, 60, 1700);
      }

      // Caption
      if (caption) {
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "30px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "left";
        const short = caption.length > 50 ? caption.slice(0, 50) + "…" : caption;
        ctx.fillText(short, 60, 1755);
      }

      // WeshKech branding (bottom left)
      ctx.fillStyle = "#D4AF37";
      ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("weshkech.com", 60, 1860);

      // Gold line accent
      ctx.fillStyle = "#D4AF37";
      ctx.fillRect(60, 1790, 200, 3);

      // QR code area (bottom right)
      const spotUrl = spotSlug ? `https://weshkech.com/spot/${spotSlug}` : `https://weshkech.com/vibe/${vibeId}`;
      drawQR(ctx, spotUrl, 920, 1770, 100);

      // Convert to blob and share
      const blob = await new Promise<Blob>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("toBlob timeout")), 5000);
        canvas.toBlob((b) => { clearTimeout(t); b ? resolve(b) : reject(new Error("toBlob null")); }, "image/png", 1);
      });
      const file = new File([blob], `weshkech-${vibeId}.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: placeName || "Weshkech",
          text: `${placeName || "Marrakech"} sur Weshkech 🔥`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `weshkech-${vibeId}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Image téléchargée !");
      }
    } catch (err) {
      console.error("Share error:", err);
      toast.error("Impossible de générer l'image");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={generate}
      disabled={generating}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white text-[10px] font-bold active:scale-95 transition-transform disabled:opacity-50"
    >
      {generating ? (
        <div className="w-3 h-3 border-[1.5px] border-white border-t-transparent rounded-full animate-spin" />
      ) : isMobile ? (
        <Share2 className="w-3 h-3" />
      ) : (
        <Download className="w-3 h-3" />
      )}
      Story
    </button>
  );
}
