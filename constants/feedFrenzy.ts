export type FeedFrenzyLevel = 1 | 2 | 3 | 4;

export const FEED_FRENZY_LABELS: Record<FeedFrenzyLevel, string> = {
  1: "Warming",
  2: "Heating up",
  3: "Frenzy",
  4: "Inferno",
};

export const FEED_FRENZY_COLORS = {
  1: ["#FFB02E", "#FFE066", "#FFF8D6"],
  2: ["#FF8A2B", "#FFC93C", "#FFF1B8"],
  3: ["#FF5A36", "#FF9F2E", "#FFE27A"],
  4: ["#E6252B", "#FF6B1F", "#FFD23F", "#FFF6D6"],
} as const;
