import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  getFoodBankCollection,
  updateFoodBankCollection,
  rescheduleFoodBankCollection,
  getMealPass,
  claimMeal,
  getMyMealPasses,
} from "@/services/serviceFn";
import type {
  UpdateCollectionPayload,
  RescheduleCollectionPayload,
} from "@/types/foodBank";
import { QUERY_KEYS } from "@/services/queryKeys";

export function useMealPass(eventId: string, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...QUERY_KEYS.mealPass, user?.id, eventId],
    queryFn: () => getMealPass(eventId),
    enabled: Boolean(user && eventId) && enabled,
    staleTime: 0,
  });
}
export function useMyMealPasses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...QUERY_KEYS.myMealPasses, user?.id],
    queryFn: getMyMealPasses,
    enabled: Boolean(user),
  });
}
export function useClaimMeal(eventId: string) {
  const { user } = useAuth();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: () => claimMeal(eventId),
    onSuccess: async (response) => {
      cache.setQueryData([...QUERY_KEYS.mealPass, user?.id, eventId], response);
      await cache.invalidateQueries({ queryKey: QUERY_KEYS.myMealPasses });
    },
  });
}

export function useFoodBankCollection(eventId: string, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...QUERY_KEYS.foodBankCollection, user?.id, eventId],
    queryFn: () => getFoodBankCollection(eventId),
    enabled: Boolean(user && eventId) && enabled,
    staleTime: 0,
    refetchInterval: 30_000,
  });
}

export function useManageFoodBankCollection(eventId: string) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const refreshCollection = async (
    response: Awaited<ReturnType<typeof updateFoodBankCollection>>,
  ) => {
    cache.setQueryData(
      [...QUERY_KEYS.foodBankCollection, user?.id, eventId],
      response,
    );
    await Promise.all([
      cache.invalidateQueries({
        queryKey: [...QUERY_KEYS.eventDetails, eventId],
      }),
      cache.invalidateQueries({ queryKey: QUERY_KEYS.mealPass }),
      cache.invalidateQueries({ queryKey: QUERY_KEYS.myMealPasses }),
      cache.invalidateQueries({ queryKey: QUERY_KEYS.getUserEvents }),
      cache.invalidateQueries({ queryKey: QUERY_KEYS.foryouEvents }),
    ]);
  };
  const refreshOnError = () =>
    cache.invalidateQueries({ queryKey: QUERY_KEYS.foodBankCollection });
  const update = useMutation({
    mutationFn: (payload: UpdateCollectionPayload) =>
      updateFoodBankCollection(eventId, payload),
    onSuccess: refreshCollection,
    onError: refreshOnError,
  });
  const reschedule = useMutation({
    mutationFn: (payload: RescheduleCollectionPayload) =>
      rescheduleFoodBankCollection(eventId, payload),
    onSuccess: refreshCollection,
    onError: refreshOnError,
  });
  return { update, reschedule };
}
