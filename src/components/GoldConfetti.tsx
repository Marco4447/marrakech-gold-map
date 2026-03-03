import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  color: string;
  shape: "rect" | "circle" | "diamond";
}

const GOLD_PALETTE = [
  "#BF953F",
  "#FCF6BA",
  "#B38728",
  "#FBF5B7",
  "#AA771C",
  "#D4AC47",
  "#E8D48B",
];

export default function GoldConfetti({ duration = 4000 }: { duration?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();

    const W = window.innerWidth;
    const H = window.innerHeight;
    const PARTICLE_COUNT = 80;

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * W,
      y: -20 - Math.random() * H * 0.5,
      vx: (Math.random() - 0.5) * 3,
      vy: 1.5 + Math.random() * 3,
      size: 4 + Math.random() * 6,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      opacity: 0.7 + Math.random() * 0.3,
      color: GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)],
      shape: (["rect", "circle", "diamond"] as const)[Math.floor(Math.random() * 3)],
    }));

    let fadeOut = 1;
    const startTime = Date.now();
    let raf: number;

    const draw = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) fadeOut = Math.max(0, 1 - (elapsed - duration) / 1000);
      if (fadeOut <= 0) return;

      ctx.clearRect(0, 0, W, H);

      for (const p of particles) {
        p.x += p.vx + Math.sin(p.y * 0.01) * 0.5;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.vy += 0.02; // gravity

        if (p.y > H + 20) {
          p.y = -20;
          p.x = Math.random() * W;
          p.vy = 1.5 + Math.random() * 3;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity * fadeOut;
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 3, 0);
          ctx.moveTo(0, p.size / 2);
          ctx.lineTo(-p.size / 3, 0);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    />
  );
}
