import {
  GOGO_STARTUP_DURATION_MS,
  GOGO_STARTUP_TRACKS,
  type StartupProperty,
  type StartupTrack,
  type StartupTrackName,
} from "@/constants/gogoStartup";
import { rotationAt, svgTransformAdapter } from "@/utils/svgMotion";
import { useCallback, useEffect, useRef } from "react";
import {
  cancelAnimation,
  Easing,
  interpolateColor,
  ReduceMotion,
  runOnJS,
  type SharedValue,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { CircleProps, GProps, PathProps } from "react-native-svg";

const EASINGS = [
  (value: number) => {
    "worklet";
    return value;
  },
  Easing.bezierFn(0.16, 0.84, 0.3, 1),
  Easing.bezierFn(0.45, 0, 0.55, 1),
  Easing.bezierFn(0.34, 1.56, 0.64, 1),
  Easing.bezierFn(0.42, 0, 0.58, 1),
];

export function startupValue(
  name: StartupTrackName,
  property: StartupProperty,
  percent: number,
  initial: number,
) {
  "worklet";
  const track: StartupTrack = GOGO_STARTUP_TRACKS[name];
  const frames = track[property];
  if (!frames) return initial;
  let before = 0;
  let value = initial;
  let previousEase = frames[0][2];
  for (const [at, next, easing] of frames) {
    if (percent < at) {
      const amount = EASINGS[previousEase]((percent - before) / (at - before));
      return value + (next - value) * amount;
    }
    before = at;
    value = next;
    previousEase = easing;
  }
  return value;
}

export function useGogoStartupMotion(
  animated: boolean,
  onComplete: () => void,
  ready: boolean,
) {
  const completed = useRef(false);
  const complete = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    onComplete();
  }, [onComplete]);
  const progress = useSharedValue(animated ? 0 : 100);
  useEffect(() => {
    cancelAnimation(progress);
    if (!ready || completed.current) return;
    if (!animated) {
      progress.value = 100;
      complete();
      return;
    }
    progress.value = 0;
    progress.value = withTiming(
      100,
      {
        duration: GOGO_STARTUP_DURATION_MS,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.Never,
      },
      (finished) => {
        if (finished) runOnJS(complete)();
      },
    );
    return () => cancelAnimation(progress);
  }, [animated, complete, progress, ready]);
  return progress;
}

export function useStartupGroup(
  progress: SharedValue<number>,
  name: StartupTrackName,
  originX: number,
  originY: number,
  animated: boolean,
) {
  return useAnimatedProps<GProps>(
    () => {
      const percent =
        !animated && (name === "idle" || name === "look")
          ? 0
          : animated
            ? progress.value
            : 100;
      const x = startupValue(name, "x", percent, 0);
      const y = startupValue(name, "y", percent, 0);
      const scale = startupValue(name, "scale", percent, 1);
      const sx = startupValue(name, "scaleX", percent, scale);
      const sy = startupValue(name, "scaleY", percent, scale);
      const rotation = rotationAt(
        startupValue(name, "rotation", percent, 0),
        originX,
        originY,
      );
      return {
        transform: [
          rotation[0] * sx,
          rotation[1] * sx,
          rotation[2] * sy,
          rotation[3] * sy,
          rotation[4] + originX * (1 - sx) + x,
          rotation[5] + originY * (1 - sy) + y,
        ],
        opacity: startupValue(name, "opacity", percent, 1),
      };
    },
    undefined,
    svgTransformAdapter,
  );
}

export function useStartupStroke(
  progress: SharedValue<number>,
  name: StartupTrackName,
  length: number,
  animated: boolean,
) {
  return useAnimatedProps<PathProps>(() => ({
    strokeDashoffset:
      (length *
        startupValue(name, "dash", animated ? progress.value : 100, 0)) /
      100,
  }));
}

export function useStartupRing(
  progress: SharedValue<number>,
  name: "ring1c" | "ring2c" | "ring3c",
  animated: boolean,
) {
  return useAnimatedProps<CircleProps>(() => {
    const percent = animated ? progress.value : 100;
    return {
      strokeDashoffset:
        (2 * Math.PI * 24 * startupValue(name, "dash", percent, 0)) / 100,
      stroke: interpolateColor(
        startupValue(name, "strokeMix", percent, 0),
        [0, 1],
        ["#1EEBC8", "#0FB898"],
      ),
    };
  });
}
