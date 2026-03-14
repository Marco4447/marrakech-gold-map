import { useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Send, Building2, MessageCircle } from "lucide-react";
import B2BHero from "@/components/business/B2BHero";
import B2BScarcity from "@/components/business/B2BScarcity";
import B2BProblem from "@/components/business/B2BProblem";
import B2BSolution from "@/components/business/B2BSolution";
import B2BMechanism from "@/components/business/B2BMechanism";
import B2BFeatures from "@/components/business/B2BFeatures";
import B2BProof from "@/components/business/B2BProof";
import B2BPricing from "@/components/business/B2BPricing";
import B2BFinalScarcity from "@/components/business/B2BFinalScarcity";
import B2BFinalCTA from "@/components/business/B2BFinalCTA";

export default function BusinessPage() {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="min-h-[100dvh] bg-background overflow-x-hidden">
      {/* Minimal header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 py-3">
          <div className="font-display text-lg font-bold">
            <span className="text-gold">Wesh</span>
            <span className="text-foreground">Kech</span>
            <span className="text-muted-foreground text-[10px] font-body ml-1.5 uppercase tracking-widest">Partners</span>
          </div>
          <button
            onClick={scrollToForm}
            className="px-4 py-1.5 rounded-full text-[11px] font-bold text-primary-foreground transition-all"
            style={{ background: "linear-gradient(135deg, hsl(43 76% 52%), hsl(43 70% 62%))" }}
          >
            Rejoindre
          </button>
        </div>
      </div>

      {/* Page content */}
      <div className="pt-14 space-y-16 pb-28">
        <B2BHero onCtaClick={scrollToForm} />
        <B2BScarcity />
        <B2BProblem />
        <B2BSolution onCtaClick={scrollToForm} />
        <B2BMechanism />
        <B2BFeatures onCtaClick={scrollToForm} />
        <B2BProof />
        <B2BPricing onCtaClick={scrollToForm} />
        <B2BFinalScarcity onCtaClick={scrollToForm} />
        <B2BFinalCTA ref={formRef} />
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-gradient-to-t from-background via-background/95 to-transparent md:hidden">
        <button
          onClick={scrollToForm}
          className="w-full py-3.5 rounded-2xl font-bold text-sm text-primary-foreground flex items-center justify-center gap-2 shadow-lg shadow-gold/25"
          style={{ background: "linear-gradient(135deg, hsl(43 76% 52%), hsl(43 70% 62%))" }}
        >
          <Send className="w-4 h-4" />
          Activer mes 15 crédits gratuits
        </button>
      </div>
    </div>
  );
}
