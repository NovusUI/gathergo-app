import type { FeedFrenzyLevel } from "@/constants/feedFrenzy";
import { useGogoFlameMotion } from "@/components/gogo/mascot/motion/useGogoFrenzyMotion";
import { svgTransformAdapter } from "@/components/gogo/mascot/motion/svgMotion";
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
import type { GProps, LineProps } from "react-native-svg";

const MOTION = {
  1: {
    raysMs: 1800,
    zoomMs: 1800,
    bounceMs: 900,
    treadMs: 1100,
    glowMs: 1200,
    rayStart: 0.8,
    rayEnd: 1.3,
    rayOpacity: 0.5,
    zoom: 1.012,
    bounce: 1.5,
    glowStart: 0.15,
    glowEnd: 0.3,
  },
  2: {
    raysMs: 1000,
    zoomMs: 900,
    bounceMs: 500,
    treadMs: 600,
    glowMs: 800,
    rayStart: 0.78,
    rayEnd: 1.35,
    rayOpacity: 0.8,
    zoom: 1.018,
    bounce: 2,
    glowStart: 0.2,
    glowEnd: 0.45,
  },
  3: {
    raysMs: 700,
    zoomMs: 640,
    bounceMs: 320,
    treadMs: 350,
    glowMs: 500,
    rayStart: 0.75,
    rayEnd: 1.35,
    rayOpacity: 0.9,
    zoom: 1.025,
    bounce: 3,
    glowStart: 0.25,
    glowEnd: 0.55,
  },
  4: {
    raysMs: 450,
    zoomMs: 500,
    bounceMs: 220,
    treadMs: 200,
    glowMs: 400,
    rayStart: 0.75,
    rayEnd: 1.45,
    rayOpacity: 1,
    zoom: 1.035,
    bounce: 4,
    glowStart: 0.35,
    glowEnd: 0.7,
  },
} as const;

export function useGogoCarMotion(level: FeedFrenzyLevel, animated: boolean) {
  const rays = useSharedValue(0);
  const zoom = useSharedValue(0);
  const bounce = useSharedValue(0);
  const tread = useSharedValue(0);
  const glow = useSharedValue(0);
  const shake = useSharedValue(0);
  const aura = useSharedValue(0);
  const tires = useSharedValue(0);
  const config = MOTION[level];
  useEffect(() => {
    const values = [rays, zoom, bounce, tread, glow, shake, aura, tires];
    values.forEach(cancelAnimation);
    values.forEach((value) => {
      value.value = 0;
    });
    if (!animated) return;
    const loop = (
      value: SharedValue<number>,
      duration: number,
      reverse = false,
    ) => {
      value.value = withRepeat(
        withTiming(1, { duration, easing: Easing.linear }),
        -1,
        reverse,
        undefined,
        ReduceMotion.Never,
      );
    };
    loop(rays, config.raysMs);
    loop(zoom, config.zoomMs);
    loop(bounce, config.bounceMs, true);
    loop(tread, config.treadMs);
    loop(glow, config.glowMs, true);
    if (level === 4) {
      loop(shake, 160);
      loop(aura, 800);
      loop(tires, 300);
    }
    return () => values.forEach(cancelAnimation);
  }, [
    animated,
    aura,
    bounce,
    config,
    glow,
    level,
    rays,
    shake,
    tires,
    tread,
    zoom,
  ]);
  const rayProps = useRayMotion(rays, level, 0, animated);
  const secondRayProps = useRayMotion(
    rays,
    level,
    level === 4 ? 0.22 / 0.45 : 0.5,
    animated,
  );
  const zoomProps = useAnimatedProps<GProps>(
    () => {
      const scale = animated
        ? interpolate(zoom.value, [0, 0.5, 1], [1, config.zoom, 1])
        : 1;
      return {
        transform: [scale, 0, 0, scale, 200 * (1 - scale), 330 * (1 - scale)],
      };
    },
    undefined,
    svgTransformAdapter,
  );
  const bounceProps = useAnimatedProps<GProps>(
    () => ({
      transform: [1, 0, 0, 1, 0, animated ? -config.bounce * bounce.value : 0],
    }),
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
              [0, 1.4, -1.4, 0.8, 0],
            )
          : 0,
        animated && level === 4
          ? interpolate(
              shake.value,
              [0, 0.25, 0.5, 0.75, 1],
              [0, -0.8, 0.8, 1.2, 0],
            )
          : 0,
      ],
    }),
    undefined,
    svgTransformAdapter,
  );
  const treadProps = useAnimatedProps<LineProps>(() => ({
    strokeDashoffset: animated ? -16 * tread.value : 0,
  }));
  const glowProps = useAnimatedProps<GProps>(() => ({
    opacity: animated
      ? interpolate(glow.value, [0, 1], [config.glowStart, config.glowEnd])
      : 1,
  }));
  const auraProps = useAnimatedProps<GProps>(
    () => {
      const scale = animated
        ? interpolate(aura.value, [0, 0.5, 1], [1, 1.1, 1])
        : 1;
      return {
        transform: [scale, 0, 0, scale, 200 * (1 - scale), 160 * (1 - scale)],
        opacity: animated
          ? interpolate(aura.value, [0, 0.5, 1], [0.85, 1, 0.85])
          : 1,
      };
    },
    undefined,
    svgTransformAdapter,
  );
  const tireProps = useGogoFlameMotion(tires, level, animated);
  return {
    rayProps,
    secondRayProps,
    zoomProps,
    bounceProps,
    shakeProps,
    treadProps,
    glowProps,
    auraProps,
    tireProps,
  };
}

function useRayMotion(
  progress: SharedValue<number>,
  level: FeedFrenzyLevel,
  offset: number,
  animated: boolean,
) {
  const config = MOTION[level];
  return useAnimatedProps<GProps>(
    () => {
      const phase = (progress.value + offset) % 1;
      const scale = animated
        ? interpolate(phase, [0, 1], [config.rayStart, config.rayEnd])
        : 1;
      return {
        transform: [scale, 0, 0, scale, 200 * (1 - scale), 190 * (1 - scale)],
        opacity: animated ? config.rayOpacity * (1 - phase) : 1,
      };
    },
    undefined,
    svgTransformAdapter,
  );
}
