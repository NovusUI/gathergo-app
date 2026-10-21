import ActivityIndicator from "@/components/ui/AppLoader";
import type { EventRegistrationType } from "@/constants/impact";
import { useImpactSuggestions } from "@/services/queries";
import type {
  ImpactSuggestionData,
  ImpactSuggestionPayload,
  SuggestedImpactCommitment,
} from "@/types/impact";
import { useDebounce } from "@/utils/useDebounce";
import { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw, { style } from "twrnc";
import TextArea from "../inputs/CustomTextArea";

interface ImpactSelectorProps {
  eventTitle: string;
  eventDescription: string;
  impactDescription: string;
  registrationType?: EventRegistrationType;
  onImpactDescriptionChange: (value: string) => void;
  selectedMap: ImpactSuggestionData;
  onImpactMapChange: (value: ImpactSuggestionData) => void;
}

function SuggestionGroup<T>({
  title,
  suggestions,
  selected,
  itemKey,
  label,
  limit,
  onChange,
}: {
  title: string;
  suggestions: T[];
  selected: T[];
  itemKey: (item: T) => string;
  label: (item: T) => string;
  limit: number;
  onChange: (items: T[]) => void;
}) {
  const items = Array.from(
    new Map(
      [...selected, ...suggestions].map((item) => [itemKey(item), item]),
    ).values(),
  );
  return (
    <View style={tw`mt-4 gap-2`}>
      <Text
        style={tw`text-xs font-semibold uppercase tracking-widest text-[#A7B8DE]`}
      >
        {title} (up to {limit})
      </Text>
      <View style={tw`flex-row flex-wrap gap-2`}>
        {items.map((item) => {
          const key = itemKey(item);
          const checked = selected.some((value) => itemKey(value) === key);
          const disabled = !checked && selected.length >= limit;
          return (
            <TouchableOpacity
              key={key}
              accessibilityRole="checkbox"
              accessibilityState={{ checked, disabled }}
              disabled={disabled}
              onPress={() =>
                onChange(
                  checked
                    ? selected.filter((value) => itemKey(value) !== key)
                    : [...selected, item],
                )
              }
              style={style(
                "rounded-full border px-3 py-2",
                checked
                  ? "border-[#0FF1CF] bg-[#0FF1CF]/10"
                  : "border-[#1F335E] bg-[#101C45]",
                disabled && "opacity-40",
              )}
            >
              <Text style={tw`text-xs font-semibold text-white`}>
                {checked ? "✓ " : "+ "}
                {label(item)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {items.length === 0 && (
        <Text style={tw`text-xs text-[#8EA0CA]`}>
          No suggestions yet. A map is optional.
        </Text>
      )}
    </View>
  );
}

const commitmentKey = (item: SuggestedImpactCommitment) =>
  `${item.type}:${item.value}:${item.unit}`;

export default function ImpactSelector({
  eventTitle,
  eventDescription,
  impactDescription,
  registrationType,
  onImpactDescriptionChange,
  selectedMap,
  onImpactMapChange,
}: ImpactSelectorProps) {
  const suggestionPayload = useMemo<ImpactSuggestionPayload>(
    () => ({
      title: eventTitle.trim(),
      description: eventDescription.trim(),
      impactDescription: impactDescription.trim(),
      registrationType,
    }),
    [eventTitle, eventDescription, impactDescription, registrationType],
  );
  const debouncedPayload = useDebounce(suggestionPayload, 1000);
  const hasStory = impactDescription.trim().length >= 3;
  const isDraftCurrent = suggestionPayload === debouncedPayload;
  const { data, isFetching, isError, refetch } = useImpactSuggestions(
    debouncedPayload,
    {
      enabled: hasStory && isDraftCurrent,
    },
  );
  const suggestions =
    hasStory && isDraftCurrent && !isError ? data?.data : undefined;

  return (
    <View style={tw`gap-4`}>
      <TextArea
        value={impactDescription}
        onChange={onImpactDescriptionChange}
        maxLength={180}
        placeholder="What does this event contribute to people, culture, or your community?"
        className="!bg-[#101C45]"
      />
      <View style={tw`rounded-2xl border border-[#17305D] bg-[#0A173F] p-4`}>
        <View style={tw`flex-row items-center justify-between gap-3`}>
          <Text
            style={tw`flex-1 text-xs uppercase tracking-widest text-[#7E93C7]`}
          >
            AI suggested impact map
          </Text>
          {hasStory && (isFetching || !isDraftCurrent) && (
            <ActivityIndicator size="small" color="#0FF1CF" />
          )}
        </View>
        <Text style={tw`mt-2 text-xs leading-5 text-[#8FA5E2]`}>
          Choose the suggestions that reflect your intention, or leave the map
          empty. Only your selections will appear on the event.
        </Text>
        {hasStory && isDraftCurrent && isError && (
          <View style={tw`mt-2 gap-2`}>
            <Text style={tw`text-xs leading-5 text-[#8FA5E2]`}>
              AI suggestions are unavailable right now. You can try again or
              continue without a map. Your selections are kept.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              disabled={isFetching}
              onPress={() => {
                void refetch();
              }}
            >
              <Text style={tw`text-xs font-semibold text-[#0FF1CF]`}>
                Try again
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <SuggestionGroup
          title="Global goals"
          suggestions={suggestions ? suggestions.sdgGoals : []}
          selected={selectedMap.sdgGoals}
          itemKey={(item) => item.id}
          label={(item) => item.shortTitle}
          limit={3}
          onChange={(sdgGoals) =>
            onImpactMapChange({ ...selectedMap, sdgGoals })
          }
        />
        <SuggestionGroup
          title="Impact paths"
          suggestions={suggestions ? suggestions.impactPaths : []}
          selected={selectedMap.impactPaths}
          itemKey={(item) => item.id}
          label={(item) => item.summaryLabel}
          limit={3}
          onChange={(impactPaths) =>
            onImpactMapChange({ ...selectedMap, impactPaths })
          }
        />
        <SuggestionGroup
          title="Commitments"
          suggestions={suggestions ? suggestions.commitments : []}
          selected={selectedMap.commitments}
          itemKey={commitmentKey}
          label={(item) => item.label}
          limit={5}
          onChange={(commitments) =>
            onImpactMapChange({ ...selectedMap, commitments })
          }
        />
      </View>
    </View>
  );
}
