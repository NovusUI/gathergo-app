import { DEFAULT_EVENT_TAGS } from "@/constants/impact";
import { useState } from "react";
import { View, ViewStyle } from "react-native";
import tw from "twrnc";
import TagButton from "./buttons/TagButton";

interface EventTagsProps {
  tags?: string[];
  selectedTags?: string[];
  onChange?: (tags: string[]) => void;
  containerStyle?: ViewStyle;
}

export default function EventTags({
  tags = DEFAULT_EVENT_TAGS,
  selectedTags: controlledSelectedTags,
  onChange,
  containerStyle,
}: EventTagsProps) {
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const isControlled = controlledSelectedTags !== undefined;

  const currentSelected = isControlled
    ? controlledSelectedTags
    : internalSelected;

  const toggleTag = (tag: string) => {
    const updated = currentSelected.includes(tag)
      ? currentSelected.filter((item) => item !== tag)
      : [...currentSelected, tag];

    if (isControlled && onChange) {
      onChange(updated);
    } else {
      setInternalSelected(updated);
    }
  };

  return (
    <View
      style={[
        tw`flex flex-row flex-wrap gap-3 p-4 bg-[#0a0a2a]`,
        containerStyle,
      ]}
    >
      {tags.map((tag) => (
        <TagButton
          key={tag}
          tag={tag}
          isSelected={currentSelected.includes(tag)}
          onPress={() => toggleTag(tag)}
        />
      ))}
    </View>
  );
}
