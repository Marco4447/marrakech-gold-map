import { useState, useMemo } from "react";
import { useStories, type Story } from "@/hooks/useStories";
import StoryBubbles from "./StoryBubbles";
import StoryViewer from "./StoryViewer";

export interface StoryGroup {
  key: string;
  stories: Story[];
  name: string;
  avatarUrl: string | null;
  hasUnviewed: boolean;
}

interface StoriesModuleProps {
  userId?: string | null;
  onAddStory?: () => void;
}

export default function StoriesModule({ userId, onAddStory }: StoriesModuleProps) {
  const { stories, loading, markViewed } = useStories(userId);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);

  // Group stories by author (admin/place/user) — Instagram style
  const groups = useMemo<StoryGroup[]>(() => {
    const map = new Map<string, Story[]>();
    const order: string[] = [];
    stories.forEach((s) => {
      const key = s.source_type === "admin" ? "weshkech" : (s.place_id || s.user_id || s.id);
      if (!map.has(key)) {
        map.set(key, []);
        order.push(key);
      }
      map.get(key)!.push(s);
    });
    return order.map((key) => {
      const items = map.get(key)!;
      const first = items[0];
      return {
        key,
        stories: items,
        name: first.author_name || "Anon",
        avatarUrl: first.avatar_url || null,
        hasUnviewed: items.some((s) => !s.viewed),
      };
    });
  }, [stories]);

  if (loading || groups.length === 0) return null;

  return (
    <>
      <StoryBubbles
        groups={groups}
        onGroupPress={(groupIndex) => setActiveGroupIndex(groupIndex)}
        onAddStory={onAddStory}
      />

      {activeGroupIndex !== null && (
        <StoryViewer
          groups={groups}
          initialGroupIndex={activeGroupIndex}
          onClose={() => setActiveGroupIndex(null)}
          onViewed={markViewed}
        />
      )}
    </>
  );
}
