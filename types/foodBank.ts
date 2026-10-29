import type { StandardResponse } from "./auth";
import type { OwnedAccessEventSummary } from "./event";

export interface MealPass {
  id: string;
  createdAt: string;
  eventId: string;
  qrCode: string;
  collectionStart: string;
  collectionEnd: string;
  isUsed: boolean;
  timeZone: string;
}
export type OwnedMealPass = MealPass & { event: OwnedAccessEventSummary };
export interface MealPassResponse extends StandardResponse {
  data: MealPass | null;
}
export interface ClaimMealResponse extends StandardResponse {
  data: MealPass;
}
export interface OwnedMealPassesResponse extends StandardResponse {
  data: OwnedMealPass[];
}

export type CollectionAvailability =
  | "upcoming"
  | "not_started"
  | "open"
  | "paused"
  | "closed"
  | "ended";
export interface FoodBankCollection {
  status: "NOT_STARTED" | "OPEN" | "PAUSED" | "CLOSED";
  availability: CollectionAvailability;
  timeZone: string;
  startDate: string;
  endDate: string;
  updatedAt: string;
  canManage: boolean;
  canOpen: boolean;
  canReserve: boolean;
}
export type UpdateCollectionPayload = {
  status: Exclude<FoodBankCollection["status"], "NOT_STARTED">;
  expectedUpdatedAt: string;
};
export interface RescheduleCollectionPayload {
  startDate: string;
  expectedUpdatedAt: string;
}
export interface FoodBankCollectionResponse extends StandardResponse {
  data: FoodBankCollection;
}
export interface RescheduleCollectionResponse extends StandardResponse {
  data: FoodBankCollection & { notificationFailed: boolean };
}
