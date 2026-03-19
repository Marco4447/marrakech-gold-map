import { useState } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareToStoryProps {
  imageUrl: string;
  placeName: string | null;
  caption: string | null;
  vibeId: string;
}

// Component renders a button "Partager sur Instagram"
// On click:
// 1. Creates an offscreen canvas (1080x1920)
// 2. Draws the vibe image centered/covered
// 3. Draws a dark gradient overlay at bottom
// 4. Draws the spot name in white bold text
// 5. Draws "weshkech.com" branding at bottom
// 6. Converts canvas to blob
// 7. Uses navigator.share({ files: [file] }) to open native share sheet
// 8. Fallback: download the image if share API not available

export default function ShareToStory({ imageUrl, placeName, caption, vibeId }: ShareToStoryProps) {
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d")!;

      // Black background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, 1080, 1920);

      // Load and draw image (cover-fit centered)
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = imageUrl;
      });

      // Cover-fit: calculate crop
      const imgRatio = img.width / img.height;
      const canvasRatio = 1080 / 1920;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (imgRatio > canvasRatio) {
        sw = img.height * canvasRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / canvasRatio;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 1080, 1920);

      // Bottom gradient overlay
      const grad = ctx.createLinearGradient(0, 1400, 0, 1920);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.5, "rgba(0,0,0,0.7)");
      grad.addColorStop(1, "rgba(0,0,0,0.9)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 1400, 1080, 520);

      // Spot name
      if (placeName) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 52px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(placeName, 540, 1720);
      }

      // Caption (truncated)
      if (caption) {
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "32px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        const short = caption.length > 60 ? caption.slice(0, 60) + "..." : caption;
        ctx.fillText(short, 540, 1775);
      }

      // Branding
      ctx.fillStyle = "#D4AF37";
      ctx.font = "bold 36px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("weshkech.com", 540, 1860);

      // Small QR hint
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "24px system-ui";
      ctx.fillText("Scanne pour d\u00e9couvrir ce spot \u2192", 540, 1900);

      // Convert to blob and share
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png", 1);
      });
      const file = new File([blob], `weshkech-${vibeId}.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: placeName || "Weshkech",
          text: `${placeName || "Marrakech"} sur Weshkech \uD83D\uDD25`,
        });
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `weshkech-${vibeId}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Image t\u00e9l\u00e9charg\u00e9e !");
      }
    } catch (err) {
      console.error("Share error:", err);
      toast.error("Impossible de g\u00e9n\u00e9rer l'image");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={generate}
      disabled={generating}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white text-xs font-bold active:scale-95 transition-transform disabled:opacity-50"
    >
      {generating ? (
        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <Share2 className="w-3.5 h-3.5" />
      )}
      Story Instagram
    </button>
  );
}
