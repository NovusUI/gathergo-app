import CustomButton from "@/components/buttons/CustomBtn1";
import AppLoader from "@/components/ui/AppLoader";
import { GatherGoMascot } from "@/components/gogo/mascot/GatherGoMascot";
import type { useGogoEventCreation } from "@/components/gogo/tasks/eventCreation/useGogoEventCreation";
import type { EventCreationSection } from "@/components/gogo/tasks/eventCreation/types";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  type KeyboardEvent,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";

type Props = {
  conversation: ReturnType<typeof useGogoEventCreation>;
  isDonationEvent: boolean;
  onOpenSection: (section: EventCreationSection) => void;
  onReview: () => void;
};

const EDITOR_LABELS: Record<EventCreationSection, string> = {
  "Date and Time": "Choose date & time",
  Location: "Choose a location",
  Pricing: "Set up attendance",
  Story: "Edit the event story",
  Volunteering: "Add volunteer roles",
  Cover: "Choose a cover image",
  Links: "Add event links",
};

export default function GogoEventCreator({
  conversation,
  isDonationEvent,
  onOpenSection,
  onReview,
}: Props) {
  const { messages, isPending, error, send, retry } = conversation;
  const viewportRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const inputRef = useRef<TextInput>(null);
  const keyboardTop = useRef<number | null>(null);
  const [keyboardLayout, setKeyboardLayout] = useState({
    overlap: 0,
    inputMaxHeight: 160,
  });
  const revealAnswer = useCallback(() => {
    const viewport = viewportRef.current;
    const scroll = scrollRef.current;
    const content = contentRef.current;
    const input = inputRef.current;
    if (!viewport || !scroll || !content || !input || !input.isFocused())
      return;

    viewport.measureInWindow((_x, top, _width, height) => {
      if (
        viewportRef.current !== viewport ||
        scrollRef.current !== scroll ||
        contentRef.current !== content ||
        inputRef.current !== input ||
        !input.isFocused()
      )
        return;
      const visibleHeight = Math.max(
        0,
        Math.min(height, (keyboardTop.current ?? top + height) - top),
      );
      // Some native windows overlay the keyboard instead of resizing. Reserve
      // only that remaining overlap, so resized windows aren't adjusted twice.
      const overlap = height - visibleHeight;
      const inputMaxHeight = Math.min(160, Math.max(56, visibleHeight - 32));
      setKeyboardLayout((current) =>
        current.overlap === overlap && current.inputMaxHeight === inputMaxHeight
          ? current
          : { overlap, inputMaxHeight },
      );
      input.measureLayout(content, (_x, y) => {
        if (inputRef.current === input && input.isFocused()) {
          scroll.scrollTo({ y: Math.max(0, y - 16), animated: true });
        }
      });
    });
  }, []);

  useEffect(() => {
    const updateKeyboard = (event: KeyboardEvent) => {
      keyboardTop.current = event.endCoordinates.screenY;
      revealAnswer();
    };
    const show = Keyboard.addListener("keyboardDidShow", updateKeyboard);
    const change = Keyboard.addListener(
      "keyboardDidChangeFrame",
      updateKeyboard,
    );
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      keyboardTop.current = null;
      setKeyboardLayout({ overlap: 0, inputMaxHeight: 160 });
    });
    return () => {
      show.remove();
      change.remove();
      hide.remove();
    };
  }, [revealAnswer]);
  const [answer, setAnswer] = useState({ turn: messages.length, text: "" });
  const [customAnswerTurn, setCustomAnswerTurn] = useState<number | null>(null);
  const prompt = messages
    .filter((message) => message.role === "assistant")
    .slice(-1)[0];
  const section = prompt.section;
  const text = answer.turn === messages.length ? answer.text : "";
  const isReview = section === "Review";
  const showComposer =
    customAnswerTurn === messages.length ||
    (!isReview && !section && prompt.choices.length === 0);

  const submit = () => {
    if (!text.trim() || isPending) return;
    void send(text);
    setAnswer({ turn: messages.length, text: "" });
  };

  return (
    <View ref={viewportRef} collapsable={false} style={tw`flex-1`}>
      <ScrollView
        ref={scrollRef}
        style={tw`flex-1`}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: keyboardLayout.overlap,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onLayout={revealAnswer}
        onContentSizeChange={revealAnswer}
      >
        <View
          ref={contentRef}
          collapsable={false}
          onLayout={revealAnswer}
          style={[
            tw`px-6 pt-5 pb-8`,
            { flexGrow: 1, justifyContent: "center" },
          ]}
        >
          {isPending ? (
            <View style={tw`items-center gap-5 py-8`}>
              <AppLoader size={64} accessibilityLabel="Gogo is replying" />
              <Text
                accessibilityLiveRegion="polite"
                style={tw`text-center text-lg text-[#AFC0F4]`}
              >
                Let me work on that…
              </Text>
            </View>
          ) : (
            <View style={tw`gap-6`}>
              <GatherGoMascot
                variant="idle"
                size={96}
                showBadge={false}
                style={tw`self-center`}
              />
              {error ? (
                <View style={tw`gap-5`}>
                  <Text
                    accessibilityRole="header"
                    style={tw`text-center text-2xl font-semibold text-white`}
                  >
                    Gogo couldn’t reply
                  </Text>
                  <Text
                    accessibilityLiveRegion="polite"
                    style={tw`text-center text-base leading-6 text-[#AFC0F4]`}
                  >
                    {error}
                  </Text>
                  <CustomButton
                    onPress={() => void retry()}
                    title="Try again"
                    showArrow={false}
                    buttonClassName="bg-[#0FF1CF] w-full !border-none"
                    textClassName="!text-black"
                  />
                </View>
              ) : (
                <>
                  <Text
                    accessibilityRole="header"
                    accessibilityLiveRegion="polite"
                    style={tw`text-center text-2xl font-semibold leading-8 text-white`}
                  >
                    {prompt.content}
                  </Text>
                  {!showComposer && prompt.choices.length ? (
                    <View style={tw`gap-3`}>
                      {prompt.choices.map((choice) => (
                        <TouchableOpacity
                          key={choice}
                          accessibilityRole="button"
                          onPress={() => void send(choice)}
                          style={tw`min-h-[52px] items-center justify-center rounded-2xl border border-[#345A70] bg-[#101C45] px-5 py-4`}
                        >
                          <Text
                            style={tw`text-center text-base font-medium text-white`}
                          >
                            {choice}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                  {!showComposer && section && section !== "Review" ? (
                    <CustomButton
                      onPress={() => onOpenSection(section)}
                      title={
                        section === "Pricing" && isDonationEvent
                          ? "Set up donations"
                          : EDITOR_LABELS[section]
                      }
                      showArrow={false}
                      buttonClassName="w-full border-[#345A70] bg-[#101C45]"
                    />
                  ) : null}
                  {!showComposer && isReview ? (
                    <CustomButton
                      onPress={onReview}
                      title="Review event"
                      showArrow={false}
                      buttonClassName="bg-[#0FF1CF] w-full !border-none"
                      textClassName="!text-black"
                    />
                  ) : null}
                  {showComposer ? (
                    <View style={tw`gap-4`}>
                      <TextInput
                        ref={inputRef}
                        onFocus={() => {
                          keyboardTop.current =
                            Keyboard.metrics()?.screenY ?? null;
                          revealAnswer();
                        }}
                        onContentSizeChange={revealAnswer}
                        onLayout={revealAnswer}
                        accessibilityLabel="Message Gogo about your event"
                        value={text}
                        onChangeText={(value) =>
                          setAnswer({ turn: messages.length, text: value })
                        }
                        placeholder={
                          messages.length === 1
                            ? isDonationEvent
                              ? "Tell me who or what you’re supporting…"
                              : "e.g. A tree-planting morning in Lagos…"
                            : "Your answer…"
                        }
                        placeholderTextColor="#8FA1CB"
                        multiline
                        maxLength={2000}
                        textAlignVertical="top"
                        style={[
                          tw`rounded-2xl border border-[#34516A] bg-[#0A173F] px-4 py-4 text-base leading-6 text-white`,
                          {
                            minHeight: Math.min(
                              100,
                              keyboardLayout.inputMaxHeight,
                            ),
                            maxHeight: keyboardLayout.inputMaxHeight,
                          },
                        ]}
                      />
                      <CustomButton
                        onPress={submit}
                        title="Continue"
                        disabled={!text.trim()}
                        showArrow={false}
                        buttonClassName="bg-[#0FF1CF] w-full !border-none"
                        textClassName="!text-black"
                      />
                      {section || prompt.choices.length > 0 ? (
                        <TouchableOpacity
                          accessibilityRole="button"
                          onPress={() => setCustomAnswerTurn(null)}
                          style={tw`min-h-[44px] items-center justify-center`}
                        >
                          <Text style={tw`text-sm text-[#AFC0F4]`}>
                            Use suggested options
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ) : (
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={() => setCustomAnswerTurn(messages.length)}
                      style={tw`min-h-[44px] items-center justify-center`}
                    >
                      <Text style={tw`text-sm text-[#AFC0F4]`}>
                        {isReview
                          ? "I’d like to change something"
                          : "Answer in my own words"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
