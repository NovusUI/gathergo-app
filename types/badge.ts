import type { StandardResponse } from "./auth";

export type BadgeCode =
  | "FIRST_GATHER"
  | "FAMILIAR_FACE"
  | "HELPING_HAND"
  | "TIME_GIVER"
  | "GATHER_MAKER"
  | "IMPACT_STORYTELLER"
  | "FIRST_GIFT"
  | "COMMUNITY_BACKER"
  | "STEADY_GIVER";
export type BadgeCategory = "attending" | "volunteering" | "hosting" | "giving";
export type Badge = {
  code: BadgeCode;
  name: string;
  category: BadgeCategory;
  icon:
    | "party"
    | "sparkles"
    | "handshake"
    | "clock"
    | "tent"
    | "sprout"
    | "gift"
    | "heart";
  description: string;
  requirement: string;
  status: "locked" | "in_progress" | "earned";
  earnedAt: string | null;
  isPublic: boolean;
  progress: {
    current: number;
    target: number;
    remaining: number;
    percent: number;
    unit: "events" | "roles" | "minutes" | "reports" | "donations" | "months";
    label: string;
  };
  gogo: { message: string };
};
export type PublicBadge = Pick<
  Badge,
  "code" | "name" | "category" | "icon" | "description" | "earnedAt"
>;
export type BadgeCollection = {
  badges: Badge[];
  earnedCount: number;
  totalCount: number;
};
export type BadgeCollectionResponse = Pick<
  StandardResponse,
  "status" | "message"
> & { data: BadgeCollection };
export type BadgeVisibility = Pick<Badge, "code" | "isPublic">;
