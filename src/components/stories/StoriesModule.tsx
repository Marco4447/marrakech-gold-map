import { useState } from "react";
import { useStories } from "@/hooks/useStories";
import StoryBubbles from "./StoryBubbles";
import StoryViewer from "./StoryViewer";

interface StoriesModuleProps {
  userId?: string | null;
  onAddStory?: () => void;
}

export default function StoriesModule({ userId, onAddStory }: StoriesModuleProps) {
  const { stories, loading, markViewed } = useStories(userId);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (loading || stories.length === 0) return null;

  return (
    <>
      <StoryBubbles
        stories={stories}
        onStoryPress={(index) => setViewerIndex(index)}
        onAddStory={onAddStory}
      />

      {viewerIndex !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onViewed={markViewed}
        />
      )}
    </>
  );
}
