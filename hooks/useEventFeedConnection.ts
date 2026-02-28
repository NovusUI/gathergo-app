// hooks/useEventFeedConnection.ts

import { useEventFeed } from "./useEventFeed";

export function useEventFeedConnection(eventId: string, _autoJoin = true) {
  // autoJoin is handled inside useEventFeed to avoid duplicate joins/listeners.
  return useEventFeed(eventId);
}
