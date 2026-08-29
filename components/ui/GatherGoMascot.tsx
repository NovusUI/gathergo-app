import type { GatherGoMascotVariant } from "@/constants/mascot";
import {
  CheckCircle2,
  Clock3,
  Heart,
  ShieldCheck,
  Sparkles,
  XCircle
} from "lucide-react-native";
import { type ComponentType, useEffect, useRef } from "react";
import { Animated, Easing, StyleProp, View, ViewStyle } from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import tw from "twrnc";

type MascotIcon = ComponentType<{
  size?: number;
  color?: string;
}>;

type MascotVariantConfig = {
  body: string;
  face: string;
  accent: string;
  glow: string;
  icon?: MascotIcon;
  iconColor: string;
  badgeBg: string;
};

type SparklePoint = {
  key: string;
  top: number;
  left?: number;
  right?: number;
  size: number;
  lift: number;
};

const VARIANT_CONFIG: Record<GatherGoMascotVariant, MascotVariantConfig> = {
  idle: {
    body: "#0FF1CF",
    face: "#06163C",
    accent: "#FFD76A",
    glow: "rgba(15, 241, 207, 0.22)",
    icon: Sparkles,
    iconColor: "#06163C",
    badgeBg: "#FFD76A"
  },
  donation: {
    body: "#0FF1CF",
    face: "#06163C",
    accent: "#FF8AAE",
    glow: "rgba(255, 138, 174, 0.22)",
    icon: Heart,
    iconColor: "#FFFFFF",
    badgeBg: "#FF5C8A"
  },
  success: {
    body: "#0FF1CF",
    face: "#06163C",
    accent: "#65F5C7",
    glow: "rgba(15, 241, 207, 0.24)",
    icon: CheckCircle2,
    iconColor: "#06163C",
    badgeBg: "#65F5C7"
  },
  pending: {
    body: "#FFD76A",
    face: "#06163C",
    accent: "#0FF1CF",
    glow: "rgba(255, 215, 106, 0.2)",
    icon: Clock3,
    iconColor: "#06163C",
    badgeBg: "#FFD76A"
  },
  verified: {
    body: "#0FF1CF",
    face: "#06163C",
    accent: "#65F5C7",
    glow: "rgba(101, 245, 199, 0.22)",
    icon: ShieldCheck,
    iconColor: "#06163C",
    badgeBg: "#65F5C7"
  },
  empty: {
    body: "#31C6F6",
    face: "#06163C",
    accent: "#FFD76A",
    glow: "rgba(49, 198, 246, 0.2)",
    icon: Sparkles,
    iconColor: "#06163C",
    badgeBg: "#FFD76A"
  },
  error: {
    body: "#FF8FA9",
    face: "#06163C",
    accent: "#FFD76A",
    glow: "rgba(255, 143, 169, 0.2)",
    icon: XCircle,
    iconColor: "#FFFFFF",
    badgeBg: "#D84866"
  }
};

type GatherGoMascotProps = {
  variant?: GatherGoMascotVariant;
  size?: number;
  animated?: boolean;
  showBadge?: boolean;
  style?: StyleProp<ViewStyle>;
};

const AnimatedView = Animated.createAnimatedComponent(View);
const CELEBRATION_VARIANTS = new Set<GatherGoMascotVariant>([
  "donation",
  "success",
  "verified",
  "empty"
]);

const SPARKLE_POINTS: SparklePoint[] = [
  { key: "top-left", top: 0.12, left: 0.08, size: 0.07, lift: -0.1 },
  { key: "top-right", top: 0.18, right: 0.06, size: 0.05, lift: -0.14 },
  { key: "mid-right", top: 0.46, right: 0.02, size: 0.04, lift: -0.08 }
];

