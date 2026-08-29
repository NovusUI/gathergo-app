import { Ionicons } from "@expo/vector-icons";
import ExpoFire from "@/components/feed/ExpoFire";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

interface FlameFeedButtonProps {
  unreadCount: number;
  onPress: () => void;
  disabled?: boolean;
  showCarpoolSignal?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const SIGNAL_CYCLE_MS = 5200;

export default function FlameFeedButton({
  unreadCount,
  onPress,
  disabled = false,
  showCarpoolSignal = false,
}: FlameFeedButtonProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const signalProgress = useRef(new Animated.Value(0)).current;
  const previousUnreadRef = useRef(unreadCount);

  const intensity = useMemo(
    () => Math.min((Math.max(unreadCount, 0) / 30) * 100, 100),
    [unreadCount]
  );
  const fireOpacity = signalProgress.interpolate({
    inputRange: [0, 0.36, 0.48, 0.88, 1],
    outputRange: [1, 1, 0, 0, 1],
  });
  const fireScale = signalProgress.interpolate({
    inputRange: [0, 0.36, 0.48, 0.88, 1],
    outputRange: [1, 1, 0.96, 0.96, 1],
  });
  const carpoolOpacity = signalProgress.interpolate({
    inputRange: [0, 0.36, 0.48, 0.88, 1],
    outputRange: [0, 0, 1, 1, 0],
  });
  const carpoolScale = signalProgress.interpolate({
    inputRange: [0, 0.36, 0.48, 0.88, 1],
    outputRange: [0.96, 0.96, 1, 1, 0.96],
  });
  const signalRingScale = signalProgress.interpolate({
    inputRange: [0, 0.48, 0.66, 0.84, 1],
    outputRange: [0.9, 0.9, 1.16, 1.04, 0.9],
  });
  const signalRingOpacity = signalProgress.interpolate({
    inputRange: [0, 0.48, 0.66, 0.84, 1],
    outputRange: [0, 0.32, 0.1, 0.24, 0],
  });

  useEffect(() => {
    if (!showCarpoolSignal) {
      signalProgress.stopAnimation();
      signalProgress.setValue(0);
      return;
    }

    signalProgress.stopAnimation();
    signalProgress.setValue(0);
    const loop = Animated.loop(
      Animated.timing(signalProgress, {
        toValue: 1,
        duration: SIGNAL_CYCLE_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    loop.start();
    return () => {
      loop.stop();
      signalProgress.stopAnimation();
    };
  }, [showCarpoolSignal, signalProgress]);

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
      accessibilityRole="button"
      accessibilityLabel={
        showCarpoolSignal
          ? "Open live feed and carpool options"
          : "Open live feed"
      }
      style={[
        tw`relative items-center justify-center rounded-full bg-[#041130]/85 p-2`,
        { transform: [{ scale: pulse }] },
      ]}
    >
      {unreadCount > 0 && (
        <View
          style={tw`absolute inset-0 rounded-full bg-[#FF7A1A]/10`}
        />
      )}
      <View style={tw`h-[52px] w-[52px] items-center justify-center`}>
        <Animated.View
          pointerEvents="none"
          style={[
            tw`absolute inset-0 items-center justify-center`,
            {
              opacity: fireOpacity,
              transform: [{ scale: fireScale }],
            },
          ]}
        >
          <ExpoFire intensity={intensity} />
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[
            tw`absolute inset-0 items-center justify-center`,
            {
              opacity: carpoolOpacity,
              transform: [{ scale: carpoolScale }],
            },
          ]}
        >
          <View style={tw`h-[52px] w-[52px] items-center justify-center`}>
            <Animated.View
              style={[
                tw`absolute h-11 w-11 rounded-full border border-[#0FF1CF]`,
                {
                  opacity: signalRingOpacity,
                  transform: [{ scale: signalRingScale }],
                },
              ]}
            />
            <View
              style={tw`h-11 w-11 items-center justify-center rounded-full bg-[#0FF1CF]/20 border border-[#0FF1CF]/40`}
            >
              <Ionicons name="car-sport-outline" size={26} color="#0FF1CF" />
            </View>
            <View style={tw`absolute bottom-1 flex-row gap-1`}>
              <View style={tw`h-1.5 w-1.5 rounded-full bg-[#0FF1CF]`} />
              <View style={tw`h-1.5 w-1.5 rounded-full bg-[#31C6F6]`} />
              <View style={tw`h-1.5 w-1.5 rounded-full bg-[#F8D05C]`} />
            </View>
          </View>
        </Animated.View>
      </View>

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
