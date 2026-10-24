import {
  GOGO_PALETTE,
  GOGO_POSES,
  type GatherGoMascotVariant,
} from "@/components/gogo/mascot/constants";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import {
  CheckCircle2,
  Clock3,
  Heart,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react-native";
import { type ComponentType, type ReactNode, useEffect } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import tw from "twrnc";
import { GogoArtwork } from "@/components/gogo/mascot/GogoArtwork";

type MascotIcon = ComponentType<{ size?: number; color?: string }>;
export type GatherGoMascotPalette = Partial<{
  accent: string;
  badgeBg: string;
  glow: string;
  iconColor: string;
}>;

type MascotVariantConfig = Required<GatherGoMascotPalette> & {
  icon: MascotIcon;
};
const VARIANT_CONFIG: Record<GatherGoMascotVariant, MascotVariantConfig> = {
  idle: {
    accent: GOGO_PALETTE.body,
    glow: "rgba(30, 235, 200, 0.18)",
    icon: Sparkles,
    iconColor: GOGO_PALETTE.face,
    badgeBg: GOGO_PALETTE.yellow,
  },
  donation: {
    accent: GOGO_PALETTE.coral,
    glow: "rgba(255, 92, 122, 0.18)",
    icon: Heart,
    iconColor: "#FFFFFF",
    badgeBg: GOGO_PALETTE.coral,
  },
  success: {
    accent: GOGO_PALETTE.body,
    glow: "rgba(30, 235, 200, 0.18)",
    icon: CheckCircle2,
    iconColor: GOGO_PALETTE.face,
    badgeBg: GOGO_PALETTE.body,
  },
  pending: {
    accent: GOGO_PALETTE.yellow,
    glow: "rgba(255, 216, 77, 0.16)",
    icon: Clock3,
    iconColor: GOGO_PALETTE.face,
    badgeBg: GOGO_PALETTE.yellow,
  },
  verified: {
    accent: GOGO_PALETTE.body,
    glow: "rgba(30, 235, 200, 0.18)",
    icon: ShieldCheck,
    iconColor: GOGO_PALETTE.face,
    badgeBg: GOGO_PALETTE.body,
  },
  empty: {
    accent: GOGO_PALETTE.body,
    glow: "rgba(30, 235, 200, 0.14)",
    icon: Sparkles,
    iconColor: GOGO_PALETTE.face,
    badgeBg: GOGO_PALETTE.yellow,
  },
  error: {
    accent: GOGO_PALETTE.coral,
    glow: "rgba(255, 92, 122, 0.16)",
    icon: XCircle,
    iconColor: "#FFFFFF",
    badgeBg: GOGO_PALETTE.coral,
  },
};

type GatherGoMascotProps = {
  variant?: GatherGoMascotVariant;
  size?: number;
  animated?: boolean;
  badgeContent?: ReactNode;
  palette?: GatherGoMascotPalette;
  showBadge?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function GatherGoMascot({
  variant = "idle",
  size = 88,
  animated = true,
  badgeContent,
  palette,
  showBadge = true,
  style,
}: GatherGoMascotProps) {
  const reducedMotion = useReducedMotionPreference();
  const motionEnabled = animated && !reducedMotion;
  const reveal = useSharedValue(motionEnabled ? 0 : 1);
  const pulse = useSharedValue(0);
  const config = { ...VARIANT_CONFIG[variant], ...palette };
  const Icon = config.icon;
  const badge = badgeContent ?? (
    <Icon size={size * 0.17} color={config.iconColor} />
  );

  useEffect(() => {
    cancelAnimation(reveal);
    cancelAnimation(pulse);
    reveal.value = motionEnabled ? 0 : 1;
    pulse.value = 0;
    if (!motionEnabled) return;
    reveal.value = withSpring(1, {
      damping: 14,
      stiffness: 140,
      reduceMotion: ReduceMotion.Never,
    });
    pulse.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
      undefined,
      ReduceMotion.Never,
    );
    return () => {
      cancelAnimation(reveal);
      cancelAnimation(pulse);
    };
  }, [motionEnabled, pulse, reveal, variant]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: motionEnabled ? reveal.value : 1,
    transform: [
      { translateY: motionEnabled ? (1 - reveal.value) * 6 : 0 },
      { scale: motionEnabled ? 0.92 + reveal.value * 0.08 : 1 },
    ],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: motionEnabled ? 0.65 + pulse.value * 0.2 : 0.75,
    transform: [{ scale: motionEnabled ? 0.94 + pulse.value * 0.06 : 1 }],
  }));

  return (
    <View
      style={[
        tw`items-center justify-center`,
        { width: size, height: size },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          tw`absolute rounded-full`,
          {
            width: size * 0.8,
            height: size * 0.8,
            backgroundColor: config.glow,
          },
          glowStyle,
        ]}
      />
      <Animated.View style={entranceStyle}>
        <GogoArtwork
          pose={GOGO_POSES[variant]}
          size={size}
          animated={motionEnabled}
        />
      </Animated.View>
      {showBadge && badge ? (
        <View
          style={[
            tw`absolute items-center justify-center rounded-full border-2 border-[#01082E]`,
            {
              right: 0,
              bottom: 0,
              width: size * 0.28,
              height: size * 0.28,
              backgroundColor: config.badgeBg,
            },
          ]}
        >
          {badge}
        </View>
      ) : null}
    </View>
  );
}
