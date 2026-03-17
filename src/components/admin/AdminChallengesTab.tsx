import { useState, useEffect } from "react";
import { Plus, Loader2, Trophy, XCircle, Crown, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Challenge = { id: string; title: string; description: string | null; emoji: string; theme_tag: string | null; start_date: string; end_date: string; status: string; winner_user_id: string | null };

const NEIGHBORHOODS = [
  { slug: "medina", label: "Médina" },
  { slug: "gueliz", label: "Guéliz" },
  { slug: "hivernage", label: "Hivernage" },
  { slug: "palmeraie", label: "Palmeraie" },
];

export default function AdminChallengesTab() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [chTitle, setChTitle] = useState("");
  const [chDesc, setChDesc] = useState("");
  const [chEmoji, setChEmoji] = useState("🏆");
  const [chDays, setChDays] = useState("7");
  const [chType, setChType] = useState<"standard" | "geo">("standard");
  const [chNeighborhood, setChNeighborhood] = useState("medina");
  const [savingCh, setSavingCh] = useState(false);

  const fetchChallenges = async () => {
    const { data } = await supabase.from("weekly_challenges" as any).select("*").order("created_at", { ascending: false }).limit(20);
    if (data) setChallenges(data as any);
  };

  useEffect(() => { fetchChallenges(); }, []);

  return (
    <>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Nouveau challenge</h3>
      <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          <input value={chEmoji} onChange={(e) => setChEmoji(e.target.value)} placeholder="🏆" className="w-14 bg-background border border-border rounded-xl px-2 py-2.5 text-center text-lg focus:outline-none focus:ring-2 focus:ring-gold/30" />
          <input value={chTitle} onChange={(e) => setChTitle(e.target.value)} placeholder="Titre du challenge…" className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30" />
        </div>
        <textarea value={chDesc} onChange={(e) => setChDesc(e.target.value)} placeholder="Description…" rows={2} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none" />
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Durée :</label>
          <select value={chDays} onChange={(e) => setChDays(e.target.value)} className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30">
            <option value="3">3 jours</option>
            <option value="5">5 jours</option>
            <option value="7">7 jours</option>
            <option value="14">14 jours</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Type :</label>
          <select value={chType} onChange={(e) => setChType(e.target.value as "standard" | "geo")} className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30">
            <option value="standard">Standard</option>
            <option value="geo">Quartier</option>
          </select>
        </div>
        {chType === "geo" && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-gold" />
            <select value={chNeighborhood} onChange={(e) => setChNeighborhood(e.target.value)} className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30">
              {NEIGHBORHOODS.map(n => (
                <option key={n.slug} value={n.slug}>{n.label}</option>
              ))}
            </select>
          </div>
        )}
        <button
          disabled={!chTitle.trim() || savingCh}
          onClick={async () => {
            setSavingCh(true);
            try {
              const now = new Date();
              const end = new Date(now.getTime() + parseInt(chDays) * 86400000);
              const themeTag = chType === "geo" ? `geo:${chNeighborhood}` : null;
              const { error } = await supabase.from("weekly_challenges" as any).insert({
                title: chTitle.trim(),
                description: chDesc.trim() || null,
                emoji: chEmoji || "🏆",
                theme_tag: themeTag,
                start_date: now.toISOString(),
                end_date: end.toISOString(),
                status: "active",
              } as any);
              if (error) throw error;
              toast.success("Challenge créé !");
              setChTitle(""); setChDesc(""); setChEmoji("🏆"); setChDays("7");
              fetchChallenges();
            } catch (err) {
              console.error(err);
              toast.error("Erreur lors de la création");
            } finally { setSavingCh(false); }
          }}
          className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 text-primary-foreground font-semibold py-3 rounded-xl transition-all shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
        >
          {savingCh ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Lancer le challenge
        </button>
      </div>

      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-3">Historique ({challenges.length})</h3>
      {challenges.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun challenge.</p>
      ) : (
        <div className="space-y-3">
          {challenges.map((ch) => {
            const isActive = ch.status === "active";
            const ended = new Date(ch.end_date) < new Date();
            const timeLeft = isActive && !ended
              ? (() => { const d = Math.max(0, new Date(ch.end_date).getTime() - Date.now()); const days = Math.floor(d / 86400000); const hrs = Math.floor((d % 86400000) / 3600000); return days > 0 ? `${days}j ${hrs}h` : `${hrs}h`; })()
              : null;

            return (
              <div key={ch.id} className={`bg-surface border rounded-xl p-4 ${isActive ? "border-gold/30" : "border-border"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl">{ch.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{ch.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(ch.start_date).toLocaleDateString("fr-FR")} → {new Date(ch.end_date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isActive && timeLeft && (
                      <span className="text-[10px] font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded-full">{timeLeft}</span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-green-500/15 text-green-400" : "bg-muted text-muted-foreground"}`}>
                      {isActive ? "Actif" : "Terminé"}
                    </span>
                  </div>
                </div>
                {ch.description && <p className="text-xs text-muted-foreground mt-1.5">{ch.description}</p>}
                {ch.winner_user_id && (
                  <p className="text-xs text-gold mt-1.5 flex items-center gap-1"><Crown className="w-3 h-3" /> Gagnant : {ch.winner_user_id.slice(0, 8)}…</p>
                )}
                {isActive && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={async () => {
                        if (!confirm("Clôturer ce challenge et attribuer la récompense VIP ?")) return;
                        try {
                          const res = await supabase.functions.invoke("resolve-challenge");
                          if (res.error) throw res.error;
                          toast.success("Challenge clôturé !");
                          fetchChallenges();
                        } catch (err) {
                          console.error(err);
                          toast.error("Erreur lors de la clôture");
                        }
                      }}
                      className="flex-1 text-xs font-medium py-2 rounded-lg bg-gold/15 text-gold border border-gold/20 hover:bg-gold/25 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trophy className="w-3 h-3" /> Clôturer + récompenser
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Annuler ce challenge sans récompense ?")) return;
                        await supabase.from("weekly_challenges" as any).update({ status: "completed" } as any).eq("id", ch.id);
                        toast.success("Challenge annulé");
                        fetchChallenges();
                      }}
                      className="text-xs font-medium py-2 px-3 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
