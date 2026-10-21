import type { FeedFrenzyLevel } from "@/constants/feedFrenzy";
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
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import type { GProps } from "react-native-svg";

const MOTION = {
  1: {
    bodyMs: 3000,
    flameMs: 1600,
    sideMs: 1600,
    emberMs: 2200,
    lift: 3,
    shadow: 0.94,
    shadowOpacity: 0.1,
    scaleX: [1, 1],
    scaleY: [1, 1],
  },
  2: {
    bodyMs: 1500,
    flameMs: 900,
    sideMs: 900,
    emberMs: 2200,
    lift: 6,
    shadow: 0.88,
    shadowOpacity: 0.1,
    scaleX: [1.02, 0.99],
    scaleY: [0.98, 1.01],
  },
  3: {
    bodyMs: 700,
    flameMs: 600,
    sideMs: 500,
    emberMs: 1600,
    lift: 12,
    shadow: 0.75,
    shadowOpacity: 0.12,
    scaleX: [1.05, 0.97],
    scaleY: [0.95, 1.04],
  },
  4: {
    bodyMs: 550,
    flameMs: 450,
    sideMs: 370,
    emberMs: 1300,
    lift: 16,
    shadow: 0.68,
    shadowOpacity: 0.14,
    scaleX: [1.06, 0.96],
    scaleY: [0.94, 1.05],
  },
} as const;

const CAR_MOTION = {
  1: { ...MOTION[1], bodyMs: 1800 },
  2: { ...MOTION[2], bodyMs: 900, emberMs: 2000, lift: 5 },
  3: {
    ...MOTION[3],
    bodyMs: 640,
    emberMs: 1400,
    lift: 7,
    scaleX: [1.03, 0.98],
    scaleY: [0.97, 1.03],
  },
  4: {
    ...MOTION[4],
    bodyMs: 500,
    emberMs: 1200,
    lift: 10,
    scaleX: [1.05, 0.97],
    scaleY: [0.95, 1.04],
  },
} as const;

export function useGogoFrenzyMotion(
  level: FeedFrenzyLevel,
  animated: boolean,
  inCar = false,
) {
  const body = useSharedValue(0);
  const flame = useSharedValue(0);
  const side = useSharedValue(0);
  const embers = useSharedValue(0);
  const shake = useSharedValue(0);
  const aura = useSharedValue(0);
  const blink = useSharedValue(0);
  const config = (inCar ? CAR_MOTION : MOTION)[level];

  useEffect(() => {
    const values = [body, flame, side, embers, shake, aura, blink];
    values.forEach(cancelAnimation);
    values.forEach((value) => {
      value.value = 0;
    });
    if (!animated) return;
    // Accessibility changes are handled by the caller, including re-enabling motion.
    const loop = (value: SharedValue<number>, duration: number) => {
      value.value = withRepeat(
        withTiming(1, { duration, easing: Easing.linear }),
        -1,
        false,
        undefined,
        ReduceMotion.Never,
      );
    };
    loop(body, config.bodyMs);
    loop(flame, config.flameMs);
    if (level === 1) loop(blink, 4600);
    if (level >= 2) loop(embers, config.emberMs);
    if (level >= 3) loop(side, config.sideMs);
    if (level === 4 && !inCar) {
      loop(shake, 180);
      loop(aura, 800);
    }
    return () => values.forEach(cancelAnimation);
  }, [
    animated,
    aura,
    blink,
    body,
    config,
    embers,
    flame,
    inCar,
    level,
    shake,
    side,
  ]);

  const bodyProps = useAnimatedProps<GProps>(
    () => {
      const landing = level >= 3 && !(inCar && level === 3);
      const frames = landing
        ? [0, 0.45, 0.7, 1]
        : [0, level >= 3 ? 0.45 : 0.5, 1];
      const y = animated
        ? interpolate(
            body.value,
            frames,
            landing
              ? [0, -config.lift, inCar ? -2 : -config.lift / 4, 0]
              : [0, -config.lift, 0],
          )
        : 0;
      const [startX, peakX] = config.scaleX;
      const [startY, peakY] = config.scaleY;
      const scaleX =
        !animated || level === 1
          ? 1
          : interpolate(
              body.value,
              frames,
              landing ? [startX, peakX, 1, startX] : [startX, peakX, startX],
            );
      const scaleY =
        !animated || level === 1
          ? 1
          : interpolate(
              body.value,
              frames,
              landing ? [startY, peakY, 1, startY] : [startY, peakY, startY],
            );
      const originX = inCar ? 200 : 100;
      return {
        transform: [
          scaleX,
          0,
          0,
          scaleY,
          originX * (1 - scaleX),
          200 * (1 - scaleY) + y,
        ],
      };
    },
    undefined,
    svgTransformAdapter,
  );
  const shadowProps = useAnimatedProps<GProps>(
    () => {
      const scale = animated
        ? interpolate(
            body.value,
            [0, level >= 3 ? 0.45 : 0.5, 1],
            [1, config.shadow, 1],
          )
        : 1;
      const opacity =
        animated && level >= 3
          ? interpolate(
              body.value,
              [0, 0.45, 1],
              [config.shadowOpacity, 0.06, config.shadowOpacity],
            )
          : config.shadowOpacity;
      return {
        transform: [scale, 0, 0, scale, 100 * (1 - scale), 207 * (1 - scale)],
        opacity,
      };
    },
    undefined,
    svgTransformAdapter,
  );
  const shakeProps = useAnimatedProps<GProps>(
    () => ({
      transform: [
        1,
        0,
        0,
        1,
        animated && level === 4
          ? interpolate(
              shake.value,
              [0, 0.25, 0.5, 0.75, 1],
              [0, 1.6, -1.4, 1, 0],
            )
          : 0,
        animated && level === 4
          ? interpolate(
              shake.value,
              [0, 0.25, 0.5, 0.75, 1],
              [0, -1, 1, 1.2, 0],
            )
          : 0,
      ],
    }),
    undefined,
    svgTransformAdapter,
  );
  const flameProps = useGogoFlameMotion(flame, level, animated);
  const sideProps = useGogoFlameMotion(side, level, animated);
  const leftArmProps = useArmMotion(body, level, animated, false);
  const rightArmProps = useArmMotion(body, level, animated, true);
  const leftStarProps = useStarMotion(body, 70, animated && level === 4);
  const rightStarProps = useStarMotion(body, 130, animated && level === 4);
  const eyeProps = useAnimatedProps<GProps>(
    () => {
      const scale =
        animated && level === 1
          ? interpolate(blink.value, [0, 0.93, 0.96, 1], [1, 1, 0.08, 1])
          : 1;
      return { transform: [1, 0, 0, scale, 0, 96 * (1 - scale)] };
    },
    undefined,
    svgTransformAdapter,
  );
  const auraProps = useAnimatedProps<GProps>(
    () => {
      const scale = animated
        ? interpolate(aura.value, [0, 0.5, 1], [1, 1.12, 1])
        : 1;
      return {
        transform: [scale, 0, 0, scale, 100 * (1 - scale), 60 * (1 - scale)],
        opacity: animated
          ? interpolate(aura.value, [0, 0.5, 1], [0.85, 1, 0.85])
          : 1,
      };
    },
    undefined,
    svgTransformAdapter,
  );
  return {
    bodyProps,
    shadowProps,
    shakeProps,
    flameProps,
    sideProps,
    leftArmProps,
    rightArmProps,
    leftStarProps,
    rightStarProps,
    eyeProps,
    auraProps,
    embers,
  };
}

