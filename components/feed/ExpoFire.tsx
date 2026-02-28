import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import Svg, { Path } from "react-native-svg";

interface ExpoFireProps {
  intensity: number; // 0 - 100
  size?: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const FlamePath = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill={color}
      d="M13.5 1.2c.3 2.5-.2 4.5-1.5 5.9-1.2 1.3-2.8 2.1-3.7 3.8-.9 1.6-.9 3.8 0 5.3 1.1 2 3.3 3.3 5.7 3.3 3.5 0 6.3-2.7 6.3-6.2 0-3.6-2.6-5.3-3.9-7.4-.6-1-1-2.3-.9-3.7-1.2.6-2 1.5-2 3z"
    />
    <Path
      fill="rgba(255,255,255,0.38)"
      d="M13.5 11.2c.1 1-.1 1.8-.6 2.3-.4.5-1 .8-1.3 1.4-.3.6-.3 1.5 0 2 .4.8 1.2 1.3 2.1 1.3 1.3 0 2.3-1 2.3-2.3 0-1.3-1-2-1.5-2.8-.2-.4-.4-.9-.3-1.9-.4.2-.7.6-.7 1z"
    />
  </Svg>
);

export default function ExpoFire({ intensity, size = 34 }: ExpoFireProps) {
  const normalizedIntensity = clamp(intensity, 0, 100);
  const flicker = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  const flameCount = useMemo(() => {
    if (normalizedIntensity >= 75) return 4;
    if (normalizedIntensity >= 45) return 3;
    if (normalizedIntensity > 0) return 2;
    return 1;
  }, [normalizedIntensity]);

  useEffect(() => {
    const speed = Math.max(240, 620 - normalizedIntensity * 2.5);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, {
          toValue: 1,
          duration: speed,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(flicker, {
          toValue: 0,
          duration: speed,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [flicker, normalizedIntensity]);

  useEffect(() => {
    pulse.setValue(1);
    Animated.sequence([
      Animated.timing(pulse, {
        toValue: normalizedIntensity > 0 ? 1.08 : 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(pulse, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [normalizedIntensity, pulse]);

  const flickerScale = flicker.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.06],
  });

  const flickerOpacity = flicker.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1],
  });

  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <Animated.View
        style={{ transform: [{ scale: flickerScale }], opacity: flickerOpacity }}
      >
        <FlamePath color="#FF7A1A" size={size} />
      </Animated.View>

      {flameCount >= 2 && (
        <View style={{ position: "absolute", left: -8, top: 12, opacity: 0.9 }}>
          <FlamePath color="#FF9A2A" size={Math.round(size * 0.58)} />
        </View>
      )}
      {flameCount >= 3 && (
        <View style={{ position: "absolute", right: -7, top: 14, opacity: 0.86 }}>
          <FlamePath color="#FFAE3D" size={Math.round(size * 0.5)} />
        </View>
      )}
      {flameCount >= 4 && (
        <View style={{ position: "absolute", right: 2, top: -8, opacity: 0.88 }}>
          <FlamePath color="#FFC35F" size={Math.round(size * 0.4)} />
        </View>
      )}
    </Animated.View>
  );
}
