import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleProp, Text, TextStyle } from "react-native";
import tw from "twrnc";

type MascotMessageProps = {
  message: string;
  animate?: boolean;
  speedMs?: number;
  startDelayMs?: number;
  style?: StyleProp<TextStyle>;
};

export function MascotMessage({
  message,
  animate = true,
  speedMs = 22,
  startDelayMs = 160,
  style
}: MascotMessageProps) {
  const [visibleMessage, setVisibleMessage] = useState(animate ? "" : message);
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animate) {
      setVisibleMessage(message);
      return undefined;
    }

    let index = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    setVisibleMessage("");

    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        index += 1;
        setVisibleMessage(message.slice(0, index));

        if (index >= message.length && interval) {
          clearInterval(interval);
        }
      }, speedMs);
    }, startDelayMs);

    return () => {
      clearTimeout(timeout);

      if (interval) {
        clearInterval(interval);
      }
    };
  }, [animate, message, speedMs, startDelayMs]);

  const isTyping = animate && visibleMessage.length < message.length;

  useEffect(() => {
    if (!isTyping) {
      cursorOpacity.setValue(0);
      return undefined;
    }

    cursorOpacity.setValue(1);

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0.15,
          duration: 360,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 360,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [cursorOpacity, isTyping]);

  return (
    <Text style={[tw`text-sm leading-5 text-[#D9E2FF]`, style]}>
      {visibleMessage}
      {isTyping ? (
        <Animated.Text style={[tw`text-[#0FF1CF]`, { opacity: cursorOpacity }]}>
          |
        </Animated.Text>
      ) : null}
    </Text>
  );
}
