import { useAppTheme } from "@/hooks/useAppTheme";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import type { GatherGoMascotVariant } from "@/components/gogo/mascot/constants";
import { useEffect, useRef } from "react";
import { Animated, StyleProp, Text, View, ViewStyle } from "react-native";

import { GogoComingSoonArtwork } from "@/components/gogo/mascot/GogoComingSoonArtwork";
import { GatherGoMascot } from "@/components/gogo/mascot/GatherGoMascot";
import { MascotMessage } from "@/components/gogo/mascot/MascotMessage";

type MascotMomentProps = {
  variant?: GatherGoMascotVariant;
  artwork?: "comingSoon";
  title: string;
  message: string;
  typing?: boolean;
  compact?: boolean;
  layout?: "inline" | "stacked" | "plain";
  style?: StyleProp<ViewStyle>;
};

const MOMENT_TONES: Record<
  GatherGoMascotVariant,
  { border: string; background: string }
> = {
  idle: {
    border: "#24345A",
    background: "#07143B",
  },
  donation: {
    border: "#3C315F",
    background: "#11183D",
  },
  success: {
    border: "#1C5C61",
    background: "#071B3C",
  },
  pending: {
    border: "#5A4718",
    background: "#171839",
  },
  verified: {
    border: "#1C5C61",
    background: "#071B3C",
  },
  empty: {
    border: "#1E4770",
    background: "#07143B",
  },
  error: {
    border: "#5A2435",
    background: "#1B1236",
  },
};

const AnimatedView = Animated.createAnimatedComponent(View);

export function MascotMoment({
  variant = "idle",
  artwork,
  title,
  message,
  typing = true,
  compact = false,
  layout = "inline",
  style,
}: MascotMomentProps) {
  const { tw, color } = useAppTheme();
  const reducedMotion = useReducedMotionPreference();
  const tone = MOMENT_TONES[variant];
  const stacked = layout === "stacked";
  const plain = layout === "plain";
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    reveal.setValue(reducedMotion ? 1 : 0);
    if (reducedMotion) return;

    const animation = Animated.spring(reveal, {
      toValue: 1,
      friction: 7,
      tension: 55,
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [message, reducedMotion, reveal, variant]);

  const translateY = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  return (
    <AnimatedView
      style={[
        plain
          ? tw`flex-row items-center gap-3 py-1`
          : stacked
            ? tw`w-full max-w-[360px] self-center items-center gap-5 py-6`
            : [
                tw`flex-row items-center gap-3 rounded-2xl border p-3`,
                { backgroundColor: color(tone.background, variant === "error" ? "dangerSoft" : "surface"), borderColor: color(tone.border, "border") },
              ],
        style,
        {
          opacity: reveal,
          transform: [{ translateY }],
        },
      ]}
    >
      {artwork === "comingSoon" ? (
        <GogoComingSoonArtwork
          width={stacked ? (compact ? 160 : 220) : compact ? 58 : 76}
          animated={!reducedMotion}
        />
      ) : (
        <GatherGoMascot
          variant={variant}
          size={stacked ? (compact ? 112 : 160) : compact ? 58 : 76}
          showBadge={!stacked && !plain}
          style={tw`shrink-0`}
        />
      )}
      <View style={stacked ? tw`w-full items-center gap-2` : tw`flex-1`}>
        <Text
          accessibilityRole="header"
          style={
            plain
              ? tw`text-sm font-semibold text-foreground dark:text-white`
              : stacked
                ? tw`text-center text-2xl font-bold text-foreground dark:text-white`
                : tw`text-xs font-semibold uppercase tracking-wider text-muted dark:text-[#8FA1CB]`
          }
        >
          {title}
        </Text>
        <View
          style={
            stacked
              ? tw`w-full`
              : plain
                ? tw`mt-1`
                : tw`mt-2 rounded-2xl bg-surface dark:bg-[#0A173F] px-3 py-2`
          }
        >
          <MascotMessage
            message={message}
            animate={typing && !reducedMotion}
            style={
              stacked
                ? tw`text-center text-base leading-6 text-secondary dark:text-[#AFC0F4]`
                : plain
                  ? tw`text-sm leading-5 text-secondary dark:text-[#AFC0F4]`
                  : undefined
            }
          />
        </View>
      </View>
    </AnimatedView>
  );
}