export function useGogoFlameMotion(
  progress: SharedValue<number>,
  level: FeedFrenzyLevel,
  animated: boolean,
) {
  return useAnimatedProps<GProps>(
    () => {
      const frames = level === 1 ? [0, 0.3, 0.65, 1] : [0, 0.25, 0.55, 0.8, 1];
      const xValues =
        level === 1
          ? [1, 0.95, 1.04, 1]
          : level === 2
            ? [1, 0.93, 1.06, 0.97, 1]
            : level === 3
              ? [1, 0.9, 1.08, 0.95, 1]
              : [1, 0.88, 1.1, 0.94, 1];
      const yValues =
        level === 1
          ? [1, 1.07, 0.96, 1]
          : level === 2
            ? [1, 1.1, 0.94, 1.06, 1]
            : level === 3
              ? [1, 1.14, 0.92, 1.08, 1]
              : [1, 1.18, 0.9, 1.1, 1];
      const skewValues =
        level === 1
          ? [0, -3, 2, 0]
          : level === 2
            ? [0, -4, 3, -2, 0]
            : level === 3
              ? [0, -5, 4, -3, 0]
              : [0, -6, 5, -3, 0];
      const sx = animated ? interpolate(progress.value, frames, xValues) : 1;
      const sy = animated ? interpolate(progress.value, frames, yValues) : 1;
      const skew = animated
        ? sx *
          Math.tan(
            (interpolate(progress.value, frames, skewValues) * Math.PI) / 180,
          )
        : 0;
      return {
        transform: [sx, 0, skew, sy, 20 * (1 - sx) - 56 * skew, 56 * (1 - sy)],
      };
    },
    undefined,
    svgTransformAdapter,
  );
}
function useArmMotion(
  progress: SharedValue<number>,
  level: FeedFrenzyLevel,
  animated: boolean,
  right: boolean,
) {
  return useAnimatedProps<GProps>(
    () => {
      const angle =
        !animated || level === 1
          ? 0
          : interpolate(
              progress.value,
              [0, level >= 3 ? 0.45 : 0.5, 1],
              level === 2
                ? [4, -6, 4]
                : level === 3
                  ? [8, -12, 8]
                  : [10, -16, 10],
            );
      return {
        transform: rotationAt(
          right ? -angle : angle,
          right ? 172 : 28,
          level === 2 ? 126 : 124,
        ),
      };
    },
    undefined,
    svgTransformAdapter,
  );
}
function useStarMotion(
  progress: SharedValue<number>,
  x: number,
  animated: boolean,
) {
  return useAnimatedProps<GProps>(
    () => {
      const phase = animated
        ? interpolate(progress.value, [0, 0.5, 1], [0, 1, 0])
        : 0;
      const scale = 1 + 0.22 * phase;
      const rotation = rotationAt(12 * phase, x, 96);
      const a = rotation[0] * scale;
      const b = rotation[1] * scale;
      const c = rotation[2] * scale;
      const d = rotation[3] * scale;
      return {
        transform: [a, b, c, d, x - a * x - c * 96, 96 - b * x - d * 96],
      };
    },
    undefined,
    svgTransformAdapter,
  );
}

export function useGogoEmberMotion(
  progress: SharedValue<number>,
  offset: number,
  level: FeedFrenzyLevel,
  animated: boolean,
  inCar = false,
) {
  return useAnimatedProps<GProps>(
    () => {
      const phase = (progress.value + offset) % 1;
      const rise = level === 4 ? (inCar ? 60 : 62) : level === 3 ? 46 : 34;
      return {
        transform: [1, 0, 0, 1, 0, animated ? -rise * phase : 0],
        opacity: animated
          ? interpolate(phase, [0, level === 4 ? 0.12 : 0.15, 1], [0, 1, 0])
          : 1,
      };
    },
    undefined,
    svgTransformAdapter,
  );
}
