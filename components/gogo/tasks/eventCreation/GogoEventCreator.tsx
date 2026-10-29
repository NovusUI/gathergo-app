import { useAppTheme } from "@/hooks/useAppTheme";
import CustomButton from "@/components/buttons/CustomBtn1";
import AppLoader from "@/components/ui/AppLoader";
import { GatherGoMascot } from "@/components/gogo/mascot/GatherGoMascot";
import type { useGogoEventCreation } from "@/components/gogo/tasks/eventCreation/useGogoEventCreation";
import type { EventCreationSection } from "@/components/gogo/tasks/eventCreation/types";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Keyboard,
  type KeyboardEvent,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  conversation: ReturnType<typeof useGogoEventCreation>;
  isDonationEvent: boolean;
  isFoodBank?: boolean;
  onOpenSection: (section: EventCreationSection) => void;
  onReview: () => void;
  draftTitle: string;
  impactStory: string;
  renderInlineSection: (section: EventCreationSection) => ReactNode;
};

const EDITOR_LABELS: Record<EventCreationSection, string> = {
  "Date and Time": "Choose date & time",
  Location: "Choose a location",
  Pricing: "Set up attendance",
  Story: "Edit the event story",
  Volunteering: "Add volunteer roles",
  Cover: "Choose a cover image",
  Links: "Add event links",
  "Impact story": "Shape the impact story",
  "Impact map": "Explore impact suggestions",
  Interests: "Choose event interests",
};

