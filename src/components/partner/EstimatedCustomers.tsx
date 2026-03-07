import { motion } from "framer-motion";
import { Users } from "lucide-react";

interface Props {
  checkins: number;
  redemptions: number;
}

export default function EstimatedCustomers({ checkins, redemptions }: Props) {
  const estimated = checkins + redemptions;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-gold/30 bg-gradient-to-r from-gold/10 via-gold/5 to-transparent backdrop-blur-xl p-4 flex items-center gap-4"
    >
      <div className="w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0">
        <Users className="w-6 h-6 text-gold" />
      </div>
      <div>
        <p className="text-2xl font-display font-black text-gold tabular-nums">{estimated}</p>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          Clients estimés cette semaine
        </p>
      </div>
    </motion.div>
  );
}
