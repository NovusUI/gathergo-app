import { useAuth } from "@/context/AuthContext";
import { usePendingEventFeedback } from "@/services/queries";
import { QUERY_KEYS } from "@/services/queryKeys";
import { useIsFocused } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PostEventSurvey } from "./PostEventSurvey";

export function PostEventSurveyPrompt() {
  const focused = useIsFocused();
  const { user } = useAuth();
  const client = useQueryClient();
  const [dismissed, setDismissed] = useState(false);
  const query = usePendingEventFeedback(focused && !dismissed);
  useEffect(() => {
    if (!focused) setDismissed(false);
  }, [focused]);
  const response = query.data;
  if (!response || !response.data) return null;
  const event = response.data;
  return focused && !dismissed && user?.hasPreferences ? (
    <PostEventSurvey
      key={event.id}
      event={event}
      onClose={() => {
        setDismissed(true);
        client.setQueryData([...QUERY_KEYS.pendingEventFeedback, user.id], {
          ...response,
          data: null,
        });
      }}
    />
  ) : null;
}
