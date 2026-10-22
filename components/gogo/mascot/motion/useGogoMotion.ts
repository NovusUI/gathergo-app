import type { GogoPose } from "@/components/gogo/mascot/constants";
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

export function useGogoMotion(pose: GogoPose, animated: boolean) {
  const body = useSharedValue(0);
  const gesture = useSharedValue(0);
  const blink = useSharedValue(1);
  const look = useSharedValue(0);
  const confetti = useSharedValue(0);

  useEffect(() => {
    const values = [body, gesture, blink, look, confetti];
    values.forEach(cancelAnimation);
    body.value = 0;
    gesture.value = 0;
    blink.value = 1;
    look.value = 0;
    confetti.value = 0;
    if (!animated) return;

    // The caller follows live accessibility changes instead of the library's
    // startup snapshot, including when motion is enabled again.
    body.value = withRepeat(
      withTiming(1, {
        duration: pose === "celebrate" ? 900 : 1300,
        easing:
          pose === "celebrate" ? Easing.linear : Easing.inOut(Easing.ease),
      }),
      -1,
      pose !== "celebrate",
      undefined,
      ReduceMotion.Never,
    );
    if (pose === "celebrate") {
      gesture.value = withRepeat(
        withTiming(1, { duration: 1800, easing: Easing.linear }),
        -1,
        false,
        undefined,
        ReduceMotion.Never,
      );
      confetti.value = withRepeat(
        withTiming(1, { duration: 2400, easing: Easing.linear }),
        -1,
        false,
        undefined,
        ReduceMotion.Never,
      );
    } else {
      blink.value = withRepeat(
        withSequence(
          withDelay(3864, withTiming(0.08, { duration: 126 })),
          withTiming(1, { duration: 210 }),
        ),
        -1,
        false,
        undefined,
        ReduceMotion.Never,
      );
      look.value = withRepeat(
        withTiming(1, { duration: 6000, easing: Easing.linear }),
        -1,
        false,
        undefined,
        ReduceMotion.Never,
      );
      if (pose === "wave") {
        gesture.value = withRepeat(
          withTiming(1, { duration: 650, easing: Easing.inOut(Easing.ease) }),
          -1,
          true,
          undefined,
          ReduceMotion.Never,
        );
      }
    }
    return () => values.forEach(cancelAnimation);
  }, [animated, blink, body, confetti, gesture, look, pose]);

  const bodyProps = useAnimatedProps<GProps>(
    () => {
      const celebrating = pose === "celebrate";
      const y = !animated
        ? 0
        : celebrating
          ? interpolate(body.value, [0, 0.45, 0.7, 1], [0, -14, -4, 0])
          : interpolate(body.value, [0, 1], [0, -5]);
      const xScale =
        animated && celebrating
          ? interpolate(body.value, [0, 0.45, 0.7, 1], [1.06, 0.97, 1, 1.06])
          : 1;
      const yScale =
        animated && celebrating
          ? interpolate(body.value, [0, 0.45, 0.7, 1], [0.94, 1.04, 1, 0.94])
          : 1;
      return {
        transform: [
          xScale,
          0,
          0,
          yScale,
          100 * (1 - xScale),
          200 * (1 - yScale) + y,
        ],
      };
    },
    undefined,
    svgTransformAdapter,
  );
  const shadowProps = useAnimatedProps<GProps>(
    () => {
      const scale = !animated
        ? 1
        : pose === "celebrate"
          ? interpolate(body.value, [0, 0.45, 1], [1, 0.7, 1])
          : interpolate(body.value, [0, 1], [1, 0.9]);
      const opacity = !animated
        ? pose === "celebrate"
          ? 0.12
          : 0.1
        : pose === "celebrate"
          ? interpolate(body.value, [0, 0.45, 1], [0.12, 0.05, 0.12])
          : interpolate(body.value, [0, 1], [0.1, 0.07]);
      return { transform: [scale, 0, 0, 1, 100 * (1 - scale), 0], opacity };
    },
    undefined,
    svgTransformAdapter,
  );
  const antennaProps = useAnimatedProps<GProps>(
    () => {
      if (animated && pose === "celebrate")
        return { transform: rotationAt(gesture.value * 360, 100, 14) };
      const scale =
        animated && pose === "wave"
          ? interpolate(body.value, [0, 1], [1, 1.18])
          : 1;
      return {
        transform: [scale, 0, 0, scale, 100 * (1 - scale), 14 * (1 - scale)],
      };
    },
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
        animated
          ? interpolate(
              look.value,
              [0, 0.35, 0.45, 0.65, 0.75, 0.9, 1],
              [0, 0, -5, -5, 4, 4, 0],
            )
          : 0,
        animated
          ? interpolate(
              look.value,
              [0, 0.35, 0.45, 0.65, 0.75, 0.9, 1],
              [0, 0, -2, -2, 1, 1, 0],
            )
          : 0,
      ],
    }),
    undefined,
    svgTransformAdapter,
  );
  const leftArmProps = useAnimatedProps<GProps>(
    () => ({
      transform: rotationAt(
        animated && pose === "celebrate"
          ? interpolate(body.value, [0, 0.45, 1], [8, -12, 8])
          : 0,
        28,
        124,
      ),
    }),
    undefined,
    svgTransformAdapter,
  );
  const rightArmProps = useAnimatedProps<GProps>(
    () => ({
      transform: rotationAt(
        !animated
          ? 0
          : pose === "celebrate"
            ? interpolate(body.value, [0, 0.45, 1], [-8, 12, -8])
            : pose === "wave"
              ? interpolate(gesture.value, [0, 1], [-10, 16])
              : 0,
        172,
        124,
      ),
    }),
    undefined,
    svgTransformAdapter,
  );
  const helloProps = useAnimatedProps<GProps>(() => ({
    opacity: animated ? interpolate(gesture.value, [0, 1], [0.15, 1]) : 1,
  }));
  return {
    bodyProps,
    shadowProps,
    antennaProps,
    eyeProps,
    pupilProps,
    leftArmProps,
    rightArmProps,
    helloProps,
    confetti,
  };
}

export function useGogoConfetti(
  progress: SharedValue<number>,
  phaseOffset: number,
  animated: boolean,
) {
  return useAnimatedProps<GProps>(
    () => {
      const phase = (progress.value + phaseOffset) % 1;
      return {
        transform: [1, 0, 0, 1, 0, animated ? -20 + 260 * phase : 0],
        opacity: animated
          ? interpolate(phase, [0, 0.1, 0.9, 1], [0, 1, 1, 0])
          : 1,
      };
    },
    undefined,
    svgTransformAdapter,
  );
}
