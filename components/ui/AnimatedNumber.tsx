import { numberWithCommas } from "@/utils/utils";
import { useEffect, useRef, useState } from "react";
import { Animated, Text } from "react-native";

interface AnimatedNumberProps {
  value: number;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value }) => {
  const animatedValue = useRef(new Animated.Value(value)).current;
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value,
      duration: 500,
      useNativeDriver: false,
    }).start();

    const listenerId = animatedValue.addListener(({ value }) => {
      setDisplayValue(Math.round(value));
    });

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [value]);

  return (
    <Text className="text-white text-2xl">
     {numberWithCommas(displayValue, true, null)}
    </Text>
  );
};