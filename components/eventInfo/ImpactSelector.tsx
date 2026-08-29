import {
  buildImpactSuggestionPayloadKey,
  buildLocalImpactSuggestions,
  EventRegistrationType,
  normalizeImpactSuggestions,
} from "@/constants/impact";
import { SdgGoalIcon } from "@/components/ui/SdgGoalIcon";
import { useImpactSuggestions } from "@/services/queries";
import { ImpactSuggestionData, ImpactSuggestionPayload } from "@/types/impact";
import { useDebounce } from "@/utils/useDebounce";
import { useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import tw from "twrnc";
import TextArea from "../inputs/CustomTextArea";

interface ImpactSelectorProps {
  eventTitle?: string;
  eventDescription?: string;
  impactDescription?: string;
  registrationType?: EventRegistrationType | null;
  onImpactDescriptionChange: (value: string) => void;
  onImpactSuggestionsChange?: (
    value: ImpactSuggestionData,
    payloadKey: string
  ) => void;
}

const EmptySuggestion = ({ label }: { label: string }) => (
  <View style={tw`rounded-full border border-[#1F335E] px-3 py-2`}>
    <Text style={tw`text-xs font-medium text-[#8EA0CA]`}>{label}</Text>
  </View>
);

export default function ImpactSelector({
  eventTitle,
  eventDescription,
  impactDescription,
  registrationType,
  onImpactDescriptionChange,
  onImpactSuggestionsChange,
}: ImpactSelectorProps) {
  const lastEmittedSuggestionKeyRef = useRef<string | null>(null);
  const suggestionPayload = useMemo<ImpactSuggestionPayload>(
    () => ({
      title: eventTitle?.trim() || "",
      description: eventDescription?.trim() || "",
      impactDescription: impactDescription?.trim() || "",
      registrationType: registrationType || null,
    }),
    [eventDescription, eventTitle, impactDescription, registrationType]
  );
  const debouncedSuggestionPayload = useDebounce(suggestionPayload, 450);
  const suggestionPayloadKey = useMemo(
    () => buildImpactSuggestionPayloadKey(debouncedSuggestionPayload),
    [debouncedSuggestionPayload]
  );
  const hasSuggestionText = useMemo(
    () =>
      [
        debouncedSuggestionPayload.title,
        debouncedSuggestionPayload.description,
        debouncedSuggestionPayload.impactDescription,
      ].some((part) => (part || "").trim().length >= 3),
    [debouncedSuggestionPayload]
  );
  const localSuggestions = useMemo(
    () => buildLocalImpactSuggestions(debouncedSuggestionPayload),
    [debouncedSuggestionPayload]
  );
  const {
    data: backendSuggestions,
    isError: backendSuggestionsError,
    isFetching: isFetchingBackendSuggestions,
  } = useImpactSuggestions(debouncedSuggestionPayload, {
    enabled: hasSuggestionText,
  });
  const impactSuggestions = useMemo(
    () =>
      hasSuggestionText
        ? normalizeImpactSuggestions(
            backendSuggestions?.data || localSuggestions,
            debouncedSuggestionPayload
          )
        : localSuggestions,
    [
      backendSuggestions?.data,
      debouncedSuggestionPayload,
      hasSuggestionText,
      localSuggestions,
    ]
  );
  const suggestedSdgGoals = impactSuggestions.sdgGoals;
  const suggestedMechanisms = impactSuggestions.impactPaths;
  const suggestedCommitments = impactSuggestions.commitments;
  const isMappingImpact = hasSuggestionText && isFetchingBackendSuggestions;
  const impactMapStatus = isMappingImpact
    ? "Mapping impact"
    : backendSuggestionsError
      ? "Local map"
      : backendSuggestions?.data
        ? "Live map"
        : "Ready";
  const impactSuggestionsKey = useMemo(
    () => `${suggestionPayloadKey}:${JSON.stringify(impactSuggestions)}`,
    [impactSuggestions, suggestionPayloadKey]
  );

  useEffect(() => {
    if (!onImpactSuggestionsChange) {
      return;
    }

    if (lastEmittedSuggestionKeyRef.current === impactSuggestionsKey) {
      return;
    }

    lastEmittedSuggestionKeyRef.current = impactSuggestionsKey;
    onImpactSuggestionsChange?.(impactSuggestions, suggestionPayloadKey);
  }, [
    impactSuggestions,
    impactSuggestionsKey,
    onImpactSuggestionsChange,
    suggestionPayloadKey,
  ]);

  return (
    <View style={tw`gap-4`}>
      <View>
        <Text style={tw`mb-2 text-xs uppercase tracking-widest text-[#7E93C7]`}>
          Impact story
        </Text>
        <TextArea
          value={impactDescription || ""}
          onChange={onImpactDescriptionChange}
          maxLength={180}
          placeholder="Describe what this event will do, who it helps, or what it hopes to change."
          className="!bg-[#101C45]"
        />
      </View>

      <View style={tw`rounded-2xl border border-[#17305D] bg-[#0A173F] p-4`}>
        <View style={tw`flex-row items-center justify-between gap-3`}>
          <Text style={tw`flex-1 text-xs uppercase tracking-widest text-[#7E93C7]`}>
            Suggested impact map
          </Text>
          <View
            style={tw`min-h-[30px] flex-row items-center rounded-full border border-[#1F335E] bg-[#101C45] px-3`}
          >
            {isMappingImpact ? (
              <ActivityIndicator size="small" color="#0FF1CF" />
            ) : (
              <View style={tw`h-2 w-2 rounded-full bg-[#0FF1CF]`} />
            )}
            <Text style={tw`ml-2 text-[11px] font-semibold text-[#B7FFF5]`}>
              {impactMapStatus}
            </Text>
          </View>
        </View>

        {isMappingImpact ? (
          <View
            style={tw`mt-3 rounded-2xl border border-[#0FF1CF]/20 bg-[#0FF1CF]/10 p-3`}
          >
            <View style={tw`flex-row gap-1.5`}>
              <View style={tw`h-1.5 flex-1 rounded-full bg-[#0FF1CF]`} />
              <View style={tw`h-1.5 flex-1 rounded-full bg-[#31C6F6]`} />
              <View style={tw`h-1.5 flex-1 rounded-full bg-[#F8D05C]`} />
            </View>
            <Text style={tw`mt-2 text-xs leading-5 text-[#B7FFF5]`}>
              Reading the latest story and refreshing the map.
            </Text>
          </View>
        ) : null}

        <View style={tw`mt-4`}>
          <Text style={tw`mb-2 text-xs font-semibold uppercase tracking-widest text-[#A7B8DE]`}>
            Global goals
          </Text>
          <View style={tw`flex-row flex-wrap gap-2`}>
            {suggestedSdgGoals.length ? (
              suggestedSdgGoals.map((goal) => (
                <View
                  key={goal.id}
                  style={tw`flex-row items-center rounded-full bg-[#101C45] pr-3`}
                >
                  <View
                    style={[
                      tw`h-8 w-8 items-center justify-center rounded-full`,
                      { backgroundColor: goal.color },
                    ]}
                  >
                    <SdgGoalIcon number={goal.number} color="white" size={17} />
                  </View>
                  <Text style={tw`ml-2 text-xs font-semibold text-white`}>
                    {goal.shortTitle}
                  </Text>
                </View>
              ))
            ) : (
              <EmptySuggestion label="Awaiting clearer story" />
            )}
          </View>
        </View>

        <View style={tw`mt-4`}>
          <Text style={tw`mb-2 text-xs font-semibold uppercase tracking-widest text-[#A7B8DE]`}>
            Impact path
          </Text>
          <View style={tw`flex-row flex-wrap gap-2`}>
            {suggestedMechanisms.length ? (
              suggestedMechanisms.map((mechanism) => (
                <View
                  key={mechanism.id}
                  style={tw`rounded-full bg-[#0FF1CF]/10 px-3 py-2`}
                >
                  <Text style={tw`text-xs font-semibold text-[#B7FFF5]`}>
                    {mechanism.summaryLabel}
                  </Text>
                </View>
              ))
            ) : (
              <EmptySuggestion label="Impact path pending" />
            )}
          </View>
        </View>

        <View style={tw`mt-4`}>
          <Text style={tw`mb-2 text-xs font-semibold uppercase tracking-widest text-[#A7B8DE]`}>
            Commitments
          </Text>
          <View style={tw`flex-row flex-wrap gap-2`}>
            {suggestedCommitments.length ? (
              suggestedCommitments.map((commitment) => (
                <View
                  key={commitment.id}
                  style={tw`rounded-full bg-[#F4B942]/10 px-3 py-2`}
                >
                  <Text style={tw`text-xs font-semibold text-[#FFE5A0]`}>
                    {commitment.label}
                  </Text>
                </View>
              ))
            ) : (
              <EmptySuggestion label="Commitment pending" />
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
