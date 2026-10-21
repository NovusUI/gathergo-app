import type { FeedFrenzyLevel } from "@/constants/feedFrenzy";
import type { FeedItem } from "@/hooks/useEventFeed";

// CURRENT_FRENZY metadata is emitted by FeedService.generateOrUpdateFrenzyFeed.
type CurrentFrenzyFeed = Omit<FeedItem, "type" | "metadata"> & {
  type: "CURRENT_FRENZY";
  metadata: { intensity: "LOW" | "MEDIUM" | "HIGH" };
};
const LIVE_LEVELS: Record<
  CurrentFrenzyFeed["metadata"]["intensity"],
  FeedFrenzyLevel
> = {
  LOW: 2,
  MEDIUM: 3,
  HIGH: 4,
};
function isCurrentFrenzy(feed: FeedItem): feed is CurrentFrenzyFeed {
  return feed.type === "CURRENT_FRENZY";
}

export function getFeedFrenzyLevel(
  feeds: readonly FeedItem[],
): FeedFrenzyLevel {
  let current: CurrentFrenzyFeed | undefined;
  for (const feed of feeds) {
    if (
      isCurrentFrenzy(feed) &&
      (!current ||
        new Date(feed.updatedAt).getTime() >
          new Date(current.updatedAt).getTime())
    ) {
      current = feed;
    }
  }
  return current ? LIVE_LEVELS[current.metadata.intensity] : 1;
}
