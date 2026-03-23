import { motion } from "framer-motion";
import { Star, Utensils, Moon, Gem, Compass } from "lucide-react";
import type { Lang } from "@/i18n/translations";

interface GoSectionsProps {
  lang: Lang;
  t: (key: string) => string;
  onCtaClick: () => void;
}

const SECTIONS = [
  { icon: Star, titleKey: "seo_rooftopsTitle", descKey: "seo_rooftopsDesc", image: "/images/mk-rooftop-1.jpg", alt: "Best rooftop in Marrakech with sunset view" },
  { icon: Utensils, titleKey: "seo_restaurantsTitle", descKey: "seo_restaurantsDesc", image: "/images/kabana-photo-1.jpg", alt: "Best restaurant in Marrakech traditional cuisine" },
  { icon: Moon, titleKey: "seo_nightlifeTitle", descKey: "seo_nightlifeDesc", image: "/images/theatro-marrakech.jpg", alt: "Marrakech nightlife club and bar scene" },
  { icon: Gem, titleKey: "seo_hiddenTitle", descKey: "seo_hiddenDesc", image: "/images/coco-photo-1.jpg", alt: "Hidden gem spot in Marrakech known only to locals" },
  { icon: Compass, titleKey: "seo_localTitle", descKey: "seo_localDesc", image: "/images/kabana-photo-3.jpg", alt: "Local spots in Marrakech off the beaten path" },
];

export default function GoSections({ lang, t, onCtaClick }: GoSectionsProps) {
  return (
    <section className="px-5 py-6 max-w-lg mx-auto space-y-10">
      {SECTIONS.map(({ icon: Icon, titleKey, descKey, image, alt }, i) => (
        <motion.article
          key={titleKey}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: 0.1 }}
          className={`flex flex-col ${i % 2 === 1 ? "sm:flex-row-reverse" : "sm:flex-row"} gap-4 items-center`}
        >
          <div className="w-full sm:w-1/2 aspect-[4/3] rounded-2xl overflow-hidden bg-muted flex-shrink-0">
            <img src={image} alt={alt} className="w-full h-full object-cover" loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">{t(titleKey)}</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{t(descKey)}</p>
            <button onClick={onCtaClick}
              className="text-[12px] font-semibold text-primary underline underline-offset-2 active:opacity-70">
              {lang === "fr" ? "Explorer →" : "Explore →"}
            </button>
          </div>
        </motion.article>
      ))}
    </section>
  );
}
