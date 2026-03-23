import { Play } from "lucide-react";
import StoriesModule from "../stories/StoriesModule";
import WeeklyChallenge from "../WeeklyChallenge";
import StreakBadge from "../StreakBadge";

type FeedTab = "tendances" | "recents";

interface Props {
  userId?: string;
  vibeCount: number;
  activeTab: FeedTab;
  setActiveTab: (tab: FeedTab) => void;
  onShowTikTokFeed: () => void;
}

export default function LiveHeader({ userId, vibeCount, activeTab, setActiveTab, onShowTikTokFeed }: Props) {
  return (
    <>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 pt-12 pb-0">
        <div className="flex items-center justify-between pb-2.5">
          <h1 className="text-base font-semibold text-foreground tracking-tight font-body">Weshkech</h1>
          <div className="flex items-center gap-3">
            <button
              aria-label="Voir les vibes"
              onClick={onShowTikTokFeed}
              className="flex items-center gap-1 active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 text-foreground" strokeWidth={1.5} />
            </button>
            <span className="text-xs text-muted-foreground">{vibeCount} live</span>
          </div>
        </div>

        {/* Tabs — underline style */}
        <div className="flex">
          <button
            onClick={() => setActiveTab("tendances")}
            className={`flex-1 py-2.5 text-sm font-semibold text-center border-b-2 transition-colors ${
              activeTab === "tendances"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Tendances
          </button>
          <button
            onClick={() => setActiveTab("recents")}
            className={`flex-1 py-2.5 text-sm font-semibold text-center border-b-2 transition-colors ${
              activeTab === "recents"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Récents
          </button>
        </div>
      </div>

      {/* Weekly Challenge */}
      <WeeklyChallenge />

      {/* Stories */}
      <StoriesModule userId={userId} />

      {/* Streak badge */}
      {userId && (
        <div className="px-4 pb-1">
          <StreakBadge userId={userId} />
        </div>
      )}
    </>
  );
}
