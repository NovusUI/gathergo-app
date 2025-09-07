import { Text, TouchableOpacity } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";


interface TagButtonProps {
  tag: string;
  isSelected: boolean;
  onPress: () => void;
}

const TagButton = ({ tag, isSelected, onPress }: TagButtonProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(1.1, { damping: 3, stiffness: 200 }, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={handlePress}
        className={`px-4 py-2 rounded-xl ${
          isSelected ? 'bg-teal-400' : 'bg-[#1b1b3a]'
        }`}
      >
        <Text className="text-white">{tag}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default TagButton
