// components/ChatSkeleton.tsx
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const SkeletonBubble = ({
  width,
  height,
  isRight = false,
  delay = 0,
}: {
  width: number;
  height: number;
  isRight?: boolean;
  delay?: number;
}) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    const startAnimation = setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1000, easing: Easing.ease }),
          withTiming(0.3, { duration: 1000, easing: Easing.ease })
        ),
        -1, // infinite repeats
        true // reverse
      );
    }, delay);

    return () => clearTimeout(startAnimation);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          height,
          width,
          backgroundColor: "#374151",
          borderRadius: 20,
          marginVertical: 6,
        },
        isRight
          ? { alignSelf: "flex-end", borderBottomRightRadius: 4 }
          : { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
        animatedStyle,
      ]}
    />
  );
};

export const ChatSkeleton = () => {
  const messages = [
    { width: 140, height: 45, isRight: false, delay: 0 },
    { width: 120, height: 40, isRight: true, delay: 200 },
    { width: 180, height: 50, isRight: false, delay: 400 },
    { width: 160, height: 45, isRight: true, delay: 600 },
    { width: 200, height: 55, isRight: false, delay: 800 },
    { width: 130, height: 42, isRight: true, delay: 1000 },
    { width: 170, height: 48, isRight: false, delay: 1200 },
    { width: 110, height: 38, isRight: true, delay: 1400 },
  ];

  return (
    <View className="flex-1 px-4 py-2">
      {messages.map((message, index) => (
        <SkeletonBubble
          key={index}
          width={message.width}
          height={message.height}
          isRight={message.isRight}
          delay={message.delay}
        />
      ))}

      {/* Typing indicator skeleton */}
      <View className="self-start flex-row items-center mt-4">
        <View className="w-8 h-8 rounded-full bg-gray-600/50 mr-2" />
        <View className="flex-row space-x-1">
          <View className="w-2 h-2 rounded-full bg-gray-600/50 animate-pulse" />
          <View className="w-2 h-2 rounded-full bg-gray-600/50 animate-pulse" />
          <View className="w-2 h-2 rounded-full bg-gray-600/50 animate-pulse" />
        </View>
      </View>
    </View>
  );
};
