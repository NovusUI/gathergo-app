const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");

let values = [],
  effects = [],
  cancelled = [],
  durations = [];
const animation = {
  cancelAnimation: (value) => cancelled.push(value),
  createAnimatedPropAdapter: (adapter) => adapter,
  Easing: { linear: "linear" },
  ReduceMotion: { Never: "never" },
  useSharedValue: (initial) => {
    const value = { value: initial };
    values.push(value);
    return value;
  },
  useAnimatedProps: (getter, _deps, adapter) => () => {
    const props = getter();
    adapter?.(props);
    return props;
  },
  withTiming: (value, { duration }) => {
    durations.push(duration);
    return value;
  },
  withRepeat: (value) => value,
  interpolate: (value, inputs, outputs) => {
    for (let i = 1; i < inputs.length; i++) {
      if (value <= inputs[i])
        return (
          outputs[i - 1] +
          ((value - inputs[i - 1]) / (inputs[i] - inputs[i - 1])) *
            (outputs[i] - outputs[i - 1])
        );
    }
    return outputs.at(-1);
  },
};
const react = { useEffect: (effect) => effects.push(effect) };
loadTypeScript("utils/svgMotion.ts", {
  "react-native": { Platform: { OS: "android" } },
  "react-native-reanimated": animation,
});
const frenzy = loadTypeScript("hooks/useGogoFrenzyMotion.ts", {
  react,
  "react-native-reanimated": animation,
});
const { useGogoCarMotion: createCarMotion } = loadTypeScript("hooks/useGogoCarMotion.ts", {
  react,
  "react-native-reanimated": animation,
  "@/hooks/useGogoFrenzyMotion": frenzy,
});
function reset() {
  values = [];
  effects = [];
  cancelled = [];
  durations = [];
}

test("wheel motion gets faster as heat rises and all car loops stop on cleanup", () => {
  let previous = Infinity;
  for (const level of [1, 2, 3, 4]) {
    reset();
    const car = createCarMotion(level, true);
    const cleanup = effects[0]();
    assert.ok(durations[3] < previous);
    previous = durations[3];
    values[3].value = 0.5;
    assert.equal(car.treadProps().strokeDashoffset, -8);
    cancelled = [];
    cleanup();
    assert.ok(values.every((value) => cancelled.includes(value)));
  }
});

test("rays expand around the car while fading and zoom keeps the tires grounded", () => {
  reset();
  const car = createCarMotion(4, true);
  const apply = (matrix, x, y) => [
    matrix[0] * x + matrix[2] * y + matrix[4],
    matrix[1] * x + matrix[3] * y + matrix[5],
  ];
  values[0].value = 0.1;
  const first = car.rayProps();
  values[0].value = 0.8;
  const second = car.rayProps();
  assert.ok(second.matrix[0] > first.matrix[0]);
  assert.ok(second.opacity < first.opacity);
  assert.deepEqual(apply(second.matrix, 200, 190), [200, 190]);
  values[1].value = 0.5;
  assert.deepEqual(apply(car.zoomProps().matrix, 200, 330), [200, 330]);
});

test("reduced-motion car artwork is stationary with visible headlights", () => {
  for (const level of [1, 2, 3, 4]) {
    reset();
    const car = createCarMotion(level, false);
    effects[0]();
    assert.equal(durations.length, 0);
    assert.deepEqual(car.zoomProps().matrix, [1, 0, 0, 1, 0, 0]);
    assert.equal(car.treadProps().strokeDashoffset, 0);
    assert.equal(car.glowProps().opacity, 1);
    assert.equal(car.rayProps().opacity, 1);
  }
});

test("the driving character hops around its car coordinate origin", () => {
  reset();
  const character = frenzy.useGogoFrenzyMotion(4, true, true);
  values[0].value = 0.45;
  const matrix = character.bodyProps().matrix;
  assert.equal(matrix[0] * 200 + matrix[4], 200);
  assert.equal(matrix[3] * 200 + matrix[5], 190);
});
