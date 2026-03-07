import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Camera, MapPin, Flame, ChevronDown, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://weshkech.com/go";

interface PlaceOption {
  id: string;
  name: string;
  category: string | null;
  image_url: string | null;
  neighborhood: string | null;
}

export default function PosterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [places, setPlaces] = useState<PlaceOption[]>([]);
  const [selected, setSelected] = useState<PlaceOption | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  // Load places
  useEffect(() => {
    supabase
      .from("places")
      .select("id, name, category, image_url, neighborhood")
      .order("name")
      .then(({ data }) => {
        if (data) {
          setPlaces(data);
          const paramName = searchParams.get("place");
          if (paramName) {
            const match = data.find(
              (p) => p.name.toLowerCase() === paramName.toLowerCase()
            );
            if (match) setSelected(match);
          }
        }
      });
  }, []);

  const placeName = selected?.name || "This Spot";
  const qrUrl = BASE_URL;
  const categoryEmoji =
    selected?.category === "rooftop"
      ? "🌇"
      : selected?.category === "restaurant"
      ? "🍽️"
      : selected?.category === "club"
      ? "🎶"
      : selected?.category === "bar"
      ? "🍸"
      : selected?.category === "cafe"
      ? "☕"
      : "✨";

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-4 print:p-0 print:gap-0">
      {/* Place picker - hidden on print */}
      <div className="w-full max-w-[420px] print:hidden">
        <label className="text-xs text-white/40 font-medium mb-2 block">
          Sélectionne un lieu pour personnaliser le poster
        </label>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all"
          style={{
            background: "linear-gradient(135deg, #1a1a2e, #16162a)",
            borderColor: selected ? "#BF953F40" : "#ffffff15",
            color: selected ? "#FCF6BA" : "#ffffff80",
          }}
        >
          <span className="flex items-center gap-2">
            {selected && <span>{categoryEmoji}</span>}
            {selected ? selected.name : "Choisir un lieu..."}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showPicker ? "rotate-180" : ""}`}
          />
        </button>

        {showPicker && (
          <div className="mt-2 max-h-[40vh] overflow-y-auto rounded-xl border border-white/10 bg-[#12121a] divide-y divide-white/5">
            {/* Generic option */}
            <button
              onClick={() => {
                setSelected(null);
                setShowPicker(false);
                setSearchParams({});
              }}
              className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                !selected
                  ? "text-orange-400 font-bold bg-orange-400/5"
                  : "text-white/70 hover:bg-white/5"
              }`}
            >
              ✨ Poster générique (sans lieu)
            </button>

            {places.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelected(p);
                  setShowPicker(false);
                  setSearchParams({ place: p.name });
                }}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm transition-colors ${
                  selected?.id === p.id
                    ? "text-orange-400 font-bold bg-orange-400/5"
                    : "text-white/70 hover:bg-white/5"
                }`}
              >
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt=""
                    className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-white/30" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-[10px] text-white/40 capitalize">
                    {[p.category, p.neighborhood].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ===== POSTER ===== */}
      <div
        id="poster"
        className="relative w-full max-w-[420px] aspect-[5/7] rounded-2xl overflow-hidden flex flex-col items-center justify-between py-8 px-6 print:rounded-none print:max-w-none print:w-[148mm] print:h-[210mm]"
        style={{
          background:
            "linear-gradient(160deg, #0a0a0a 0%, #1a0a2e 40%, #0f0f0f 70%, #1a0a2e 100%)",
        }}
      >
        {/* Ambient glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] opacity-20 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, hsl(280 60% 40%), transparent 70%)",
          }}
        />

        {/* Top */}
        <div className="relative z-10 text-center space-y-2">
          <p
            className="text-[10px] font-bold tracking-[0.3em] uppercase"
            style={{ color: "#BF953F" }}
          >
            Weshkech
          </p>

          {/* Place name or generic */}
          {selected ? (
            <>
              <p className="text-[11px] text-white/50 font-medium uppercase tracking-wider">
                You are at
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                <span>{categoryEmoji} </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #fb923c, #BF953F, #FCF6BA)",
                  }}
                >
                  {placeName}
                </span>
              </h1>
              {selected.neighborhood && (
                <p className="text-[10px] text-white/35 font-medium">
                  {selected.neighborhood} · Marrakech
                </p>
              )}
            </>
          ) : (
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
              Scan to unlock
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #fb923c, #BF953F, #FCF6BA)",
                }}
              >
                the vibe
              </span>
            </h1>
          )}
        </div>

        {/* QR Code */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="relative">
            <div
              className="absolute -inset-6 rounded-3xl opacity-40 blur-xl"
              style={{
                background: "radial-gradient(circle, #fb923c, transparent 70%)",
              }}
            />
            <div
              className="absolute -inset-4 rounded-2xl opacity-20 blur-md"
              style={{
                background: "radial-gradient(circle, #BF953F, transparent 60%)",
              }}
            />
            <div className="relative bg-white rounded-xl p-4 shadow-2xl shadow-orange-500/20">
              <QRCodeSVG
                value={qrUrl}
                size={170}
                level="H"
                bgColor="#ffffff"
                fgColor="#0a0a0a"
                imageSettings={{
                  src: "/logo_72.png",
                  height: 34,
                  width: 34,
                  excavate: true,
                }}
              />
            </div>
          </div>
          <p
            className="text-[10px] font-medium tracking-wider"
            style={{ color: "#BF953F" }}
          >
            weshkech.com/go
          </p>
        </div>

        {/* Bottom */}
        <div className="relative z-10 text-center space-y-3 max-w-[280px]">
          {/* Icons */}
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #fb923c20, #fb923c10)",
                }}
              >
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-[8px] text-white/50 font-medium">
                See the crowd
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #BF953F20, #BF953F10)",
                }}
              >
                <MapPin className="w-4 h-4" style={{ color: "#BF953F" }} />
              </div>
              <span className="text-[8px] text-white/50 font-medium">
                Live spots
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #a855f720, #a855f710)",
                }}
              >
                <Camera className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-[8px] text-white/50 font-medium">
                Post a vibe
              </span>
            </div>
          </div>

          <p className="text-[11px] text-white/60 leading-relaxed">
            {selected
              ? `Unlock insider perks at ${placeName}`
              : "Discover what's happening right now in Marrakech."}
          </p>

          <div
            className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold"
            style={{
              background: "linear-gradient(135deg, #fb923c15, #fb923c08)",
              border: "1px solid #fb923c30",
              color: "#fb923c",
            }}
          >
            🔥 Post a vibe here & get featured
          </div>

          <p className="text-[7px] text-white/20 tracking-widest uppercase pt-1">
            Join the insiders · Marrakech
          </p>
        </div>
      </div>

      {/* Print button */}
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-black shadow-xl active:scale-95 transition-transform print:hidden"
        style={{
          background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)",
        }}
      >
        <Printer className="w-4 h-4" />
        Imprimer le poster
      </button>
    </div>
  );
}
