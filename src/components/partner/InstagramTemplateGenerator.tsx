import { useState } from "react";
import { Download, Instagram } from "lucide-react";
import { toast } from "sonner";

interface Props {
  placeName: string;
  category?: string | null;
  offer?: string | null;
}

function drawZelligePattern(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(212,146,30,0.12)";
  ctx.lineWidth = 1;
  const gap = 60;
  // Diamond grid pattern
  for (let x = -gap; x < w + gap; x += gap) {
    for (let y = -gap; y < h + gap; y += gap) {
      ctx.beginPath();
      ctx.moveTo(x, y - gap / 2);
      ctx.lineTo(x + gap / 2, y);
      ctx.lineTo(x, y + gap / 2);
      ctx.lineTo(x - gap / 2, y);
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, maxWidth: number, lineHeight: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export default function InstagramTemplateGenerator({ placeName, category, offer }: Props) {
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const S = 1080;
      const canvas = document.createElement("canvas");
      canvas.width = S;
      canvas.height = S;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      // ── Background ──
      ctx.fillStyle = "#1C1209";
      ctx.fillRect(0, 0, S, S);

      // ── Zellige pattern ──
      drawZelligePattern(ctx, S, S);

      // ── Subtle gradient overlay ──
      const grad = ctx.createRadialGradient(S / 2, S / 2, 100, S / 2, S / 2, S);
      grad.addColorStop(0, "rgba(212,146,30,0.06)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, S, S);

      // ── Category ──
      if (category) {
        ctx.fillStyle = "#D4921E";
        ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.letterSpacing = "6px";
        ctx.fillText(category.toUpperCase(), S / 2, 380);
      }

      // ── Spot name ──
      ctx.fillStyle = "#F8EEE0";
      ctx.font = "900 72px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      const lines = wrapText(ctx, placeName.toUpperCase(), S / 2, S - 160, 85);
      const startY = 480 - ((lines.length - 1) * 85) / 2;
      lines.forEach((line, i) => {
        ctx.fillText(line, S / 2, startY + i * 85);
      });

      // ── Ochre accent line ──
      ctx.fillStyle = "#D4921E";
      ctx.fillRect(S / 2 - 60, startY + lines.length * 85 + 20, 120, 4);

      // ── VIP Offer ──
      if (offer) {
        const offerY = startY + lines.length * 85 + 60;
        // Box
        ctx.fillStyle = "rgba(196,74,42,0.2)";
        ctx.strokeStyle = "rgba(196,74,42,0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(S / 2 - 220, offerY, 440, 60, 16);
        ctx.fill();
        ctx.stroke();
        // Text
        ctx.fillStyle = "#F8EEE0";
        ctx.font = "bold 24px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(`🎁 ${offer}`, S / 2, offerY + 38);
      }

      // ── Bottom left: location ──
      ctx.fillStyle = "rgba(248,238,224,0.5)";
      ctx.font = "600 24px system-ui";
      ctx.textAlign = "left";
      ctx.fillText("📍 Marrakech", 60, S - 60);

      // ── Bottom right: branding ──
      ctx.fillStyle = "#D4921E";
      ctx.font = "bold 28px system-ui";
      ctx.textAlign = "right";
      ctx.fillText("weshkech.com", S - 60, S - 60);

      // ── Top corners: decorative dots ──
      ctx.fillStyle = "rgba(212,146,30,0.2)";
      [40, 1040].forEach(x => {
        [40, 1040].forEach(y => {
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      // ── Download ──
      const blob = await new Promise<Blob>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("timeout")), 5000);
        canvas.toBlob((b) => { clearTimeout(t); b ? resolve(b) : reject(new Error("null")); }, "image/png", 1);
      });

      const slug = placeName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `weshkech-${slug}-instagram.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Image téléchargée !");
    } catch (err) {
     
      toast.error("Erreur de génération");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-2xs uppercase tracking-wide text-[var(--text-muted)] font-semibold">Template Instagram</p>
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
        <p className="text-sm text-[var(--text-primary)]">
          Génère un visuel <span className="font-bold text-[var(--ochre)]">1080×1080</span> prêt à poster sur Instagram avec le nom de ton spot et ton offre VIP.
        </p>
        <button
          onClick={generate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 bg-[var(--ochre)] text-[var(--bg-primary)] font-black uppercase text-sm rounded-xl px-6 py-3 active:scale-[0.97] transition-transform disabled:opacity-50"
        >
          {generating ? (
            <div className="w-4 h-4 border-2 border-[var(--bg-primary)] border-t-transparent rounded-full animate-spin" />
          ) : (
            <><Instagram className="w-4 h-4" /> Générer mon post Instagram</>
          )}
        </button>
      </div>
    </div>
  );
}
