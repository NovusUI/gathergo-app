import { useState } from 'react';
import { View, ViewStyle } from 'react-native';
import TagButton from './buttons/TagButton';

interface EventTagsProps {
  tags?: string[]; // Optional custom tag list
  selectedTags?: string[]; // Controlled selected tags
  onChange?: (tags: string[]) => void; // Callback when selection changes
  containerStyle?: ViewStyle; // Custom styles for container
}

const defaultTags = [
  'Concerts', 'Educational', 'Fun', 'Tech',
  'Sport', 'Gaming', 'Conferences', 'Fashion',
  'Work Shop', 'Networking', 'Fund Raising'
];

export default function EventTags({
  tags = defaultTags,
  selectedTags: controlledSelectedTags,
  onChange,
  containerStyle
}: EventTagsProps) {
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const isControlled = controlledSelectedTags !== undefined;

  const currentSelected = isControlled ? controlledSelectedTags : internalSelected;

  const toggleTag = (tag: string) => {
    const updated = currentSelected.includes(tag)
      ? currentSelected.filter(item => item !== tag)
      : [...currentSelected, tag];

    if (isControlled && onChange) {
      onChange(updated);
    } else {
      setInternalSelected(updated);
    }
  };

  return (
    <View className="flex flex-wrap flex-row gap-3 p-4 bg-[#0a0a2a]" style={containerStyle}>
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
