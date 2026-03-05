import { useLanguage } from "@/i18n/LanguageContext";

interface LanguageToggleProps {
  className?: string;
  variant?: "pill" | "icon";
}

export default function LanguageToggle({ className = "", variant = "pill" }: LanguageToggleProps) {
  const { lang, toggleLang } = useLanguage();

  if (variant === "icon") {
    return (
      <button
        onClick={toggleLang}
        className={`w-9 h-9 rounded-full bg-card/90 backdrop-blur-xl border border-border hover:border-gold/40 flex items-center justify-center shadow-lg shadow-black/20 transition-all active:scale-95 ${className}`}
        aria-label="Toggle language"
      >
        <span className="text-xs font-bold text-foreground">{lang === "fr" ? "EN" : "FR"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleLang}
      className={`inline-flex items-center gap-1.5 bg-card/80 backdrop-blur-md border border-border hover:border-gold/30 rounded-full px-3 py-1.5 transition-all active:scale-95 ${className}`}
      aria-label="Toggle language"
    >
      <span className={`text-[10px] font-bold transition-colors ${lang === "fr" ? "text-gold" : "text-muted-foreground"}`}>FR</span>
      <span className="text-[10px] text-muted-foreground">/</span>
      <span className={`text-[10px] font-bold transition-colors ${lang === "en" ? "text-gold" : "text-muted-foreground"}`}>EN</span>
    </button>
  );
}
