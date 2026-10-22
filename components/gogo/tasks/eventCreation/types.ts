import type { EventFormData } from "@/schemas/event";
import type { StandardResponse } from "@/types/auth";

export type EventCreationUpdates = Partial<
  Pick<
    EventFormData,
    | "description"
    | "impactTitle"
    | "impactDescription"
    | "isPhysicalEvent"
    | "location"
    | "registrationType"
    | "registrationFee"
    | "registrationAttendees"
    | "donationTarget"
    | "donationsEnabled"
    | "links"
    | "tags"
  >
> & {
  title?: EventFormData["eventName"];
  startDate?: string;
  endDate?: string;
};

export type EventCreationDraft = EventCreationUpdates & {
  ticketCount: number;
  volunteerRoleCount: number;
};
export type EventCreationMessage = {
  role: "user" | "assistant";
  content: string;
};
export type EventCreationAssistantReply = {
  reply: string;
  choices: string[];
  section: EventCreationSection | "Review" | null;
  updates: EventCreationUpdates;
};
export type EventCreationAssistantRequest = {
  eventType: "general" | "donation";
  timeZone: string;
  draft: EventCreationDraft;
  messages: EventCreationMessage[];
};
export interface EventCreationAssistantResponse extends StandardResponse {
  data: EventCreationAssistantReply;
}
export type EventCreationSection =
  | "Date and Time"
  | "Location"
  | "Pricing"
  | "Story"
  | "Volunteering"
  | "Cover"
  | "Links";
