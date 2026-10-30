import type { EventFormData } from "@/schemas/event";
import type { StandardResponse } from "@/types/auth";

export type EventCreationUpdates = Partial<
  Pick<
    EventFormData,
    | "description"
    | "impactDescription"
    | "isPhysicalEvent"
    | "location"
    | "registrationType"
    | "registrationFee"
    | "registrationAttendees"
    | "donationTarget"
    | "donationsEnabled"
    | "foodBankTotalMeals"
    | "foodBankSlotCapacity"
    | "foodBankSlotMinutes"
    | "links"
    | "tags"
  >
> & {
  title?: EventFormData["eventName"];
  startDate?: string;
  endDate?: string;
};

export type EventCreationDraft = EventCreationUpdates &
  Pick<EventFormData, "registrationType"> & {
    ticketCount: number;
    volunteerRoleCount: number;
    impactMapCount: number;
    hasImpactGoalOrPath: boolean;
    hasCoverImage: boolean;
  };
export type EventCreationMessage = {
  role: "user" | "assistant";
  content: string;
};
export type EventCreationAssistantReply = {
  reply: string;
  choices: string[];
  section: EventCreationSection | "Review" | null;
  completedSection: EventCreationOptionalSection | null;
  suggestedImpactStory: string | null;
  updates: EventCreationUpdates;
};
export type EventCreationAssistantRequest = {
  eventType: "general" | "donation";
  timeZone: string;
  draft: EventCreationDraft;
  messages: EventCreationMessage[];
  addressedSections: EventCreationOptionalSection[];
};
export interface EventCreationAssistantResponse extends StandardResponse {
  data: EventCreationAssistantReply;
}
export type EventCreationSection =
  | "Date and Time"
  | "Location"
  | "Pricing"
  | "Story"
  | EventCreationOptionalSection;

export const EVENT_CREATION_OPTIONAL_SECTIONS = [
  "Impact story",
  "Impact map",
  "Volunteering",
  "Links",
  "Interests",
  "Cover",
] as const;
export type EventCreationOptionalSection =
  (typeof EVENT_CREATION_OPTIONAL_SECTIONS)[number];
