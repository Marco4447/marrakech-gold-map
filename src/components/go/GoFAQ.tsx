import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Lang } from "@/i18n/translations";

interface GoFAQProps {
  lang: Lang;
  t: (key: string) => string;
}

const FAQ_KEYS = [
  { q: "seo_faq1Q", a: "seo_faq1A" },
  { q: "seo_faq2Q", a: "seo_faq2A" },
  { q: "seo_faq3Q", a: "seo_faq3A" },
  { q: "seo_faq4Q", a: "seo_faq4A" },
];

export default function GoFAQ({ lang, t }: GoFAQProps) {
  return (
    <section className="px-5 py-10 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-5 text-center">{t("seo_faqTitle")}</h2>
      <Accordion type="single" collapsible className="space-y-2">
        {FAQ_KEYS.map(({ q, a }, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl px-4 bg-card">
            <AccordionTrigger className="text-[14px] font-medium text-foreground py-3">
              {t(q)}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-3">
              {t(a)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
