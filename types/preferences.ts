import type { EventData, StandardResponse } from "./auth";

export type HelpMode = "attend" | "volunteer" | "donate" | "carpool";
export type InterestTopic = { id: string; label: string; accent: string };
export type InterestWeight = InterestTopic & {
  weight: number;
  source: "chosen" | "activity" | "both";
};
export type InterestProfile = {
  interests: string[];
  helpModes: HelpMode[];
  city: string | null;
  learningEnabled: boolean;
  weights: InterestWeight[];
};
export type SaveInterestProfile = Pick<
  InterestProfile,
  "interests" | "helpModes" | "learningEnabled"
> & { city?: string; likedEventIds: string[] };
export type InterestExamplesRequest = { interests: string[]; city: string };
export type InterestExample = Pick<
  EventData,
  "id" | "title" | "location" | "startDate" | "registrationType"
> & {
  description: string | null;
  thumbnailUrl: string | null;
  topics: string[];
};
export type PreferenceResponse<T> = Pick<
  StandardResponse,
  "status" | "message"
> & { data: T };
export type InterestCatalog = {
  topics: InterestTopic[];
  helpModes: HelpMode[];
};
export type EventInterestSignal = { eventId: string; kind: "LIKE" | "VIEW" };

export type EventFeedbackRating = "LOVED" | "OKAY" | "NOT_FOR_ME";
export type PendingEventFeedback = Pick<EventData, "id" | "title" | "endDate">;
export type SaveEventFeedback = {
  eventId: string;
  rating: EventFeedbackRating;
  moreLikeThis: boolean;
};
export type EventFeedbackResult = Pick<
  SaveEventFeedback,
  "rating" | "moreLikeThis"
> & {
  profile: InterestProfile;
  changes: (InterestWeight & { previousWeight: number })[];
};
