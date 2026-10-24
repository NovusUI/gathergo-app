import type { OnboardingSlideProps } from "./Slide";

export const slides = [
  { artwork: "onboarding1", title: "Make an Impact" },
  { artwork: "onboarding2", title: "Go together" },
  { artwork: "ggcircle", title: "Find your people" },
] as const satisfies readonly Omit<OnboardingSlideProps, "active">[];
