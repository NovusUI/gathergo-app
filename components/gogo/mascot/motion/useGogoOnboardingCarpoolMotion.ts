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
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import type { GProps, PathProps } from "react-native-svg";

function pulse(phase: number) {
  "worklet";
  return Easing.bezierFn(
    0.42,
    0,
    0.58,
    1,
  )(phase < 0.5 ? phase * 2 : (1 - phase) * 2);
}

export function useGogoOnboardingCarpoolMotion(animated: boolean) {
  const car = useSharedValue(0);
  const wave = useSharedValue(0);
  const wheels = useSharedValue(0);
  const road = useSharedValue(0);
  const route = useSharedValue(0);
  const pin = useSharedValue(0);
  const heart = useSharedValue(0);
  const sparkle = useSharedValue(0);
  const speed = useSharedValue(0);
  const blink = useSharedValue(0);

  useEffect(() => {
    const values = [
      car,
      wave,
      wheels,
      road,
      route,
      pin,
      heart,
      sparkle,
      speed,
      blink,
    ];
    values.forEach((value) => {
      cancelAnimation(value);
      value.value = 0;
    });
    if (!animated) return;

    const loop = (
      value: SharedValue<number>,
      duration: number,
      reverse = false,
    ) => {
      value.value = withRepeat(
        withTiming(1, {
          duration,
          easing: reverse ? Easing.bezier(0.42, 0, 0.58, 1) : Easing.linear,
        }),
        -1,
        reverse,
        undefined,
        ReduceMotion.Never,
      );
    };
    loop(car, 350, true);
    loop(wave, 700, true);
    loop(wheels, 500);
    loop(road, 400);
    loop(route, 1200);
    loop(pin, 1400);
    loop(heart, 1000);
    loop(sparkle, 2400);
    loop(speed, 700);
    loop(blink, 4400);
    return () => values.forEach(cancelAnimation);
  }, [
    animated,
    blink,
    car,
    heart,
    pin,
    road,
    route,
    sparkle,
    speed,
    wave,
    wheels,
  ]);

  const carProps = useAnimatedProps<GProps>(
    () => ({ transform: [1, 0, 0, 1, 0, animated ? -1.5 * car.value : 0] }),
    undefined,
    svgTransformAdapter,
  );
  const waveProps = useAnimatedProps<GProps>(
    () => ({
      transform: rotationAt(animated ? -8 + 18 * wave.value : 0, 172, 128),
    }),
    undefined,
    svgTransformAdapter,
  );
  const rearWheelProps = useAnimatedProps<GProps>(
    () => ({
      transform: rotationAt(animated ? 360 * wheels.value : 0, 84, 212),
    }),
    undefined,
    svgTransformAdapter,
  );
  const frontWheelProps = useAnimatedProps<GProps>(
    () => ({
      transform: rotationAt(animated ? 360 * wheels.value : 0, 218, 212),
    }),
    undefined,
    svgTransformAdapter,
  );
  const roadProps = useAnimatedProps<PathProps>(() => ({
    strokeDashoffset: animated ? -26 * road.value : 0,
  }));
  const routeProps = useAnimatedProps<PathProps>(() => ({
    strokeDashoffset: animated ? -20 * route.value : 0,
  }));
  const seatProps = useAnimatedProps<GProps>(() => ({
    opacity: animated ? 0.35 + 0.65 * pulse(route.value) : 1,
  }));
  const pinProps = useAnimatedProps<GProps>(
    () => ({
      transform: [1, 0, 0, 1, 0, animated ? -4 * pulse(pin.value) : 0],
    }),
    undefined,
    svgTransformAdapter,
  );
  const heartProps = useAnimatedProps<GProps>(
    () => {
      const scale = animated ? 1 + 0.2 * pulse(heart.value) : 1;
      return { transform: [scale, 0, 0, scale, 0, 1 - scale] };
    },
    undefined,
    svgTransformAdapter,
  );
  const eyeProps = useAnimatedProps<GProps>(
    () => {
      const scale = animated
        ? interpolate(blink.value, [0, 0.92, 0.95, 1], [1, 1, 0.08, 1])
        : 1;
      return { transform: [1, 0, 0, scale, 0, 96 * (1 - scale)] };
    },
    undefined,
    svgTransformAdapter,
  );
  return {
    carProps,
    waveProps,
    rearWheelProps,
    frontWheelProps,
    roadProps,
    routeProps,
    seatProps,
    pinProps,
    heartProps,
    eyeProps,
    sparkle,
    speed,
  };
}

export function useGogoOnboardingSparkle(
  progress: SharedValue<number>,
  delay: number,
  x: number,
  y: number,
  animated: boolean,
) {
  return useAnimatedProps<GProps>(
    () => {
      const amount = animated ? pulse((progress.value + delay / 2400) % 1) : 0;
      const scale = 1 - 0.4 * amount;
      const [a, b, c, d] = rotationAt(20 * amount, 0, 0);
      return {
        transform: [
          a * scale,
          b * scale,
          c * scale,
          d * scale,
          x - scale * (a * x + c * y),
          y - scale * (b * x + d * y),
        ],
        opacity: 1 - 0.4 * amount,
      };
    },
    undefined,
    svgTransformAdapter,
  );
}

export function useGogoOnboardingSpeed(
  progress: SharedValue<number>,
  delay: number,
  animated: boolean,
) {
  return useAnimatedProps<GProps>(
    () => {
      const phase = (progress.value + delay / 700) % 1;
      return {
        transform: [1, 0, 0, 1, animated ? 14 - 32 * phase : 0, 0],
        opacity: animated ? interpolate(phase, [0, 0.3, 1], [0, 1, 0]) : 1,
      };
    },
    undefined,
    svgTransformAdapter,
  );
}
