import type {
  CarpoolPassengerRequest,
  CarpoolRequestDecision,
} from "@/types/carpool";

export const CARPOOL_PREVIOUS_DECISION_LABELS = {
  DECLINED: "Previously declined",
  REMOVED: "Previously removed",
} as const;

export function isPreviousCarpoolDecision(
  request: CarpoolPassengerRequest,
): request is CarpoolPassengerRequest & { status: CarpoolRequestDecision } {
  return request.status === "DECLINED" || request.status === "REMOVED";
}

export function getCarpoolRequestState(
  requests: CarpoolPassengerRequest[],
  userId: string | undefined,
) {
  const ownRequests = requests
    .filter((request) => request.userId === userId)
    .sort(
      (a, b) =>
        b.requestedAt.localeCompare(a.requestedAt) || b.id.localeCompare(a.id),
    );
  const previousDecision = ownRequests.find(isPreviousCarpoolDecision);

  return {
    currentRequest: ownRequests[0] ?? null,
    previousDecision: previousDecision ?? null,
    hasBeenRemoved: ownRequests.some((request) => request.status === "REMOVED"),
  };
}
