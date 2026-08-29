import { HandHeart, Leaf, MapPin, Users } from "lucide-react-native";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import tw from "twrnc";

interface ImpactPageLoaderProps {
  title?: string;
  message?: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

const impactNodes = [
  {
    key: "cause",
    label: "Cause",
    Icon: HandHeart,
    color: "#FF6B6B",
    position: { top: 8, left: 58 },
  },
  {
    key: "people",
    label: "People",
    Icon: Users,
    color: "#31C6F6",
    position: { bottom: 12, left: 14 },
  },
  {
    key: "place",
    label: "Place",
    Icon: MapPin,
    color: "#F8D05C",
    position: { bottom: 12, right: 14 },
  },
] as const;

const AnimatedView = Animated.createAnimatedComponent(View);

export default function ImpactPageLoader({
  title = "Mapping impact",
  message = "Gathering the people, place, and purpose.",
  compact = false,
  style,
}: ImpactPageLoaderProps) {
  const orbit = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    orbit.setValue(0);
    pulse.setValue(0);

    const orbitLoop = Animated.loop(
      Animated.timing(orbit, {
        toValue: 1,
        duration: 5200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    orbitLoop.start();
    pulseLoop.start();

    return () => {
      orbitLoop.stop();
      pulseLoop.stop();
      orbit.stopAnimation();
      pulse.stopAnimation();
    };
  }, [orbit, pulse]);

  const rotate = orbit.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const reverseRotate = orbit.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-360deg"],
  });
  const centerScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.06],
  });
  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.36],
  });
  const railTranslate = orbit.interpolate({
    inputRange: [0, 1],
    outputRange: [-72, 188],
  });

  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${message}`}
      accessibilityRole="progressbar"
      style={[
        styles.container,
        compact ? styles.compactContainer : styles.fullContainer,
        style,
      ]}
    >
      <View style={styles.artwork}>
        <AnimatedView
          style={[
            styles.outerGlow,
            {
              opacity: glowOpacity,
              transform: [{ scale: centerScale }],
            },
          ]}
        />
        <AnimatedView
          style={[
            styles.orbitRing,
            {
              transform: [{ rotate }],
            },
          ]}
        />

        {impactNodes.map(({ key, label, Icon, color, position }, index) => (
          <AnimatedView
            key={key}
            style={[
              styles.node,
              position,
              {
                borderColor: `${color}66`,
                backgroundColor: `${color}20`,
                opacity: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [index === 1 ? 0.82 : 0.72, 1],
                }),
                transform: [
                  {
                    translateY: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [index === 0 ? 2 : -2, index === 0 ? -2 : 2],
                    }),
                  },
                ],
              },
            ]}
          >
            <Icon color={color} size={18} strokeWidth={2.4} />
          </AnimatedView>
        ))}

        <AnimatedView
          style={[
            styles.centerMark,
            {
              transform: [{ scale: centerScale }],
            },
          ]}
        >
          <Leaf color="#01082E" size={30} strokeWidth={2.6} />
        </AnimatedView>

        <AnimatedView
          style={[
            styles.orbitDot,
            {
              transform: [{ rotate }, { translateY: -66 }, { rotate: reverseRotate }],
            },
          ]}
        />
      </View>

      <Text style={tw`mt-7 text-center text-xl font-bold text-white`}>
        {title}
      </Text>
      <Text
        style={tw`mt-2 max-w-[280px] text-center text-sm leading-6 text-[#AFC0E7]`}
      >
        {message}
      </Text>

      <View style={styles.rail}>
        <AnimatedView
          style={[
            styles.railFill,
            {
              transform: [{ translateX: railTranslate }],
            },
          ]}
        />
      </View>

      {!compact && (
        <View style={tw`mt-5 flex-row gap-2`}>
          {impactNodes.map(({ key, label, color }) => (
            <View
              key={key}
              style={[
                tw`rounded-full border px-3 py-1.5`,
                { borderColor: `${color}55`, backgroundColor: `${color}18` },
              ]}
            >
              <Text style={[tw`text-[11px] font-semibold`, { color }]}>
                {label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#01082E",
    paddingHorizontal: 28,
  },
  fullContainer: {
    flex: 1,
  },
  compactContainer: {
    paddingVertical: 34,
  },
  artwork: {
    height: 156,
    width: 156,
    alignItems: "center",
    justifyContent: "center",
  },
  outerGlow: {
    position: "absolute",
    top: 20,
    left: 20,
    height: 116,
    width: 116,
    borderRadius: 58,
    backgroundColor: "#0FF1CF",
  },
  orbitRing: {
    position: "absolute",
    top: 12,
    left: 12,
    height: 132,
    width: 132,
    borderRadius: 66,
    borderWidth: 2,
    borderColor: "rgba(15, 241, 207, 0.14)",
    borderTopColor: "#0FF1CF",
    borderRightColor: "#31C6F6",
  },
  orbitDot: {
    position: "absolute",
    top: 73,
    left: 73,
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: "#0FF1CF",
    shadowColor: "#0FF1CF",
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  centerMark: {
    height: 66,
    width: 66,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#0FF1CF",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.45)",
  },
  node: {
    position: "absolute",
    height: 42,
    width: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
  },
  rail: {
    marginTop: 24,
    height: 4,
    width: 188,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#162655",
  },
  railFill: {
    height: 4,
    width: 72,
    borderRadius: 999,
    backgroundColor: "#0FF1CF",
  },
});
