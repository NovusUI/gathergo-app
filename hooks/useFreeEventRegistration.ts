import { useMyRegistrations } from "@/services/queries";
import type { EventData } from "@/types/auth";

export function useFreeEventRegistration(
  event?: Pick<EventData, "id" | "registrationType" | "registrationFee">,
) {
  const enabled =
    event?.registrationType === "registration" &&
    (event.registrationFee ?? 0) === 0;
  const query = useMyRegistrations({ enabled, staleTime: 0 });
  const registration =
    enabled && query.isSuccess
      ? query.data.data.find((item) => item.eventId === event.id)
      : undefined;

  return {
    registration,
    isPending: enabled && (query.isPending || query.isFetching),
    isError: enabled && query.isError,
    refetch: query.refetch,
  };
}
