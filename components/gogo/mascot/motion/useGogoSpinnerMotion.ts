import { rotationAt, svgTransformAdapter } from "@/components/gogo/mascot/motion/svgMotion";
import { useEffect } from "react";
import {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { GProps } from "react-native-svg";

export function useGogoSpinnerMotion(animated: boolean) {
  const spin = useSharedValue(0);
  const pulse = useSharedValue(0);
  const look = useSharedValue(0);

  useEffect(() => {
    const values = [spin, pulse, look];
    values.forEach(cancelAnimation);
    spin.value = pulse.value = look.value = 0;
    if (!animated) return;

    const easeInOut = Easing.bezier(0.42, 0, 0.58, 1);
    spin.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.linear }),
      -1,
      false,
      undefined,
      ReduceMotion.Never,
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 700, easing: easeInOut }),
      -1,
      true,
      undefined,
      ReduceMotion.Never,
    );
    look.value = withRepeat(
      withSequence(
        withDelay(280, withTiming(1, { duration: 980, easing: easeInOut })),
        withDelay(420, withTiming(0, { duration: 840, easing: easeInOut })),
        withDelay(280, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
      undefined,
      ReduceMotion.Never,
    );
    return () => values.forEach(cancelAnimation);
  }, [animated, look, pulse, spin]);

  const ringProps = useAnimatedProps<GProps>(
    () => ({ transform: rotationAt(animated ? spin.value * 360 : 0, 32, 32) }),
    undefined,
    svgTransformAdapter,
  );
  const faceProps = useAnimatedProps<GProps>(
    () => {
      const scale = animated ? 1 + 0.06 * pulse.value : 1;
      return {
        transform: [scale, 0, 0, scale, 32 * (1 - scale), 34 * (1 - scale)],
      };
    },
    undefined,
    svgTransformAdapter,
  );
  const pupilProps = useAnimatedProps<GProps>(
    () => ({
      transform: [
        1,
        0,
        0,
        1,
        animated ? -2 + 4 * look.value : 0,
        animated ? -1 : 0,
      ],
    }),
    undefined,
    svgTransformAdapter,
  );
  return { ringProps, faceProps, pupilProps };
}
