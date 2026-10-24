import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { EventFormData } from "@/schemas/event";
import { showGlobalError } from "@/utils/globalErrorHandler";
import {
  discardEventDraft,
  saveEventDraft,
  type SavedEventDraft,
} from "@/components/gogo/tasks/eventCreation/draftStorage";

export function useEventDraftPersistence({
  watch,
  getDraft,
  onLeave,
}: Pick<UseFormReturn<EventFormData>, "watch"> & {
  getDraft: () => SavedEventDraft;
  onLeave: () => void;
}) {
  const snapshot = useRef(getDraft);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleared = useRef(false);
  const focused = useRef(false);
  useEffect(() => {
    snapshot.current = getDraft;
  }, [getDraft]);
  const cancelTimer = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const flush = useCallback(() => {
    cancelTimer();
    if (cleared.current) return Promise.resolve();
    return saveEventDraft(snapshot.current());
  }, [cancelTimer]);
  const schedule = useCallback(() => {
    cancelTimer();
    if (!cleared.current)
      timer.current = setTimeout(() => {
        void flush().catch(() =>
          showGlobalError("Couldn’t save your event draft."),
        );
      }, 250);
  }, [cancelTimer, flush]);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      const subscription = watch(schedule);
      return () => {
        focused.current = false;
        subscription.unsubscribe();
        void flush().catch(() =>
          showGlobalError("Couldn’t save your event draft."),
        );
        onLeave();
      };
    }, [watch, flush, onLeave, schedule]),
  );
  useEffect(() => {
    if (focused.current) schedule();
  }, [getDraft, schedule]);
  return {
    flush,
    clear: () => {
      cleared.current = true;
      cancelTimer();
      return discardEventDraft(snapshot.current().values.registrationType);
    },
  };
}
