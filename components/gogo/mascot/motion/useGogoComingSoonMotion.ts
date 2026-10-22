import { rotationAt, svgTransformAdapter } from "@/components/gogo/mascot/motion/svgMotion";
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

function typingPhase(phase: number) {
  "worklet";
  const ease = Easing.bezierFn(0.42, 0, 0.58, 1);
  return ease(phase < 0.5 ? phase * 2 : (1 - phase) * 2);
}

export function useGogoComingSoonMotion(animated: boolean) {
  const nod = useSharedValue(0);
  const typing = useSharedValue(0);
  const gaze = useSharedValue(0);
  const blink = useSharedValue(1);
  const glow = useSharedValue(0);
  const antenna = useSharedValue(0);
  const particles = useSharedValue(0);

  useEffect(() => {
    const values = [nod, typing, gaze, blink, glow, antenna, particles];
    values.forEach(cancelAnimation);
    nod.value =
      typing.value =
      gaze.value =
      glow.value =
      antenna.value =
      particles.value =
        0;
    blink.value = 1;
    if (!animated) return;

    const ease = Easing.bezier(0.42, 0, 0.58, 1);
    const loop = (
      value: SharedValue<number>,
      duration: number,
      reverse = true,
    ) => {
      value.value = withRepeat(
        withTiming(1, { duration, easing: reverse ? ease : Easing.linear }),
        -1,
        reverse,
        undefined,
        ReduceMotion.Never,
      );
    };
    loop(nod, 600);
    loop(typing, 600, false);
    loop(gaze, 1200);
    loop(glow, 1200);
    loop(antenna, 800);
    loop(particles, 2600, false);
    blink.value = withRepeat(
      withSequence(
        withDelay(
          3906,
          withTiming(0.08, { duration: 126, easing: Easing.linear }),
        ),
        withTiming(1, { duration: 168, easing: Easing.linear }),
      ),
      -1,
      false,
      undefined,
      ReduceMotion.Never,
    );
    return () => values.forEach(cancelAnimation);
  }, [animated, antenna, blink, gaze, glow, nod, particles, typing]);

  const bodyProps = useAnimatedProps<GProps>(
    () => ({ transform: [1, 0, 0, 1, 0, animated ? 2 * nod.value : 0] }),
    undefined,
    svgTransformAdapter,
  );
  const leftArmProps = useAnimatedProps<GProps>(
    () => ({
      transform: rotationAt(
        animated ? -7 + 14 * typingPhase(typing.value) : 0,
        28,
        128,
      ),
    }),
    undefined,
    svgTransformAdapter,
  );
  const rightArmProps = useAnimatedProps<GProps>(
    () => ({
      transform: rotationAt(
        animated ? 7 - 14 * typingPhase((typing.value + 0.25) % 1) : 0,
        172,
        128,
      ),
    }),
    undefined,
    svgTransformAdapter,
  );
  const eyeProps = useAnimatedProps<GProps>(
    () => {
      const scale = animated ? blink.value : 1;
      return { transform: [1, 0, 0, scale, 0, 100 * (1 - scale)] };
    },
    undefined,
    svgTransformAdapter,
  );
  const pupilProps = useAnimatedProps<GProps>(
    () => ({ transform: [1, 0, 0, 1, animated ? -5 + 10 * gaze.value : 0, 0] }),
    undefined,
    svgTransformAdapter,
  );
  const antennaProps = useAnimatedProps<GProps>(
    () => {
      const scale = animated ? 1 + 0.2 * antenna.value : 1;
      return { transform: [scale, 0, 0, scale, 100 * (1 - scale), 0] };
    },
    undefined,
    svgTransformAdapter,
  );
  const glowProps = useAnimatedProps<GProps>(
    () => {
      const scale = animated ? 0.9 + 0.25 * glow.value : 1;
      return {
        transform: [scale, 0, 0, scale, 100 * (1 - scale), 187 * (1 - scale)],
        opacity: animated ? 0.15 + 0.3 * glow.value : 1,
      };
    },
    undefined,
    svgTransformAdapter,
  );
  const sweatProps = useAnimatedProps<GProps>(
    () => ({
      transform: [
        1,
        0,
        0,
        1,
        0,
        animated ? 26 * Easing.bezierFn(0.42, 0, 1, 1)(particles.value) : 0,
      ],
      opacity: animated
        ? interpolate(particles.value, [0, 0.15, 0.8, 1], [0, 1, 1, 0])
        : 1,
    }),
    undefined,
    svgTransformAdapter,
  );
  return {
    bodyProps,
    leftArmProps,
    rightArmProps,
    eyeProps,
    pupilProps,
    antennaProps,
    glowProps,
    sweatProps,
    particles,
  };
}

export function useGogoComingSoonCode(
  progress: SharedValue<number>,
  delay: number,
  animated: boolean,
) {
  return useAnimatedProps<GProps>(
    () => {
      const phase = (progress.value + delay / 2600) % 1;
      return {
        transform: [
          1,
          0,
          0,
          1,
          0,
          animated ? -64 * Easing.bezierFn(0, 0, 0.58, 1)(phase) : 0,
        ],
        opacity: animated ? interpolate(phase, [0, 0.15, 1], [0, 1, 0]) : 0,
      };
    },
    undefined,
    svgTransformAdapter,
  );
}
