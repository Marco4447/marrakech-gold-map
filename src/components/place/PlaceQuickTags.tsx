import { motion } from "framer-motion";

interface Props {
  tags: string[];
}

export default function PlaceQuickTags({ tags }: Props) {
  if (tags.length === 0) return null;

  return (
    <div className="px-4 py-3 overflow-x-auto no-scrollbar">
      <div className="flex gap-2">
        {tags.map((tag, i) => (
          <motion.span
            key={tag}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-gold/30 bg-gold/10 text-gold whitespace-nowrap"
          >
            #{tag}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
