import type { EventFormData } from "@/schemas/event";
import { getEventCreationReply } from "@/services/serviceFn";
import type {
  EventCreationAssistantReply,
  EventCreationAssistantRequest,
  EventCreationMessage,
} from "@/types/eventCreation";
import {
  applyEventCreationUpdates,
  buildEventCreationDraft,
} from "@/utils/eventCreation";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

type ConversationMessage = EventCreationMessage &
  (
    | { role: "user" }
    | ({ role: "assistant" } & Pick<
        EventCreationAssistantReply,
        "choices" | "section"
      >)
  );
type Props = Pick<UseFormReturn<EventFormData>, "getValues" | "setValue"> & {
  isDonationEvent: boolean;
};

export function useGogoEventCreation({
  getValues,
  setValue,
  isDonationEvent,
}: Props) {
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      role: "assistant",
      content: isDonationEvent
        ? "Who or what are we raising support for?"
        : "What would you like to bring people together for?",
      choices: [],
      section: null,
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const currentRequest = useRef<AbortController | null>(null);
  const { mutateAsync, isPending, reset } = useMutation({
    mutationFn: ({
      payload,
      signal,
    }: {
      payload: EventCreationAssistantRequest;
      signal: AbortSignal;
    }) => getEventCreationReply(payload, signal),
    retry: false,
  });

  const requestReply = async (history: ConversationMessage[]) => {
    if (currentRequest.current) return;
    const request = new AbortController();
    currentRequest.current = request;
    setError(null);
    try {
      const response = await mutateAsync({
        payload: {
          eventType: isDonationEvent ? "donation" : "general",
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          draft: buildEventCreationDraft(getValues()),
          messages: history
            .slice(-20)
            .map(({ role, content }) => ({ role, content })),
        },
        signal: request.signal,
      });
      if (request.signal.aborted || currentRequest.current !== request) return;
      applyEventCreationUpdates(setValue, response.data.updates);
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: response.data.reply,
          choices: response.data.choices,
          section: response.data.section,
        },
      ]);
    } catch (failure) {
      if (!request.signal.aborted && currentRequest.current === request) {
        const message = isAxiosError<{ message: string | string[] }>(failure)
          ? failure.response?.data.message
          : undefined;
        setError(
          (Array.isArray(message) ? message.join("\n") : message) ||
            "Gogo couldn't reply. Try again or continue with the manual form.",
        );
      }
    } finally {
      if (currentRequest.current === request) currentRequest.current = null;
    }
  };

  const send = async (content: string) => {
    const text = content.trim();
    if (!text || currentRequest.current) return;
    const history = [...messages, { role: "user" as const, content: text }];
    setMessages(history);
    await requestReply(history);
  };
  const cancel = useCallback(() => {
    currentRequest.current?.abort();
    currentRequest.current = null;
    reset();
    setError(null);
  }, [reset]);
  useEffect(
    () => () => {
      currentRequest.current?.abort();
    },
    [],
  );

  return {
    messages,
    error,
    isPending,
    send,
    retry: () => requestReply(messages),
    continueFromDraft: () =>
      send("I’ve updated the draft using the form. What should we add next?"),
    cancel,
  };
}
