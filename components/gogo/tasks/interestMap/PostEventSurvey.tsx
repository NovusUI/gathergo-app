import { useAppTheme } from "@/hooks/useAppTheme";
import AppLoader from "@/components/ui/AppLoader";
import { GatherGoMascot } from "@/components/gogo/mascot/GatherGoMascot";
import {
  useDeferEventFeedback,
  useSaveEventFeedback,
} from "@/services/mutations";
import type {
  EventFeedbackRating,
  PendingEventFeedback,
} from "@/types/preferences";
import { getApiErrorMessage } from "@/utils/apiError";
import { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SurveyMapChange } from "./SurveyMapChange";

const REACTIONS: {
  rating: EventFeedbackRating;
  label: string;
  emoji: string;
}[] = [
  { rating: "LOVED", label: "Loved it", emoji: "❤️" },
  { rating: "OKAY", label: "It was okay", emoji: "😐" },
  { rating: "NOT_FOR_ME", label: "Not for me", emoji: "☹️" },
];

export function PostEventSurvey({
  event,
  onClose,
}: {
  event: PendingEventFeedback;
  onClose: () => void;
}) {
  const { tw } = useAppTheme();
  const [rating, setRating] = useState<EventFeedbackRating | null>(null);
  const [moreLikeThis, setMoreLikeThis] = useState(false);
  const save = useSaveEventFeedback();
  const defer = useDeferEventFeedback();
  const result = save.data?.data;
  const pending = save.isPending || defer.isPending;
  const postpone = () => {
    if (pending) return;
    if (result) onClose();
    else defer.mutate(event.id, { onSuccess: onClose });
  };
  const submit = () => {
    if (result) onClose();
    else if (rating && !pending)
      save.mutate({ eventId: event.id, rating, moreLikeThis });
  };
  const error = save.isError ? save.error : defer.isError ? defer.error : null;
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={postpone}
    >
      <SafeAreaView style={tw`flex-1 bg-background dark:bg-[#01082E]`}>
        <View style={tw`flex-1 w-full max-w-[500px] self-center px-6`}>
          <View style={tw`flex-row justify-end`}>
            {!result ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={postpone}
                disabled={pending}
                style={tw`min-h-11 justify-center px-2`}
              >
                <Text style={tw`font-semibold text-secondary dark:text-[#AFC0E7]`}>Not now</Text>
              </TouchableOpacity>
            ) : (
              <View style={tw`h-11`} />
            )}
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={tw`pb-5 gap-4`}
          >
            <View style={tw`items-center gap-3`}>
              <GatherGoMascot
                size={116}
                variant={result ? "success" : "idle"}
                showBadge={false}
              />
              <Text
                accessibilityRole="header"
                style={tw`text-center text-2xl leading-8 font-bold text-foreground dark:text-white`}
              >
                {result ? "A little more you." : `How was ${event.title}?`}
              </Text>
              <Text style={tw`text-center text-sm leading-5 text-secondary dark:text-[#AFC0E7]`}>
                {result
                  ? "Your answer is saved. Thanks for helping me tune your map."
                  : "Your answer helps me tune your map."}
              </Text>
            </View>
            <View accessibilityRole="radiogroup" style={tw`gap-3 mt-1`}>
              {REACTIONS.map((reaction) => {
                const selected = rating === reaction.rating;
                return (
                  <TouchableOpacity
                    key={reaction.rating}
                    accessibilityRole="radio"
                    accessibilityLabel={reaction.label}
                    accessibilityState={{
                      checked: selected,
                      disabled: pending || Boolean(result),
                    }}
                    disabled={pending || Boolean(result)}
                    onPress={() => {
                      setRating(reaction.rating);
                      if (reaction.rating === "NOT_FOR_ME")
                        setMoreLikeThis(false);
                    }}
                    style={tw`flex-row items-center gap-3 rounded-2xl border-2 px-5 py-4 ${selected ? "bg-accentFill/15 dark:bg-[#0FF1CF]/15 border-accent dark:border-[#0FF1CF]" : "bg-surface dark:bg-[#101C45] border-border dark:border-[#24345A]"}`}
                  >
                    <Text style={tw`text-lg`}>{reaction.emoji}</Text>
                    <Text style={tw`text-base font-semibold text-foreground dark:text-white`}>
                      {reaction.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityLabel="More like this"
              accessibilityState={{
                checked: moreLikeThis,
                disabled: pending || Boolean(result) || rating === "NOT_FOR_ME",
              }}
              disabled={pending || Boolean(result) || rating === "NOT_FOR_ME"}
              onPress={() => setMoreLikeThis((current) => !current)}
              style={tw`self-start rounded-full border-2 border-accent dark:border-[#0FF1CF] px-4 py-3 ${moreLikeThis ? "bg-accentFill/15 dark:bg-[#0FF1CF]/15" : "bg-transparent"} ${rating === "NOT_FOR_ME" ? "opacity-40" : ""}`}
            >
              <Text style={tw`text-sm font-semibold text-foreground dark:text-white`}>
                {moreLikeThis ? "✓  " : "+  "}More like this
              </Text>
            </TouchableOpacity>
            {result ? <SurveyMapChange changes={result.changes} /> : null}
            {error ? (
              <Text
                accessibilityRole="alert"
                style={tw`text-sm text-danger dark:text-[#FF9CAA]`}
              >
                {getApiErrorMessage(
                  error,
                  "I couldn’t save that. Please try again.",
                )}
              </Text>
            ) : null}
          </ScrollView>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ disabled: pending || (!rating && !result) }}
            disabled={pending || (!rating && !result)}
            onPress={submit}
            style={tw`min-h-13 my-3 flex-row gap-2 items-center justify-center rounded-full bg-accentFill dark:bg-[#0FF1CF] px-5 py-4 ${!rating && !result ? "opacity-40" : ""}`}
          >
            {pending ? (
              <AppLoader tone="dark" accessibilityLabel="Saving your answer" />
            ) : null}
            <Text style={tw`font-bold text-base text-onAccent dark:text-[#01082E]`}>
              {pending ? "Saving…" : result ? "Done" : "See my map"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
