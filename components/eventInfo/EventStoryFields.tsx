import TagButton from "@/components/buttons/TagButton";
import Input from "@/components/inputs/CustomInput1";
import TextArea from "@/components/inputs/CustomTextArea";
import FormLabel from "@/components/labels/FormLabel";
import { VOLUNTEER_IMPACT_STORY_REQUIRED } from "@/utils/volunteer";
import { showGlobalWarning } from "@/utils/globalErrorHandler";
import { EVENT_INTEREST_GROUPS } from "@/constants/eventInterests";
import type { EventCreationSection } from "@/components/gogo/tasks/eventCreation/types";
import type { EventFormData } from "@/schemas/event";
import { useState } from "react";
import { Controller, useWatch, type UseFormReturn } from "react-hook-form";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import ImpactSelector from "@/components/gogo/tasks/impactSuggestions/ImpactSelector";

type EventStoryFieldsProps = Pick<
  UseFormReturn<EventFormData>,
  "control" | "setValue"
> & {
  section?: Extract<
    EventCreationSection,
    "Story" | "Impact story" | "Impact map" | "Interests"
  >;
};

export default function EventStoryFields({
  control,
  setValue,
  section,
}: EventStoryFieldsProps) {
  const [impactExpanded, setImpactExpanded] = useState(false);
  const [interestsExpanded, setInterestsExpanded] = useState(
    section === "Interests",
  );
  const [
    registrationType,
    title,
    description,
    tags,
    impactDescription,
    sdgGoals,
    impactPaths,
    commitments,
    volunteerRoles,
  ] = useWatch({
    control,
    name: [
      "registrationType",
      "eventName",
      "description",
      "tags",
      "impactDescription",
      "impactSdgGoals",
      "impactPaths",
      "impactCommitments",
      "volunteerRoles",
    ],
  });
  const selectedMap = {
    sdgGoals: sdgGoals ?? [],
    impactPaths: impactPaths ?? [],
    commitments: commitments ?? [],
  };
  const hasImpact =
    Boolean(impactDescription) ||
    selectedMap.sdgGoals.length +
      selectedMap.impactPaths.length +
      selectedMap.commitments.length >
      0;

  const requiresImpactStory =
    registrationType === "volunteer" || volunteerRoles.length > 0;

  const removeImpact = () => {
    if (requiresImpactStory) {
      showGlobalWarning(VOLUNTEER_IMPACT_STORY_REQUIRED);
      return;
    }
    setValue("impactTitle", "");
    setValue("impactDescription", "");
    setValue("impactPercentage", undefined);
    setValue("impactSdgGoals", []);
    setValue("impactPaths", []);
    setValue("impactCommitments", []);
    setValue("impactMapSource", undefined);
    setValue("impactMapGeneratedAt", undefined);
    setImpactExpanded(false);
  };

  return (
    <View style={tw`mt-4 gap-5`}>
      {section === "Story" && (
        <Controller
          name="eventName"
          control={control}
          render={({ field, fieldState }) => (
            <View style={tw`gap-2`}>
              <FormLabel text="event name" />
              <Input
                value={field.value}
                onChangeText={field.onChange}
                placeholder="Event name"
                maxLength={100}
              />
              {fieldState.error && (
                <Text style={tw`text-sm text-red-400`}>
                  {fieldState.error.message}
                </Text>
              )}
            </View>
          )}
        />
      )}
      {(!section || section === "Story") && (
        <View style={tw`gap-2`}>
          <FormLabel text="about this event" />
          <Controller
            name="description"
            control={control}
            render={({ field, fieldState }) => (
              <TextArea
                value={field.value}
                onChange={field.onChange}
                placeholder="What’s happening?"
                error={fieldState.error?.message}
                className="!bg-[#101C45]"
              />
            )}
          />
        </View>
      )}

      {(!section || section === "Interests") && (
        <View style={tw`gap-3`}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ expanded: interestsExpanded }}
            onPress={() => setInterestsExpanded((value) => !value)}
            style={tw`rounded-2xl bg-[#101C45] p-4`}
          >
            <Text style={tw`text-white font-semibold`}>Event interests</Text>
            <Text style={tw`mt-1 text-sm text-[#8FA5E2]`}>
              {tags.length
                ? `${tags.length} selected`
                : "Choose interests · Optional"}
            </Text>
          </TouchableOpacity>
          {interestsExpanded && (
            <View style={tw`gap-4`}>
              {EVENT_INTEREST_GROUPS.map((group) => (
                <View key={group.label} style={tw`gap-2`}>
                  <Text style={tw`text-sm text-[#A8BAE4]`}>{group.label}</Text>
                  <View style={tw`flex-row flex-wrap gap-2`}>
                    {group.items.map((tag) => (
                      <TagButton
                        key={tag}
                        tag={tag}
                        isSelected={tags.includes(tag)}
                        onPress={() =>
                          setValue(
                            "tags",
                            tags.includes(tag)
                              ? tags.filter((item) => item !== tag)
                              : [...tags, tag],
                          )
                        }
                      />
                    ))}
                  </View>
                </View>
              ))}
              {tags
                .filter(
                  (tag) =>
                    !EVENT_INTEREST_GROUPS.some((group) =>
                      group.items.includes(tag),
                    ),
                )
                .map((tag) => (
                  <TagButton
                    key={tag}
                    tag={tag}
                    isSelected
                    onPress={() =>
                      setValue(
                        "tags",
                        tags.filter((item) => item !== tag),
                      )
                    }
                  />
                ))}
            </View>
          )}
        </View>
      )}

      {(!section || section === "Impact story" || section === "Impact map") &&
        (impactExpanded ||
        hasImpact ||
        requiresImpactStory ||
        Boolean(section) ? (
          <View style={tw`gap-4 py-2`}>
            {section !== "Impact map" && (
              <View style={tw`flex-row items-center justify-between gap-3`}>
                <Text style={tw`flex-1 text-white font-semibold`}>
                  {requiresImpactStory
                    ? "Impact story · Required"
                    : "Impact story · Optional"}
                </Text>
                {!requiresImpactStory && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={removeImpact}
                  >
                    <Text style={tw`text-sm text-[#FF8A8A]`}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            <Controller
              name="impactDescription"
              control={control}
              render={({ field, fieldState }) => (
                <View>
                  <ImpactSelector
                    section={
                      section === "Impact story"
                        ? "story"
                        : section === "Impact map"
                          ? "map"
                          : undefined
                    }
                    registrationType={registrationType}
                    eventTitle={title}
                    eventDescription={description}
                    impactDescription={field.value}
                    onImpactDescriptionChange={field.onChange}
                    selectedMap={selectedMap}
                    onImpactMapChange={(map) => {
                      setValue("impactSdgGoals", map.sdgGoals);
                      setValue("impactPaths", map.impactPaths);
                      setValue("impactCommitments", map.commitments);
                    }}
                  />
                  {fieldState.error && (
                    <Text style={tw`mt-1 text-sm text-red-400`}>
                      {fieldState.error.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>
        ) : (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setImpactExpanded(true)}
            style={tw`rounded-2xl border border-[#17305D] p-4`}
          >
            <Text style={tw`text-[#0FF1CF] font-semibold`}>
              Add an impact story (optional)
            </Text>
          </TouchableOpacity>
        ))}
    </View>
  );
}
