import type { EventFormData } from "@/schemas/event";
import { getEventCreationReply } from "@/components/gogo/services/api";
import type {
  EventCreationAssistantReply,
  EventCreationAssistantRequest,
  EventCreationMessage,
  EventCreationOptionalSection,
  EventCreationSection,
} from "@/components/gogo/tasks/eventCreation/types";
import {
  applyEventCreationUpdates,
  buildEventCreationDraft,
} from "@/components/gogo/tasks/eventCreation/draft";
import { EVENT_CREATION_OPTIONAL_SECTIONS } from "@/components/gogo/tasks/eventCreation/types";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

export type ConversationMessage = EventCreationMessage &
  (
    | { role: "user" }
    | ({ role: "assistant" } & Pick<
        EventCreationAssistantReply,
        "choices" | "section" | "suggestedImpactStory"
      >)
  );
export type EventCreationConversationState = {
  messages: ConversationMessage[];
  addressedSections: EventCreationOptionalSection[];
};
type Props = Pick<UseFormReturn<EventFormData>, "getValues" | "setValue"> & {
  isDonationEvent: boolean;
  initialState?: EventCreationConversationState;
};

export function useGogoEventCreation({
  getValues,
  setValue,
  isDonationEvent,
  initialState,
}: Props) {
  const [messages, setMessages] = useState<ConversationMessage[]>(
    initialState?.messages ?? [
      {
        role: "assistant",
        content: isDonationEvent
          ? "What are you raising support for? Include any plans you have."
          : getValues().registrationType === "foodbank"
            ? "Who are you sharing meals with? Add any collection plans you know."
            : "What’s your event idea? Add any date, place or price you know.",
        choices: [],
        section: null,
        suggestedImpactStory: null,
      },
    ],
  );
  const addressedSections = useRef<EventCreationOptionalSection[]>(
    initialState?.addressedSections ?? [],
  );
  const prompt = messages
    .filter((message) => message.role === "assistant")
    .slice(-1)[0];
  const suggestedImpactStory = prompt.suggestedImpactStory;
  const optionalSection = EVENT_CREATION_OPTIONAL_SECTIONS.find(
    (section) => section === prompt.section,
  );
  const isRequiredVolunteerStep =
    getValues().registrationType === "volunteer" &&
    (optionalSection === "Impact story" || optionalSection === "Volunteering");
  const skippableSection = isRequiredVolunteerStep
    ? undefined
    : optionalSection;
  const addressSection = (section: EventCreationSection) => {
    const optional = EVENT_CREATION_OPTIONAL_SECTIONS.find(
      (value) => value === section,
    );
    if (optional && !addressedSections.current.includes(optional))
      addressedSections.current = [...addressedSections.current, optional];
  };
  const [error, setError] = useState<string | null>(
    initialState?.messages.at(-1)?.role === "user"
      ? "Your last reply was interrupted. Try again to continue."
      : null,
  );
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
          addressedSections: addressedSections.current,
          messages: history.slice(-20).map((message) => ({
            role: message.role,
            content:
              message.role === "assistant" && message.suggestedImpactStory
                ? `${message.content}\nSuggested impact story: ${message.suggestedImpactStory}`
                : message.content,
          })),
        },
        signal: request.signal,
      });
      if (request.signal.aborted || currentRequest.current !== request) return;
      applyEventCreationUpdates(setValue, response.data.updates);
      if (response.data.completedSection)
        addressSection(response.data.completedSection);
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: response.data.reply,
          choices: response.data.choices,
          section: response.data.section,
          suggestedImpactStory: response.data.suggestedImpactStory,
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
    getDraftState: (): EventCreationConversationState => {
      const recent = messages.slice(-20);
      return {
        messages: recent.some((message) => message.role === "assistant")
          ? recent
          : [prompt, ...recent.slice(-19)],
        addressedSections: addressedSections.current,
      };
    },
    error,
    isPending,
    send,
    retry: () => requestReply(messages),
    optionalSection: skippableSection,
    skipSection: () => {
      if (!skippableSection || currentRequest.current) return;
      addressSection(skippableSection);
      return send(`Skip ${skippableSection} for now. What is next?`);
    },
    continueFromDraft: (section?: EventCreationSection) => {
      if (currentRequest.current) return;
      if (section) addressSection(section);
      return send(
        "I’ve updated the draft using the form. What should we add next?",
      );
    },
    suggestedImpactStory,
    acceptImpactStory: () => {
      if (!suggestedImpactStory || currentRequest.current) return;
      setValue("impactDescription", suggestedImpactStory, {
        shouldDirty: true,
        shouldValidate: true,
      });
      addressSection("Impact story");
      return send("Use this impact story. What is next?");
    },
    cancel,
  };
}
