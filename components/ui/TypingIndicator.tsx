import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import tw from "twrnc";

export const TypingIndicator = ({ text }: { text: string }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -3,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

    const anim1 = createAnimation(dot1, 0);
    const anim2 = createAnimation(dot2, 150);
    const anim3 = createAnimation(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={tw`flex-row items-center gap-2 pl-4 py-4`}>
      <View style={tw`flex-row items-center gap-1`}>
        {[dot1, dot2, dot3].map((dot, idx) => (
          <Animated.View
            key={idx}
            style={[
              tw`w-1.5 h-1.5 rounded-full bg-gray-400`,
              { transform: [{ translateY: dot }] },
            ]}
          />
        ))}
      </View>

      <Text style={tw`text-gray-400 text-xs ml-2`}>{text}</Text>
    </View>
  );
};
