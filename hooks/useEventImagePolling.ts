// hooks/useEventImagePolling.ts
import { useEventImageStatus } from "@/services/queries";
import { useEffect, useRef } from "react";

export const useEventImagePolling = (
  eventId: string,
  isProcessing: boolean
) => {
  const hasCompletedPollingRef = useRef(false);

  const { data, ...rest } = useEventImageStatus(eventId, {
    enabled: isProcessing && !hasCompletedPollingRef.current,
    refetchInterval: isProcessing ? 3000 : false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Reset the ref when eventId changes
  useEffect(() => {
    hasCompletedPollingRef.current = false;
  }, [eventId]);

  // Update ref when processing is complete
  useEffect(() => {
    if (data?.data && !data.data.isProcessing) {
      hasCompletedPollingRef.current = true;
    }
  }, [data]);

  return { data, ...rest };
};
