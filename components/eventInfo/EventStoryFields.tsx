import TagButton from "@/components/buttons/TagButton";
import Input from "@/components/inputs/CustomInput1";
import TextArea from "@/components/inputs/CustomTextArea";
import FormLabel from "@/components/labels/FormLabel";
import { EVENT_INTEREST_GROUPS } from "@/constants/eventInterests";
import type { EventFormData } from "@/schemas/event";
import { useState } from "react";
import { Controller, useWatch, type UseFormReturn } from "react-hook-form";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import ImpactSelector from "./ImpactSelector";

type EventStoryFieldsProps = Pick<
  UseFormReturn<EventFormData>,
  "control" | "setValue"
>;

export default function EventStoryFields({
  control,
  setValue,
}: EventStoryFieldsProps) {
  const [impactExpanded, setImpactExpanded] = useState(false);
  const [interestsExpanded, setInterestsExpanded] = useState(false);
  const [
    registrationType,
    title,
    description,
    tags,
    impactTitle,
    impactDescription,
    sdgGoals,
    impactPaths,
    commitments,
  ] = useWatch({
    control,
    name: [
      "registrationType",
      "eventName",
      "description",
      "tags",
      "impactTitle",
      "impactDescription",
      "impactSdgGoals",
      "impactPaths",
      "impactCommitments",
    ],
  });
  const selectedMap = {
    sdgGoals: sdgGoals ?? [],
    impactPaths: impactPaths ?? [],
    commitments: commitments ?? [],
  };
  const hasImpact =
    Boolean(impactTitle || impactDescription) ||
    selectedMap.sdgGoals.length +
      selectedMap.impactPaths.length +
      selectedMap.commitments.length >
      0;

  const removeImpact = () => {
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
      <View style={tw`gap-2`}>
        <FormLabel text="about this event" />
        <Controller
          name="description"
          control={control}
          render={({ field, fieldState }) => (
            <TextArea
              value={field.value}
              onChange={field.onChange}
              placeholder="What can people expect? Share the experience, activities, and who it is for."
              error={fieldState.error?.message}
              className="!bg-[#101C45]"
            />
          )}
        />
      </View>

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
              ? tags.join(", ")
              : "Choose interests to help people find your event (optional)"}
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

      {impactExpanded || hasImpact ? (
        <View style={tw`gap-3 rounded-2xl border border-[#17305D] p-4`}>
          <View style={tw`flex-row items-center justify-between gap-3`}>
            <Text style={tw`flex-1 text-white font-semibold`}>
              Impact story (optional)
            </Text>
            <TouchableOpacity accessibilityRole="button" onPress={removeImpact}>
              <Text style={tw`text-sm text-[#FF8A8A]`}>Remove</Text>
            </TouchableOpacity>
          </View>
          <Text style={tw`text-sm leading-5 text-[#8FA5E2]`}>
            Share what this gathering means to you or your community. You decide
            what impact looks like.
          </Text>
          <Controller
            name="impactTitle"
            control={control}
            render={({ field, fieldState }) => (
              <View>
                <Input
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Impact focus (optional)"
                  maxLength={80}
                />
                {fieldState.error && (
                  <Text style={tw`mt-1 text-sm text-red-400`}>
                    {fieldState.error.message}
                  </Text>
                )}
              </View>
            )}
          />
          <Controller
            name="impactDescription"
            control={control}
            render={({ field, fieldState }) => (
              <View>
                <ImpactSelector
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
          <Text style={tw`mt-1 text-sm leading-5 text-[#8FA5E2]`}>
            Give a spotlight to what your event contributes.
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
