import CustomButton from "@/components/buttons/CustomBtn1";
import { GatherGoMascot } from "@/components/gogo/mascot/GatherGoMascot";
import Input from "@/components/inputs/CustomInput1";
import AppLoader from "@/components/ui/AppLoader";
import { useInterestExamples } from "@/services/queries";
import type {
  HelpMode,
  InterestCatalog,
  InterestProfile,
  SaveInterestProfile,
} from "@/types/preferences";
import { formatShortDate } from "@/utils/dateTimeHandler";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import tw from "twrnc";
import { InterestMap } from "./InterestMap";

const MODES: Record<HelpMode, string> = {
  attend: "Attend",
  volunteer: "Volunteer",
  donate: "Donate",
  carpool: "Carpool",
};
const QUESTIONS = [
  "Hi, I’m Gogo. What matters to you?",
  "How do you like to get involved?",
  "Where should we look?",
  "Would you join something like this?",
  "Your map is taking shape.",
];
type Props = {
  catalog: InterestCatalog;
  profile: InterestProfile;
  firstTime: boolean;
  pending: boolean;
  onSave: (data: SaveInterestProfile) => void;
  onCancel: () => void;
};
export function GogoInterestSetup({
  catalog,
  profile,
  firstTime,
  pending,
  onSave,
  onCancel,
}: Props) {
  const { height } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState(profile.interests.slice(0, 5));
  const [helpModes, setHelpModes] = useState(profile.helpModes);
  const [city, setCity] = useState(profile.city ?? "");
  const [likedEventIds, setLikedEventIds] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const examples = useInterestExamples(
    { interests, city: city.trim() },
    step === 3
  );
  const cards = examples.data?.data;
  useEffect(() => {
    if (step === 3 && cards && cards.length === 0) setStep(4);
  }, [cards, step]);
  const likedTopics = cards
    ? cards
        .filter((event) => likedEventIds.includes(event.id))
        .flatMap((event) => event.topics)
    : [];
  const mapTopics = catalog.topics
    .filter(
      (topic) => interests.includes(topic.id) || likedTopics.includes(topic.id)
    )
    .sort(
      (a, b) =>
        Number(interests.includes(b.id)) - Number(interests.includes(a.id))
    );
  const toggleInterest = (id: string) =>
    setInterests((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : current.length < 5
        ? [...current, id]
        : current
    );
  const next = () => {
    setIndex(0);
    if (step === 2) setLikedEventIds([]);
    setStep((current) => current + 1);
  };
  const reactToEvent = (liked: boolean) => {
    if (!cards || index >= cards.length) return;
    const eventId = cards[index].id;
    setLikedEventIds((current) =>
      liked
        ? current.includes(eventId)
          ? current
          : [...current, eventId]
        : current.filter((id) => id !== eventId)
    );
    if (index + 1 >= cards.length) setStep(4);
    else setIndex(index + 1);
  };
  const save = () =>
    onSave({
      interests,
      helpModes,
      city: city.trim(),
      likedEventIds,
      learningEnabled: firstTime
        ? interests.length + helpModes.length + likedEventIds.length > 0
        : profile.learningEnabled,
    });
  const skipAll = () =>
    onSave({
      interests: [],
      helpModes: [],
      city: "",
      likedEventIds: [],
      learningEnabled: false,
    });
  const example = cards?.[index];
  return (
    <KeyboardAvoidingView
      style={tw`flex-1`}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={tw`flex-row items-center justify-between px-5 pt-3`}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Previous question"
          disabled={pending || step === 0}
          onPress={() => setStep((current) => Math.max(0, current - 1))}
          style={tw`min-h-11 justify-center px-2`}
        >
          <Text
            style={tw`${step === 0 ? "text-transparent" : "text-[#AFC0F4]"}`}
          >
            Back
          </Text>
        </TouchableOpacity>
        <Text style={tw`text-xs text-[#8FA5E2]`}>
          {step < 4 ? `${step + 1} of 4` : "Your starting map"}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          disabled={pending}
          onPress={firstTime ? skipAll : onCancel}
          style={tw`min-h-11 justify-center px-2`}
        >
          <Text style={tw`text-[#AFC0F4]`}>
            {firstTime ? "Skip setup" : "Cancel"}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-5 pb-5 ${
          step === 1 ? "grow justify-end" : ""
        }`}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 ? (
          <GatherGoMascot
            size={height < 650 ? 56 : 88}
            showBadge={false}
            style={tw`self-center my-2`}
          />
        ) : (
          <InterestMap topics={mapTopics} strongerIds={likedTopics} />
        )}
        <Text
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          style={tw`text-center font-semibold text-white ${
            step === 1 ? "text-xl leading-7 mb-3" : "text-2xl mb-4"
          }`}
        >
          {QUESTIONS[step]}
        </Text>
        {step === 0 && (
          <>
            <View style={tw`flex-row flex-wrap justify-center gap-3`}>
              {catalog.topics.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: interests.includes(topic.id),
                  }}
                  disabled={
                    pending ||
                    (!interests.includes(topic.id) && interests.length === 5)
                  }
                  onPress={() => toggleInterest(topic.id)}
                  style={[
                    tw`rounded-full border px-4 py-3`,
                    {
                      borderColor: topic.accent,
                      backgroundColor: interests.includes(topic.id)
                        ? topic.accent
                        : "#101C45",
                    },
                  ]}
                >
                  <Text
                    style={[
                      tw`font-semibold`,
                      {
                        color: interests.includes(topic.id)
                          ? "#01082E"
                          : "#fff",
                      },
                    ]}
                  >
                    {topic.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        {step === 1 && (
          <>
            <Text style={tw`text-center text-sm text-[#AFC0F4] mb-4`}>
              Choose any that feel like you.
            </Text>
            <View style={tw`flex-row flex-wrap justify-between gap-3`}>
              {catalog.helpModes.map((mode) => (
                <TouchableOpacity
                  key={mode}
                  accessibilityRole="button"
                  accessibilityState={{ selected: helpModes.includes(mode) }}
                  disabled={pending}
                  onPress={() =>
                    setHelpModes((current) =>
                      current.includes(mode)
                        ? current.filter((value) => value !== mode)
                        : [...current, mode]
                    )
                  }
                  style={[
                    tw`min-h-14 justify-center rounded-2xl border px-3 py-4 ${
                      helpModes.includes(mode)
                        ? "border-[#0FF1CF] bg-[#0FF1CF]/15"
                        : "border-[#24345A] bg-[#101C45]"
                    }`,
                    { width: "47%" },
                  ]}
                >
                  <Text style={tw`text-center font-semibold text-white`}>
                    {MODES[mode]}
                    {helpModes.includes(mode) ? " ✓" : ""}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        {step === 2 && (
          <>
            <Text style={tw`text-center text-sm text-[#AFC0F4] mb-5`}>
              Add your city to help me find nearby events.
            </Text>
            <Input
              accessibilityLabel="Preferred city"
              value={city}
              onChangeText={setCity}
              placeholder="Your city, e.g. Lagos"
              autoCapitalize="words"
              maxLength={100}
              editable={!pending}
              returnKeyType="done"
            />
          </>
        )}
        {step === 3 &&
          (examples.isPending ? (
            <View style={tw`items-center py-5`}>
              <AppLoader accessibilityLabel="Finding event examples" />
            </View>
          ) : examples.isError ? (
            <View style={tw`items-center gap-3`}>
              <Text style={tw`text-center text-[#AFC0F4]`}>
                I couldn’t load event examples. You can retry or keep going.
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => void examples.refetch()}
                style={tw`p-3`}
              >
                <Text style={tw`text-[#0FF1CF]`}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : example ? (
            <View
              style={tw`rounded-3xl border border-[#24345A] bg-[#101C45] overflow-hidden`}
            >
              {example.thumbnailUrl ? (
                <Image
                  source={{ uri: example.thumbnailUrl }}
                  style={tw`h-36 w-full`}
                  contentFit="cover"
                />
              ) : null}
              <View style={tw`p-4 gap-2`}>
                <Text style={tw`text-xs text-[#8FA5E2]`}>
                  {index + 1} of {cards.length} ·{" "}
                  {formatShortDate(example.startDate)}
                </Text>
                <Text style={tw`text-lg font-semibold text-white`}>
                  {example.title}
                </Text>
                {example.description ? (
                  <Text numberOfLines={2} style={tw`text-sm text-[#AFC0F4]`}>
                    {example.description}
                  </Text>
                ) : null}
                {example.location ? (
                  <Text numberOfLines={1} style={tw`text-sm text-[#8FA5E2]`}>
                    {example.location}
                  </Text>
                ) : null}
              </View>
              <View style={tw`flex-row gap-3 p-4 pt-0`}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Skip this event"
                  onPress={() => reactToEvent(false)}
                  style={tw`flex-1 items-center rounded-2xl bg-[#1B2A50] p-4`}
                >
                  <Text style={tw`text-white`}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Like this event"
                  onPress={() => reactToEvent(true)}
                  style={tw`flex-1 items-center rounded-2xl bg-[#0FF1CF] p-4`}
                >
                  <Text style={tw`font-semibold text-[#01082E]`}>Like ♥</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null)}
        {step === 4 && (
          <Text style={tw`text-center text-sm leading-6 text-[#AFC0F4]`}>
            {mapTopics.length
              ? "A starting point for finding events that fit you. Tune your map anytime."
              : "Your feed can start with discovery. Add interests whenever you’re ready."}
          </Text>
        )}
      </ScrollView>
      <View style={tw`px-5 pb-5 pt-3 gap-2`}>
        {step !== 3 && (
          <CustomButton
            onPress={step === 4 ? save : next}
            disabled={pending}
            title={
              pending
                ? "Saving…"
                : step === 4
                ? firstTime
                  ? "Find my events"
                  : "Save map"
                : "Continue"
            }
            showArrow={false}
            buttonClassName={`w-full bg-[#0FF1CF] border-0 ${
              step === 1 ? "min-h-11 py-3" : ""
            }`}
            textClassName="!text-[#01082E]"
          />
        )}
        {step < 4 && (
          <TouchableOpacity
            accessibilityRole="button"
            disabled={pending}
            onPress={() => {
              if (step === 0) setInterests([]);
              if (step === 1) setHelpModes([]);
              if (step === 2) setCity("");
              if (step === 3) setStep(4);
              else next();
            }}
            style={tw`min-h-11 justify-center items-center`}
          >
            <Text style={tw`text-sm text-[#8FA5E2]`}>
              {step === 3 ? "Skip examples" : "Skip this question"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
