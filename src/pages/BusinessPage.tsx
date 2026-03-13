import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BusinessHero from "@/components/business/BusinessHero";
import BusinessStats from "@/components/business/BusinessStats";
import BusinessFeatures from "@/components/business/BusinessFeatures";
import BusinessHowItWorks from "@/components/business/BusinessHowItWorks";
import BusinessPricing from "@/components/business/BusinessPricing";
import BusinessTestimonials from "@/components/business/BusinessTestimonials";
import BusinessForm from "@/components/business/BusinessForm";

export default function BusinessPage() {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-5 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-xl font-bold">
            <span className="text-gold">Wesh</span>
            <span className="text-foreground">Kech</span>
            <span className="text-muted-foreground text-sm font-normal ml-2">for Business</span>
          </h1>
        </div>
      </div>

      <div className="space-y-14 pb-20">
        <BusinessHero onCtaClick={scrollToForm} />
        <BusinessStats />
        <BusinessFeatures />
        <BusinessHowItWorks />
        <BusinessTestimonials />
        <BusinessPricing onCtaClick={scrollToForm} />
        <BusinessForm ref={formRef} />
      </div>
    </div>
  );
}
