const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");
let effects = [],
  shared = [],
  cancelled = [],
  repeats = [];
const { Easing } = loadTypeScript(
  "node_modules/react-native-reanimated/src/Easing.ts",
  {
    "./Bezier": loadTypeScript(
      "node_modules/react-native-reanimated/src/Bezier.ts",
      { "./errors": { ReanimatedError: Error } },
    ),
  },
);
const { rotationAt } = loadTypeScript("components/gogo/mascot/motion/svgMotion.ts", {
  "react-native": { Platform: { OS: "android" } },
  "react-native-reanimated": {
    createAnimatedPropAdapter: (adapter) => adapter,
  },
});
const { useGogoComingSoonMotion, useGogoComingSoonCode } = loadTypeScript(
  "components/gogo/mascot/motion/useGogoComingSoonMotion.ts",
  {
    react: { useEffect: (effect) => effects.push(effect) },
    "@/components/gogo/mascot/motion/svgMotion": { rotationAt, svgTransformAdapter: undefined },
    "react-native-reanimated": {
      Easing,
      ReduceMotion: { Never: "never" },
      cancelAnimation: (value) => cancelled.push(value),
      useSharedValue: (value) => {
        const sharedValue = { value };
        shared.push(sharedValue);
        return sharedValue;
      },
      useAnimatedProps: (updater) => updater,
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
      withTiming: (value, options) => ({ value, options }),
      withRepeat: (animation, count, reverse, callback, reduceMotion) => {
        repeats.push({ animation, count, reverse, reduceMotion });
        return animation;
      },
      withDelay: (delay, animation) => ({ delay, animation }),
      withSequence: (...animations) => animations,
    },
  },
);
function reset() {
  effects = [];
  shared = [];
  cancelled = [];
  repeats = [];
}
const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
test("laptop typing alternates the hands around their original attachment points", () => {
  reset();
  const motion = useGogoComingSoonMotion(true);
  const first = motion.leftArmProps().transform;
  shared[1].value = 0.5;
  assert.notDeepEqual(motion.leftArmProps().transform, first);
  for (const [props, x] of [
    [motion.leftArmProps, 28],
    [motion.rightArmProps, 172],
  ]) {
    const matrix = props().transform;
    near(matrix[0] * x + matrix[2] * 128 + matrix[4], x);
    near(matrix[1] * x + matrix[3] * 128 + matrix[5], 128);
  }
  shared[0].value = 1;
  assert.equal(motion.bodyProps().transform[5], 2);
  shared[2].value = 1;
  assert.equal(motion.pupilProps().transform[4], 5);
  shared[5].value = 1;
  near(motion.antennaProps().transform[0], 1.2);
});
test("the supplied code symbols rise at staggered intervals", () => {
  const progress = { value: 0 };
  const symbols = [0, 900, 1700].map((delay) =>
    useGogoComingSoonCode(progress, delay, true),
  );
  assert.equal(symbols[0]().opacity, 0);
  assert.ok(symbols[1]().opacity > 0);
  assert.notEqual(symbols[1]().transform[5], symbols[2]().transform[5]);
  progress.value = 0.15;
  near(symbols[0]().opacity, 1);
  assert.ok(symbols[0]().transform[5] < 0);
});
test("coming-soon animation loops stop on unmount and reduced motion keeps a still pose", () => {
  reset();
  useGogoComingSoonMotion(true);
  const cleanup = effects[0]();
  assert.equal(repeats.length, 7);
  assert.ok(repeats.every((loop) => loop.reduceMotion === "never"));
  assert.ok(repeats.some((loop) => loop.animation.options?.duration === 2600));
  cancelled = [];
  cleanup();
  assert.ok(shared.every((value) => cancelled.includes(value)));
  reset();
  const still = useGogoComingSoonMotion(false);
  effects[0]();
  assert.equal(repeats.length, 0);
  for (const key of [
    "bodyProps",
    "leftArmProps",
    "rightArmProps",
    "eyeProps",
    "pupilProps",
    "antennaProps",
    "glowProps",
    "sweatProps",
  ]) {
    still[key]().transform.forEach((value, i) =>
      near(value, [1, 0, 0, 1, 0, 0][i]),
    );
  }
  assert.equal(still.sweatProps().opacity, 1);
  assert.equal(useGogoComingSoonCode(still.particles, 900, false)().opacity, 0);
});
function* nodes(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity))
    yield* nodes(child);
}
let reducedMotion = false;
const { MascotMoment } = loadTypeScript("components/gogo/mascot/MascotMoment.tsx", {
  "@/hooks/useReducedMotionPreference": {
    useReducedMotionPreference: () => reducedMotion,
  },
  "@/components/gogo/mascot/GogoComingSoonArtwork": { GogoComingSoonArtwork: "LaptopGogo" },
  "@/components/gogo/mascot/GatherGoMascot": { GatherGoMascot: "RegularGogo" },
  "@/components/gogo/mascot/MascotMessage": { MascotMessage: "Message" },
  react: { useEffect() {}, useRef: (current) => ({ current }) },
  "react-native": {
    View: "View",
    Text: "Text",
    Animated: {
      createAnimatedComponent: () => "AnimatedView",
      Value: class {
        interpolate() {
          return 0;
        }
      },
    },
  },
  twrnc: { default: () => ({}) },
});
test("coming-soon moments select laptop Gogo at page and card sizes and respect reduced motion", () => {
  for (const compact of [true, false]) {
    for (const preference of [true, false]) {
      reducedMotion = preference;
      const screen = MascotMoment({
        artwork: "comingSoon",
        layout: "stacked",
        compact,
        title: "Coming soon",
        message: "Getting ready",
      });
      const laptop = [...nodes(screen)].find(
        (node) => node.type === "LaptopGogo",
      );
      assert.equal(laptop.props.width, compact ? 160 : 220);
      assert.equal(laptop.props.animated, !preference);
      assert.equal(
        [...nodes(screen)].some((node) => node.type === "RegularGogo"),
        false,
      );
    }
  }
  const normal = MascotMoment({ title: "Hello", message: "Welcome" });
  assert.ok([...nodes(normal)].some((node) => node.type === "RegularGogo"));
});
const { default: CircleScreen } = loadTypeScript(
  "app/(app)/(tabs)/circle.tsx",
  {
    "@/components/CustomeTopBarNav": { default: "TopBar" },
    "@/components/gogo/mascot/MascotMoment": { MascotMoment: "Moment" },
    "@/utils/navigation": { useLockedRouter: () => ({ replace() {} }) },
    "react-native": { View: "View", ScrollView: "ScrollView" },
    twrnc: { default: () => ({}) },
  },
);
test("the Circle page uses the laptop artwork and retains its coming-soon message", () => {
  const moment = [...nodes(CircleScreen())].find(
    (node) => node.type === "Moment",
  );
  assert.equal(moment.props.artwork, "comingSoon");
  assert.equal(moment.props.title, "Your Circle is on its way");
});

test("plain Gogo guidance stays compact and displays its message without a badge", () => {
  const screen = MascotMoment({ layout: "plain", compact: true, typing: false, title: "Gogo", message: "Tap the ideas that fit." });
  const gogo = [...nodes(screen)].find(node => node.type === "RegularGogo");
  const message = [...nodes(screen)].find(node => node.type === "Message");
  assert.equal(gogo.props.size, 58);
  assert.equal(gogo.props.showBadge, false);
  assert.equal(message.props.animate, false);
  assert.equal(message.props.message, "Tap the ideas that fit.");
});
