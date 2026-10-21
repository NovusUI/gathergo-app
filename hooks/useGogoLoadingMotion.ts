import { rotationAt, svgTransformAdapter } from "@/utils/svgMotion";
import { useEffect } from "react";
import {
  cancelAnimation,
  Easing,
  interpolate,
  ReduceMotion,
  type SharedValue,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { GProps } from "react-native-svg";

export function useGogoLoadingMotion(animated: boolean) {
  const body = useSharedValue(0);
  const spin = useSharedValue(0);
  const blink = useSharedValue(1);
  const look = useSharedValue(0);
  const arm = useSharedValue(0);
  const rings = useSharedValue(0);

  useEffect(() => {
    const values = [body, spin, blink, look, arm, rings];
    values.forEach(cancelAnimation);
    body.value = spin.value = look.value = arm.value = rings.value = 0;
    blink.value = 1;
    if (!animated) return;

    const easeInOut = Easing.bezier(0.42, 0, 0.58, 1);
    const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
    const loop = (
      value: SharedValue<number>,
      duration: number,
      reverse = false,
    ) => {
      value.value = withRepeat(
        withTiming(1, {
          duration,
          easing: reverse ? easeInOut : Easing.linear,
        }),
        -1,
        reverse,
        undefined,
        ReduceMotion.Never,
      );
    };
    loop(body, 900, true);
    loop(spin, 1200);
    loop(arm, 450, true);
    loop(rings, 1200);
    blink.value = withRepeat(
      withSequence(
        withDelay(4048, withTiming(0.08, { duration: 132, easing: ease })),
        withTiming(1, { duration: 220, easing: ease }),
      ),
      -1,
      false,
      undefined,
      ReduceMotion.Never,
    );
    look.value = withRepeat(
      withSequence(
        withDelay(360, withTiming(1, { duration: 1080, easing: easeInOut })),
        withDelay(540, withTiming(0, { duration: 1080, easing: easeInOut })),
        withDelay(540, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
      undefined,
      ReduceMotion.Never,
    );
    return () => values.forEach(cancelAnimation);
  }, [animated, arm, blink, body, look, rings, spin]);

  const bodyProps = useAnimatedProps<GProps>(
    () => {
      const scaleX = animated
        ? interpolate(body.value, [0, 1], [1.01, 0.99])
        : 1;
      const scaleY = animated
        ? interpolate(body.value, [0, 1], [0.99, 1.01])
        : 1;
      return {
        transform: [
          scaleX,
          0,
          0,
          scaleY,
          100 * (1 - scaleX),
          200 * (1 - scaleY) + (animated ? -5 * body.value : 0),
        ],
      };
    },
    undefined,
    svgTransformAdapter,
  );
  const shadowProps = useAnimatedProps<GProps>(
    () => {
      const scale = animated ? interpolate(body.value, [0, 1], [1, 0.9]) : 1;
      return {
        transform: [scale, 0, 0, scale, 100 * (1 - scale), 207 * (1 - scale)],
        opacity: animated ? interpolate(body.value, [0, 1], [0.1, 0.07]) : 0.1,
      };
    },
    undefined,
    svgTransformAdapter,
  );
  const antennaProps = useAnimatedProps<GProps>(
    () => ({ transform: rotationAt(animated ? spin.value * 360 : 0, 100, 14) }),
    undefined,
    svgTransformAdapter,
  );
  const eyeProps = useAnimatedProps<GProps>(
    () => {
      const scale = animated ? blink.value : 1;
      return { transform: [1, 0, 0, scale, 0, 96 * (1 - scale)] };
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
        animated ? -6 + 12 * look.value : 0,
        animated ? -4 : 0,
      ],
    }),
    undefined,
    svgTransformAdapter,
  );
  const rightArmProps = useAnimatedProps<GProps>(
    () => ({ transform: rotationAt(animated ? -8 * arm.value : 0, 172, 128) }),
    undefined,
    svgTransformAdapter,
  );
  return {
    bodyProps,
    shadowProps,
    antennaProps,
    eyeProps,
    pupilProps,
    rightArmProps,
    rings,
  };
}

export function useGogoLoadingRing(
  progress: SharedValue<number>,
  delay: number,
  animated: boolean,
) {
  const easeInOut = Easing.bezierFn(0.42, 0, 0.58, 1);
  return useAnimatedProps<GProps>(
    () => {
      const phase = (progress.value + 1 - delay / 1200) % 1;
      const hop =
        phase < 0.3
          ? easeInOut(phase / 0.3)
          : phase < 0.6
            ? 1 - easeInOut((phase - 0.3) / 0.3)
            : 0;
      return {
        transform: [1, 0, 0, 1, 0, animated ? -14 * hop : 0],
        opacity: animated ? 0.45 + 0.55 * hop : 1,
      };
    },
    undefined,
    svgTransformAdapter,
  );
}
