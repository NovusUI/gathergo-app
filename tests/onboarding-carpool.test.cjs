const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");

let effects, shared, cancelled, repeats;
const { Easing } = loadTypeScript(
  "node_modules/react-native-reanimated/src/Easing.ts",
  {
    "./Bezier": loadTypeScript(
      "node_modules/react-native-reanimated/src/Bezier.ts",
      {
        "./errors": { ReanimatedError: Error },
      },
    ),
  },
);
const { rotationAt } = loadTypeScript("utils/svgMotion.ts", {
  "react-native": { Platform: { OS: "android" } },
  "react-native-reanimated": {
    createAnimatedPropAdapter: (adapter) => adapter,
  },
});
const {
  useGogoOnboardingCarpoolMotion,
  useGogoOnboardingSparkle,
  useGogoOnboardingSpeed,
} = loadTypeScript("hooks/useGogoOnboardingCarpoolMotion.ts", {
  react: { useEffect: (effect) => effects.push(effect) },
  "@/utils/svgMotion": { rotationAt, svgTransformAdapter: undefined },
  "react-native-reanimated": {
    Easing,
    ReduceMotion: { Never: "never" },
    cancelAnimation: (value) => cancelled.push(value),
    useSharedValue: (value) => {
      const result = { value };
      shared.push(result);
      return result;
    },
    useAnimatedProps: (updater) => updater,
    interpolate: loadTypeScript(
      "node_modules/react-native-reanimated/src/interpolation.ts",
      {
        "./errors": { ReanimatedError: Error },
      },
    ).interpolate,
    withTiming: (value, options) => ({ value, options }),
    withRepeat: (animation, count, reverse, callback, reduceMotion) => {
      repeats.push({ animation, count, reverse, reduceMotion });
      return animation;
    },
  },
});
function reset() {
  effects = [];
  shared = [];
  cancelled = [];
  repeats = [];
}
const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
function fixedPivot(matrix, x, y) {
  near(matrix[0] * x + matrix[2] * y + matrix[4], x);
  near(matrix[1] * x + matrix[3] * y + matrix[5], y);
}

test("carpool wheels spin in place, the ticket waves at its shoulder and the car bounces", () => {
  reset();
  const motion = useGogoOnboardingCarpoolMotion(true);
  const first = motion.waveProps().transform;
  shared[0].value = shared[1].value = shared[2].value = 0.5;
  assert.equal(motion.carProps().transform[5], -0.75);
  assert.notDeepEqual(motion.waveProps().transform, first);
  fixedPivot(motion.waveProps().transform, 172, 128);
  for (const [props, x] of [
    [motion.rearWheelProps, 84],
    [motion.frontWheelProps, 218],
  ]) {
    const matrix = props().transform;
    near(matrix[0], -1);
    fixedPivot(matrix, x, 212);
  }
});

test("route and road travel while the pin, spare seat and heart pulse and Gogo blinks", () => {
  reset();
  const motion = useGogoOnboardingCarpoolMotion(true);
  shared[3].value = shared[4].value = shared[5].value = shared[6].value = 0.5;
  assert.equal(motion.roadProps().strokeDashoffset, -13);
  assert.equal(motion.routeProps().strokeDashoffset, -10);
  near(motion.seatProps().opacity, 1);
  near(motion.pinProps().transform[5], -4);
  near(motion.heartProps().transform[0], 1.2);
  fixedPivot(motion.heartProps().transform, 0, 1);
  shared[9].value = 0.95;
  near(motion.eyeProps().transform[3], 0.08);
  fixedPivot(motion.eyeProps().transform, 100, 96);
  shared[9].value = 1;
  assert.equal(motion.eyeProps().transform[3], 1);
});

test("sparkles and speed lines retain the source's staggered timing", () => {
  const progress = { value: 0 };
  const sparkles = [
    [800, 268, 240],
    [1600, 66, 292],
  ].map(([delay, x, y]) =>
    useGogoOnboardingSparkle(progress, delay, x, y, true),
  );
  for (const [index, [x, y]] of [
    [268, 240],
    [66, 292],
  ].entries())
    fixedPivot(sparkles[index]().transform, x, y);
  const initial = sparkles[0]().transform;
  progress.value = 0.1;
  assert.notDeepEqual(sparkles[0]().transform, initial);
  progress.value = 0;
  const lines = [0, 230, 460].map((delay) =>
    useGogoOnboardingSpeed(progress, delay, true),
  );
  assert.equal(lines[0]().opacity, 0);
  assert.ok(lines[1]().opacity > 0);
  assert.notEqual(lines[1]().transform[4], lines[2]().transform[4]);
  progress.value = 0.3;
  near(lines[0]().opacity, 1);
  progress.value = 1;
  assert.equal(lines[0]().opacity, 0);
});

test("native carpool motion cancels every loop on leave and inactivity keeps a still pose", () => {
  reset();
  useGogoOnboardingCarpoolMotion(true);
  const cleanup = effects[0]();
  assert.equal(repeats.length, shared.length);
  assert.ok(
    repeats.every((loop) => loop.count === -1 && loop.reduceMotion === "never"),
  );
  assert.deepEqual(
    repeats.map((loop) => loop.animation.options.duration),
    [350, 700, 500, 400, 1200, 1400, 1000, 2400, 700, 4400],
  );
  cancelled = [];
  cleanup();
  assert.deepEqual(cancelled, shared);
  reset();
  const still = useGogoOnboardingCarpoolMotion(false);
  effects[0]();
  assert.equal(repeats.length, 0);
  // Even a pending UI-thread frame cannot move the inactive illustration.
  shared.forEach((value) => {
    value.value = 0.5;
  });
  for (const key of [
    "carProps",
    "waveProps",
    "rearWheelProps",
    "frontWheelProps",
    "pinProps",
    "heartProps",
    "eyeProps",
  ]) {
    still[key]().transform.forEach((value, index) =>
      near(value, [1, 0, 0, 1, 0, 0][index]),
    );
  }
  assert.equal(still.roadProps().strokeDashoffset, 0);
  assert.equal(still.routeProps().strokeDashoffset, 0);
  assert.equal(still.seatProps().opacity, 1);
  for (const props of [
    useGogoOnboardingSpeed(still.speed, 230, false),
    useGogoOnboardingSparkle(still.sparkle, 800, 268, 240, false),
  ]) {
    props().transform.forEach((value, index) =>
      near(value, [1, 0, 0, 1, 0, 0][index]),
    );
    assert.equal(props().opacity, 1);
  }
});
