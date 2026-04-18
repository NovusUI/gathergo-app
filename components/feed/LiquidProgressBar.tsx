// components/feed/LiquidProgressBar.tsx
import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import tw from "twrnc";

interface LiquidProgressBarProps {
  percentage: number;
  color?: string;
  height?: number;
  showWave?: boolean;
}

const LiquidProgressBar: React.FC<LiquidProgressBarProps> = ({
  percentage,
  color = "#0FF1CF",
  height = 8,
  showWave = false,
}) => {
  const waveAnim = useRef(new Animated.Value(0)).current;
  const fillAnim = useRef(new Animated.Value(0)).current;
  const normalized = Math.max(0, Math.min(percentage, 100));

  useEffect(() => {
    // Animate the fill
    Animated.timing(fillAnim, {
      toValue: normalized / 100,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Wave animation for high percentages
    if (showWave && normalized >= 90) {
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      waveAnim.stopAnimation();
      waveAnim.setValue(0);
    }
  }, [normalized, showWave, fillAnim, waveAnim]);

  const waveTranslateX = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View style={[tw`rounded-full overflow-hidden`, { height }]}>
      {/* Background */}
      <View style={tw`absolute inset-0 bg-black/30`} />

      {/* Liquid fill */}
      <Animated.View
        style={[
          tw`absolute inset-y-0 left-0 rounded-full`,
          {
            width: fillAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
            backgroundColor: color,
            opacity: 0.9,
          },
        ]}
      />

      {/* Wave effect */}
      {showWave && normalized >= 90 && (
        <Animated.View
          style={[
            tw`absolute inset-y-0`,
            {
              left: "20%",
              width: "60%",
              transform: [{ translateX: waveTranslateX }],
              backgroundColor: "rgba(255, 255, 255, 0.3)",
            },
          ]}
        />
      )}

      {/* Sparkle dots for milestones */}
      {normalized >= 50 && (
        <View style={tw`absolute inset-0 flex-row justify-between px-1`}>
          {[25, 50, 75, 100].map((marker) => (
            <View
              key={marker}
              style={[
                tw`w-px`,
                {
                  height,
                  backgroundColor:
                    normalized >= marker ? "white" : "transparent",
                  opacity: 0.3,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default LiquidProgressBar;
