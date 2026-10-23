import { MascotMoment } from "@/components/gogo/mascot/MascotMoment";
import type { EventRegistrationType } from "@/constants/impact";
import { useImpactSuggestions } from "@/components/gogo/tasks/impactSuggestions/useImpactSuggestions";
import type { ImpactSuggestionPayload } from "@/components/gogo/tasks/impactSuggestions/types";
import type {
  ImpactSuggestionData,
  SuggestedImpactCommitment,
} from "@/types/impact";
import { useDebounce } from "@/utils/useDebounce";
import { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw, { style } from "twrnc";
import TextArea from "@/components/inputs/CustomTextArea";

interface ImpactSelectorProps {
  section?: "story" | "map";
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
  if (items.length === 0) return null;
  return (
    <View style={tw`gap-3`}>
      <View style={tw`flex-row items-center justify-between gap-3`}>
        <Text style={tw`text-sm font-semibold text-[#DDE6FF]`}>{title}</Text>
        <Text
          accessibilityLabel={`${selected.length} of ${limit} selected`}
          style={tw`text-xs text-[#8FA5E2]`}
        >
          {selected.length}/{limit}
        </Text>
      </View>
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
                "min-h-[44px] max-w-full justify-center rounded-xl border px-4 py-3",
                checked
                  ? "border-[#0FF1CF] bg-[#0FF1CF]"
                  : "border-[#1F335E] bg-[#101C45]",
                disabled && "opacity-40",
              )}
            >
              <Text
                style={style(
                  "text-sm font-medium",
                  checked ? "text-[#01082E]" : "text-white",
                )}
              >
                {checked ? "✓ " : ""}
                {label(item)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
  section,
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
  const { data, isFetching, isPending, isError, refetch } =
    useImpactSuggestions(debouncedPayload, {
      enabled: section !== "story" && hasStory && isDraftCurrent,
    });
  const suggestions =
    hasStory && isDraftCurrent && !isError ? data?.data : undefined;

  const isThinking = hasStory && (isPending || isFetching || !isDraftCurrent);
  const hasIdeas =
    suggestions &&
    suggestions.sdgGoals.length +
      suggestions.impactPaths.length +
      suggestions.commitments.length >
      0;
  const message = !hasStory
    ? "Start with a short impact story."
    : isThinking
      ? "Finding ideas for your story…"
      : isError
        ? "I couldn’t load ideas. Try again?"
        : hasIdeas
          ? "Tap the ideas that fit."
          : "No matching ideas yet. You can skip this.";

  return (
    <View style={tw`gap-4`}>
      {section !== "map" && (
        <TextArea
          value={impactDescription}
          onChange={onImpactDescriptionChange}
          maxLength={180}
          placeholder="What could this event contribute?"
          className="!bg-[#101C45]"
        />
      )}
      {section !== "story" && (
        <View style={tw`gap-5`}>
          <View
            accessibilityLiveRegion="polite"
            accessibilityState={{ busy: isThinking }}
          >
            <MascotMoment
              compact
              layout="plain"
              typing={false}
              title="Gogo"
              variant={
                isThinking ? "pending" : isError && hasStory ? "error" : "idle"
              }
              message={message}
            />
            {hasStory && isDraftCurrent && isError && !isThinking && (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  void refetch();
                }}
                style={tw`min-h-[44px] justify-center self-start px-3`}
              >
                <Text style={tw`text-sm font-semibold text-[#0FF1CF]`}>
                  Try again
                </Text>
              </TouchableOpacity>
            )}
          </View>
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
      )}
    </View>
  );
}
