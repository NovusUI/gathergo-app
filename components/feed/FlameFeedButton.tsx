import ExpoFire from "@/components/feed/ExpoFire";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

interface FlameFeedButtonProps {
  unreadCount: number;
  onPress: () => void;
  disabled?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function FlameFeedButton({
  unreadCount,
  onPress,
  disabled = false,
}: FlameFeedButtonProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const previousUnreadRef = useRef(unreadCount);

  const intensity = useMemo(
    () => Math.min((Math.max(unreadCount, 0) / 30) * 100, 100),
    [unreadCount]
  );

  useEffect(() => {
    const prevUnread = previousUnreadRef.current;
    previousUnreadRef.current = unreadCount;

    if (unreadCount <= 0) return;

    pulse.setValue(1);
    Animated.sequence([
      Animated.timing(pulse, {
        toValue: 1.18,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(pulse, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    if (unreadCount > prevUnread) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
  }, [pulse, unreadCount]);

  return (
    <AnimatedTouchable
      onPress={onPress}
      disabled={disabled}
      style={[
        tw`relative items-center justify-center`,
        { transform: [{ scale: pulse }] },
      ]}
    >
      <ExpoFire intensity={intensity} />

      {unreadCount > 0 && (
        <View
          style={tw`absolute -top-2 -right-2 bg-red-500 rounded-full min-w-[20px] h-5 px-1 items-center justify-center`}
        >
          <Text style={tw`text-white text-xs font-bold`}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </AnimatedTouchable>
  );
}
