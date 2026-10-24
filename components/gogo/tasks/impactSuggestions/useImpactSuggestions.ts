import { getImpactSuggestions } from "@/components/gogo/services/api";
import type {
  ImpactSuggestionPayload,
  ImpactSuggestionResponse,
} from "@/components/gogo/tasks/impactSuggestions/types";
import { QUERY_KEYS } from "@/services/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useImpactSuggestions = (
  payload: ImpactSuggestionPayload,
  options?: { enabled?: boolean },
) => {
  return useQuery<ImpactSuggestionResponse>({
    queryKey: [...QUERY_KEYS.impactSuggestions, "ai", payload],
    queryFn: ({ signal }) => getImpactSuggestions(payload, signal),
    staleTime: 1000 * 60 * 5,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    ...options,
  });
};
