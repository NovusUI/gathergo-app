import { GatherGoMascot } from "@/components/gogo/mascot/GatherGoMascot";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import type { InterestTopic, InterestWeight } from "@/types/preferences";
import { useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import tw from "twrnc";

function Ring({
  topic,
  x,
  y,
  size,
  center,
}: {
  topic: InterestTopic;
  x: number;
  y: number;
  size: number;
  center: number;
}) {
  const reducedMotion = useReducedMotionPreference();
  const scale = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const position = useRef(
    new Animated.ValueXY({
      x: reducedMotion ? x - center : 0,
      y: reducedMotion ? y - 140 : 0,
    }),
  ).current;
  useEffect(() => {
    const target = { x: x - center, y: y - 140 };
    if (reducedMotion) {
      scale.setValue(1);
      position.setValue(target);
      return;
    }
    const animation = Animated.parallel([
      Animated.spring(position, {
        toValue: target,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 7,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [center, position, reducedMotion, scale, x, y]);
  return (
    <Animated.View
      style={[
        tw`absolute items-center justify-center rounded-full border-2 p-2`,
        {
          left: center - size / 2,
          top: 140 - size / 2,
          width: size,
          height: size,
          borderColor: topic.accent,
          backgroundColor: "#101C45",
          transform: [...position.getTranslateTransform(), { scale }],
        },
      ]}
    >
      <Text
        numberOfLines={2}
        style={[
          tw`text-center text-[10px] font-semibold`,
          { color: topic.accent },
        ]}
      >
        {topic.label}
      </Text>
    </Animated.View>
  );
}

export function InterestMap({
  topics,
  strongerIds = [],
  weights = [],
}: {
  topics: InterestTopic[];
  strongerIds?: string[];
  weights?: InterestWeight[];
}) {
  const [width, setWidth] = useState(320);
  const reducedMotion = useReducedMotionPreference();
  const reaction = useRef(new Animated.Value(1)).current;
  const count = topics.length;
  const reactionKey = `${topics.map((topic) => topic.id).join(",")}:${strongerIds.join(",")}`;
  useEffect(() => {
    if (reducedMotion || count === 0) {
      reaction.setValue(1);
      return;
    }
    const animation = Animated.sequence([
      Animated.spring(reaction, { toValue: 1.08, useNativeDriver: true }),
      Animated.spring(reaction, { toValue: 1, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [count, reactionKey, reaction, reducedMotion]);
  const center = width / 2;
  const radius = Math.min(100, width * 0.3);
  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      accessibilityLabel={
        count
          ? `Your map: ${topics.map((topic) => topic.label).join(", ")}`
          : "Your map is ready for your interests"
      }
      style={tw`h-[280px] w-full items-center justify-center`}
    >
      <Svg width={width} height={280} accessible={false} style={tw`absolute`}>
        <Circle
          cx={center}
          cy={140}
          r={radius}
          fill="none"
          stroke="#24345A"
          strokeWidth={1.5}
          strokeDasharray="4 6"
        />
        <Circle
          cx={center}
          cy={140}
          r={radius * 0.65}
          fill="none"
          stroke="#15345A"
          strokeWidth={1}
        />
      </Svg>
      <Animated.View style={{ transform: [{ scale: reaction }] }}>
        <GatherGoMascot variant="idle" size={96} showBadge={false} />
      </Animated.View>
      {topics.slice(0, 5).map((topic, index, shown) => {
        const angle =
          (index * 2 * Math.PI) / Math.max(3, shown.length) - Math.PI / 2;
        const weight = weights.find((item) => item.id === topic.id)?.weight;
        const size =
          weight === undefined
            ? strongerIds.includes(topic.id)
              ? 78
              : 66
            : 58 + Math.min(8, weight) * 2.5;
        return (
          <Ring
            key={topic.id}
            topic={topic}
            center={center}
            x={center + Math.cos(angle) * radius}
            y={140 + Math.sin(angle) * radius}
            size={size}
          />
        );
      })}
    </View>
  );
}