export default function GogoEventCreator({
  conversation,
  isDonationEvent,
  isFoodBank = false,
  onOpenSection,
  onReview,
  draftTitle,
  impactStory,
  renderInlineSection,
}: Props) {
  const { tw, color } = useAppTheme();
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
  const proposedStory = conversation.suggestedImpactStory ?? impactStory;
  const isImpactStory = section === "Impact story";
  const inlineSection =
    section && section !== "Review" ? renderInlineSection(section) : null;
  const showComposer =
    customAnswerTurn === messages.length ||
    (!isReview && !section && prompt.choices.length === 0) ||
    (isImpactStory && !proposedStory);

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
                style={tw`text-center text-lg text-secondary dark:text-[#AFC0F4]`}
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
                    style={tw`text-center text-2xl font-semibold text-foreground dark:text-white`}
                  >
                    Gogo couldn’t reply
                  </Text>
                  <Text
                    accessibilityLiveRegion="polite"
                    style={tw`text-center text-base leading-6 text-secondary dark:text-[#AFC0F4]`}
                  >
                    {error}
                  </Text>
                  <CustomButton
                    onPress={() => void retry()}
                    title="Try again"
                    showArrow={false}
                    buttonClassName="bg-accentFill dark:bg-[#0FF1CF] w-full !border-none"
                    textClassName="!text-onAccent dark:text-black"
                  />
                </View>
              ) : (
                <>
                  {draftTitle ? (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Edit event name"
                      onPress={() => onOpenSection("Story")}
                      style={tw`min-h-[44px] flex-row items-center justify-center gap-3`}
                    >
                      <Text
                        style={tw`shrink text-center text-base font-semibold text-accent dark:text-[#0FF1CF]`}
                      >
                        {draftTitle}
                      </Text>
                      <Text style={tw`text-sm text-secondary dark:text-[#AFC0F4]`}>Edit</Text>
                    </TouchableOpacity>
                  ) : null}
                  <Text
                    accessibilityRole="header"
                    accessibilityLiveRegion="polite"
                    style={tw`text-center text-2xl font-semibold leading-8 text-foreground dark:text-white`}
                  >
                    {prompt.content}
                  </Text>
                  {!showComposer &&
                  !inlineSection &&
                  !isImpactStory &&
                  prompt.choices.length ? (
                    <View style={tw`gap-3`}>
                      {prompt.choices.map((choice) => (
                        <TouchableOpacity
                          key={choice}
                          accessibilityRole="button"
                          onPress={() => void send(choice)}
                          style={tw`min-h-[52px] items-center justify-center rounded-2xl border border-border dark:border-[#345A70] bg-surface dark:bg-[#101C45] px-5 py-4`}
                        >
                          <Text
                            style={tw`text-center text-base font-medium text-foreground dark:text-white`}
                          >
                            {choice}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                  {!showComposer && inlineSection ? (
                    <View key={messages.length}>{inlineSection}</View>
                  ) : null}
                  {!showComposer && isImpactStory && proposedStory ? (
                    <View style={tw`gap-4`}>
                      <Text
                        style={tw`text-center text-lg leading-7 text-foreground dark:text-[#DDE6FF]`}
                      >
                        {proposedStory}
                      </Text>
                      <CustomButton
                        onPress={() =>
                          void (conversation.suggestedImpactStory
                            ? conversation.acceptImpactStory()
                            : conversation.continueFromDraft("Impact story"))
                        }
                        title="Use this story"
                        showArrow={false}
                        buttonClassName="bg-accentFill dark:bg-[#0FF1CF] w-full !border-none"
                        textClassName="!text-onAccent dark:text-black"
                      />
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => onOpenSection("Impact story")}
                        style={tw`min-h-[44px] items-center justify-center`}
                      >
                        <Text style={tw`text-sm font-medium text-secondary dark:text-[#AFC0F4]`}>
                          Edit story manually
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                  {!showComposer &&
                  !inlineSection &&
                  !isImpactStory &&
                  section &&
                  section !== "Review" ? (
                    <CustomButton
                      onPress={() => onOpenSection(section)}
                      title={
                        section === "Pricing" && isDonationEvent
                          ? "Set up donations"
                          : section === "Pricing" && isFoodBank
                            ? "Set collection windows"
                            : EDITOR_LABELS[section]
                      }
                      showArrow={false}
                      buttonClassName="w-full border-border dark:border-[#345A70] bg-surface dark:bg-[#101C45]"
                    />
                  ) : null}
                  {!showComposer && isReview ? (
                    <CustomButton
                      onPress={onReview}
                      title="Review event"
                      showArrow={false}
                      buttonClassName="bg-accentFill dark:bg-[#0FF1CF] w-full !border-none"
                      textClassName="!text-onAccent dark:text-black"
                    />
                  ) : null}
                  {conversation.optionalSection ? (
                    <View style={tw`items-center gap-1`}>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => void conversation.skipSection()}
                        style={tw`min-h-[44px] items-center justify-center px-4`}
                      >
                        <Text style={tw`text-sm font-semibold text-accent dark:text-[#0FF1CF]`}>
                          Skip for now
                        </Text>
                      </TouchableOpacity>
                    </View>
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
                              : isFoodBank
                                ? "e.g. 200 meals at the community hall on Saturday…"
                                : "e.g. A tree-planting morning in Lagos…"
                            : "Your answer…"
                        }
                        placeholderTextColor={color("#8FA1CB", "muted")}
                        multiline
                        maxLength={2000}
                        textAlignVertical="top"
                        style={[
                          tw`rounded-2xl border border-borderStrong dark:border-[#34516A] bg-surface dark:bg-[#0A173F] px-4 py-4 text-base leading-6 text-foreground dark:text-white`,
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
                        buttonClassName="bg-accentFill dark:bg-[#0FF1CF] w-full !border-none"
                        textClassName="!text-onAccent dark:text-black"
                      />
                      {isImpactStory ? (
                        <TouchableOpacity
                          accessibilityRole="button"
                          onPress={() => onOpenSection("Impact story")}
                          style={tw`min-h-[44px] items-center justify-center`}
                        >
                          <Text style={tw`text-sm text-secondary dark:text-[#AFC0F4]`}>
                            Write story manually
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                      {(section && (!isImpactStory || proposedStory)) ||
                      prompt.choices.length > 0 ? (
                        <TouchableOpacity
                          accessibilityRole="button"
                          onPress={() => setCustomAnswerTurn(null)}
                          style={tw`min-h-[44px] items-center justify-center`}
                        >
                          <Text style={tw`text-sm text-secondary dark:text-[#AFC0F4]`}>
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
                      <Text style={tw`text-sm text-secondary dark:text-[#AFC0F4]`}>
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
