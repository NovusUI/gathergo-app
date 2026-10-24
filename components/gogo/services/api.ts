import client from "@/api/client";
import type {
  EventCreationAssistantRequest,
  EventCreationAssistantResponse,
} from "@/components/gogo/tasks/eventCreation/types";
import type {
  ImpactSuggestionPayload,
  ImpactSuggestionResponse,
} from "@/components/gogo/tasks/impactSuggestions/types";
import { GOGO_URL } from "./urls";

export const getEventCreationReply = async (
  payload: EventCreationAssistantRequest,
  signal: AbortSignal,
): Promise<EventCreationAssistantResponse> => {
  const response = await client.post<EventCreationAssistantResponse>(
    GOGO_URL.creationAssistant,
    payload,
    { signal },
  );
  return response.data;
};

export const getImpactSuggestions = async (
  payload: ImpactSuggestionPayload,
  signal?: AbortSignal,
): Promise<ImpactSuggestionResponse> => {
  const response = await client.post<ImpactSuggestionResponse>(
    GOGO_URL.impactSuggestions,
    payload,
    { signal },
  );
  return response.data;
};
