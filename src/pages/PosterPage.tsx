import { QRCodeSVG } from "qrcode.react";
import { Camera, MapPin, Flame } from "lucide-react";

const QR_URL = "https://marrakech-gold-map.lovable.app/go";

export default function PosterPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 print:p-0">
      <div
        className="relative w-full max-w-[420px] aspect-[5/7] rounded-2xl overflow-hidden flex flex-col items-center justify-between py-10 px-6 print:rounded-none print:max-w-none print:w-[148mm] print:h-[210mm]"
        style={{
          background: "linear-gradient(160deg, #0a0a0a 0%, #1a0a2e 40%, #0f0f0f 70%, #1a0a2e 100%)",
        }}
      >
        {/* Ambient glow top */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, hsl(280 60% 40%), transparent 70%)" }}
        />

        {/* Top section */}
        <div className="relative z-10 text-center space-y-3">
          {/* Logo text */}
          <p
            className="text-sm font-bold tracking-[0.3em] uppercase"
            style={{ color: "#BF953F" }}
          >
            Weshkech
          </p>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
            Scan to unlock
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #fb923c, #BF953F, #FCF6BA)" }}
            >
              the vibe
            </span>
          </h1>
        </div>

        {/* QR Code with glow */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          {/* Outer glow */}
          <div className="relative">
            <div
              className="absolute -inset-6 rounded-3xl opacity-40 blur-xl"
              style={{ background: "radial-gradient(circle, #fb923c, transparent 70%)" }}
            />
            <div
              className="absolute -inset-4 rounded-2xl opacity-20 blur-md"
              style={{ background: "radial-gradient(circle, #BF953F, transparent 60%)" }}
            />

            {/* QR container */}
            <div className="relative bg-white rounded-xl p-4 shadow-2xl shadow-orange-500/20">
              <QRCodeSVG
                value={QR_URL}
                size={180}
                level="H"
                bgColor="#ffffff"
                fgColor="#0a0a0a"
                imageSettings={{
                  src: "/logo_72.png",
                  height: 36,
                  width: 36,
                  excavate: true,
                }}
              />
            </div>
          </div>

          {/* URL */}
          <p className="text-xs font-medium tracking-wider" style={{ color: "#BF953F" }}>
            weshkech.com/go
          </p>
        </div>

        {/* Bottom section */}
        <div className="relative z-10 text-center space-y-4 max-w-[280px]">
          {/* Icons row */}
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #fb923c20, #fb923c10)" }}>
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-[9px] text-white/50 font-medium">See the crowd</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #BF953F20, #BF953F10)" }}>
                <MapPin className="w-5 h-5" style={{ color: "#BF953F" }} />
              </div>
              <span className="text-[9px] text-white/50 font-medium">Live spots</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #a855f720, #a855f710)" }}>
                <Camera className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-[9px] text-white/50 font-medium">Post a vibe</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-white/60 leading-relaxed">
            Discover what's happening right now in Marrakech.
            <br />
            Unlock insider perks.
          </p>

          {/* Viral hook */}
          <div
            className="inline-block px-4 py-2 rounded-full text-xs font-bold"
            style={{
              background: "linear-gradient(135deg, #fb923c15, #fb923c08)",
              border: "1px solid #fb923c30",
              color: "#fb923c",
            }}
          >
            🔥 Post a vibe here & get featured
          </div>

          {/* Footer */}
          <p className="text-[8px] text-white/25 tracking-widest uppercase pt-2">
            Join the insiders · Marrakech
          </p>
        </div>
      </div>

      {/* Print button - hidden on print */}
      <button
        onClick={() => window.print()}
        className="fixed bottom-6 right-6 px-6 py-3 rounded-xl text-sm font-bold text-black shadow-xl active:scale-95 transition-transform print:hidden"
        style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
      >
        🖨️ Imprimer le poster
      </button>
    </div>
  );
}
