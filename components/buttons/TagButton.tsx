import { useAppTheme } from "@/hooks/useAppTheme";
import { Text, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface TagButtonProps {
  tag: string;
  isSelected: boolean;
  onPress: () => void;
}

const TagButton = ({ tag, isSelected, onPress }: TagButtonProps) => {
  const { tw } = useAppTheme();
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
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        onPress={handlePress}
        style={tw`px-4 py-2 rounded-xl ${
          isSelected ? "bg-teal-400" : "bg-surface dark:bg-[#1b1b3a]"
        }`}
      >
        <Text style={tw`text-foreground dark:text-white`}>{tag}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default TagButton;