export function GatherGoMascot({
  variant = "idle",
  size = 88,
  animated = true,
  showBadge = true,
  style
}: GatherGoMascotProps) {
  const entrance = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const float = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const badgePop = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;
  const hasSparkles = CELEBRATION_VARIANTS.has(variant);

  useEffect(() => {
    entrance.setValue(animated ? 0 : 1);
    float.setValue(0);
    pulse.setValue(0);
    sparkle.setValue(0);
    blink.setValue(1);
    badgePop.setValue(animated ? 0 : 1);
    shake.setValue(0);

    if (!animated) {
      return undefined;
    }

    const entranceAnimation = Animated.parallel([
      Animated.spring(entrance, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true
      }),
      Animated.sequence([
        Animated.delay(160),
        Animated.spring(badgePop, {
          toValue: 1,
          friction: 5,
          tension: 95,
          useNativeDriver: true
        })
      ])
    ]);
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: variant === "pending" ? 1200 : 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: variant === "pending" ? 1200 : 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    );
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: variant === "pending" ? 1000 : 1500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: variant === "pending" ? 1000 : 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    );
    const blinkAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(1300),
        Animated.timing(blink, {
          toValue: 0.12,
          duration: 80,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 110,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.delay(1200)
      ])
    );
    const activeAnimations = [
      entranceAnimation,
      floatAnimation,
      pulseAnimation,
      blinkAnimation
    ];

    if (hasSparkles || variant === "pending") {
      activeAnimations.push(
        Animated.loop(
          Animated.timing(sparkle, {
            toValue: 1,
            duration: variant === "pending" ? 1600 : 2200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
          })
        )
      );
    }

    if (variant === "error") {
      activeAnimations.push(
        Animated.sequence([
          Animated.delay(180),
          Animated.timing(shake, {
            toValue: 1,
            duration: 360,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          })
        ])
      );
    }

    activeAnimations.forEach((animation) => animation.start());

    return () => {
      activeAnimations.forEach((animation) => animation.stop());
    };
  }, [
    animated,
    badgePop,
    blink,
    entrance,
    float,
    hasSparkles,
    pulse,
    shake,
    sparkle,
    variant
  ]);

  const entranceOpacity = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  const entranceTranslateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0]
  });
  const entranceScale = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1]
  });
  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, variant === "success" || variant === "donation" ? -6 : -3]
  });
  const bodyRotate = float.interpolate({
    inputRange: [0, 1],
    outputRange:
      variant === "success" || variant === "donation"
        ? ["-2deg", "2deg"]
        : ["-1deg", "1deg"]
  });
  const shakeTranslateX = shake.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [0, -4, 4, -3, 3, 0]
  });
  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, variant === "pending" ? 1.22 : 1.08]
  });
  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, variant === "pending" ? 0.1 : 0.18]
  });
  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1.1]
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [variant === "pending" ? 0.7 : 0.34, 0]
  });
  const sparkleOpacity = sparkle.interpolate({
    inputRange: [0, 0.22, 0.72, 1],
    outputRange: [0, 1, 0.75, 0]
  });
  const sparkleScale = sparkle.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0.35, 1, 0.7]
  });
  const badgePulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, variant === "pending" ? 1.12 : 1.05]
  });

  return (
    <View
      style={[
        tw`items-center justify-center`,
        {
          width: size,
          height: size
        },
        style
      ]}
    >
      <AnimatedView
        style={[
          tw`absolute rounded-full`,
          {
            width: size * 0.88,
            height: size * 0.88,
            backgroundColor: config.glow,
            opacity: glowOpacity,
            transform: [{ scale: glowScale }]
          }
        ]}
      />
      <AnimatedView
        style={[
          tw`absolute rounded-full border`,
          {
            width: size * 0.9,
            height: size * 0.9,
            borderColor: config.accent,
            opacity: ringOpacity,
            transform: [{ scale: ringScale }]
          }
        ]}
      />
      {hasSparkles || variant === "pending"
        ? SPARKLE_POINTS.map((point) => (
            <AnimatedView
              key={point.key}
              style={[
                tw`absolute rounded-full`,
                {
                  top: size * point.top,
                  left:
                    point.left === undefined ? undefined : size * point.left,
                  right:
                    point.right === undefined ? undefined : size * point.right,
                  width: size * point.size,
                  height: size * point.size,
                  backgroundColor: config.accent,
                  opacity: sparkleOpacity,
                  transform: [
                    {
                      translateY: sparkle.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, size * point.lift]
                      })
                    },
                    { scale: sparkleScale }
                  ]
                }
              ]}
            />
          ))
        : null}
      <AnimatedView
        style={{
          opacity: entranceOpacity,
          transform: [
            { translateY: entranceTranslateY },
            { scale: entranceScale }
          ]
        }}
      >
        <AnimatedView
          style={{
            width: size,
            height: size,
            transform: [
              { translateX: shakeTranslateX },
              { translateY },
              { rotate: bodyRotate }
            ]
          }}
        >
          <Svg width={size} height={size} viewBox="0 0 100 112">
            <Ellipse
              cx="50"
              cy="101"
              rx="23"
              ry="6"
              fill="#000820"
              opacity="0.35"
            />
            <Path
              d="M50 8C28 8 13 24 13 45c0 25 27 47 37 57 10-10 37-32 37-57C87 24 72 8 50 8Z"
              fill={config.body}
            />
            <Path
              d="M50 14C31 14 19 28 19 46c0 18 18 37 31 50 13-13 31-32 31-50 0-18-12-32-31-32Z"
              fill="#FFFFFF"
              opacity="0.12"
            />
            <Circle cx="50" cy="44" r="26" fill={config.face} />
            <Path
              d="M41 54c5 6 13 6 18 0"
              fill="none"
              stroke={config.body}
              strokeLinecap="round"
              strokeWidth="4"
            />
            <Path
              d="M20 59c-7 1-11 5-12 11"
              fill="none"
              stroke={config.accent}
              strokeLinecap="round"
              strokeWidth="4"
            />
            <Path
              d="M80 59c7 1 11 5 12 11"
              fill="none"
              stroke={config.accent}
              strokeLinecap="round"
              strokeWidth="4"
            />
            <Path
              d="M34 91c-4 4-6 8-6 12"
              fill="none"
              stroke={config.face}
              strokeLinecap="round"
              strokeWidth="5"
            />
            <Path
              d="M66 91c4 4 6 8 6 12"
              fill="none"
              stroke={config.face}
              strokeLinecap="round"
              strokeWidth="5"
            />
          </Svg>
          <AnimatedView
            style={[
              tw`absolute rounded-full`,
              {
                top: size * 0.32,
                left: size * 0.36,
                width: size * 0.08,
                height: size * 0.08,
                backgroundColor: config.body,
                transform: [{ scaleY: blink }]
              }
            ]}
          />
          <AnimatedView
            style={[
              tw`absolute rounded-full`,
              {
                top: size * 0.32,
                left: size * 0.56,
                width: size * 0.08,
                height: size * 0.08,
                backgroundColor: config.body,
                transform: [{ scaleY: blink }]
              }
            ]}
          />
        </AnimatedView>
      </AnimatedView>
      {showBadge && Icon ? (
        <AnimatedView
          style={[
            tw`absolute items-center justify-center rounded-full border-2 border-[#01082E]`,
            {
              right: size * 0.02,
              bottom: size * 0.02,
              width: size * 0.34,
              height: size * 0.34,
              backgroundColor: config.badgeBg,
              transform: [{ scale: badgePop }, { scale: badgePulseScale }]
            }
          ]}
        >
          <Icon size={size * 0.18} color={config.iconColor} />
        </AnimatedView>
      ) : null}
    </View>
  );
}
