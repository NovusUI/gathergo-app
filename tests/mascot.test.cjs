const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");

function* nodes(node) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const child of node) yield* nodes(child);
    return;
  }
  yield node;
  if (typeof node.type === "function") {
    yield* nodes(node.type(node.props));
    return;
  }
  for (const child of [node.props?.children].flat(Infinity))
    yield* nodes(child);
}

let reducedMotion = false;
const wrapperEffects = [];
const { GatherGoMascot } = loadTypeScript("components/gogo/mascot/GatherGoMascot.tsx", {
  "@/hooks/useReducedMotionPreference": {
    useReducedMotionPreference: () => reducedMotion,
  },
  "@/components/gogo/mascot/GogoArtwork": { GogoArtwork: "Artwork" },
  "lucide-react-native": Object.fromEntries(
    [
      "CheckCircle2",
      "Clock3",
      "Heart",
      "ShieldCheck",
      "Sparkles",
      "XCircle",
    ].map((name) => [name, name]),
  ),
  react: { useEffect: (effect) => wrapperEffects.push(effect) },
  "react-native": { View: "View" },
  "react-native-reanimated": {
    default: { View: "AnimatedView" },
    cancelAnimation() {},
    Easing: { inOut: (value) => value, ease: "ease" },
    ReduceMotion: { Never: "never" },
    useAnimatedStyle: (getter) => getter(),
    useSharedValue: (value) => ({ value }),
    withSpring: (value) => value,
    withRepeat: (value) => value,
    withTiming: (value) => value,
  },
  twrnc: { default: () => ({}) },
});

test("the existing mascot states select the supplied Gogo poses", () => {
  reducedMotion = false;
  for (const [variant, pose] of Object.entries({
    idle: "wave",
    donation: "celebrate",
    success: "celebrate",
    pending: "base",
    verified: "celebrate",
    empty: "lost",
    error: "base",
  })) {
    const mascot = GatherGoMascot({ variant, size: 88 });
    const artwork = [...nodes(mascot)].find((node) => node.type === "Artwork");
    assert.equal(artwork.props.pose, pose);
    assert.equal(artwork.props.size, 88);
    assert.equal(artwork.props.animated, true);
  }
});

test("explicitly static and reduced-motion mascots stay visible and do not animate", () => {
  for (const [preference, animated] of [
    [false, false],
    [true, true],
  ]) {
    reducedMotion = preference;
    const mascot = GatherGoMascot({ variant: "success", animated });
    const content = [...nodes(mascot)];
    const artwork = content.find((node) => node.type === "Artwork");
    assert.equal(artwork.props.animated, false);
    const frame = content.find(
      (node) =>
        node.type === "AnimatedView" && node.props.children?.type === "Artwork",
    );
    assert.equal(frame.props.style.opacity, 1);
  }
  reducedMotion = false;
});

test("custom carpool badges are retained and can still be hidden", () => {
  const badge = { type: "RideIcon", props: {} };
  const mascot = GatherGoMascot({
    badgeContent: badge,
    palette: { badgeBg: "#123456" },
  });
  assert.ok([...nodes(mascot)].includes(badge));
  assert.equal(
    [
      ...nodes(GatherGoMascot({ badgeContent: badge, showBadge: false })),
    ].includes(badge),
    false,
  );
});

let preferenceState;
let systemPreference = false;
let preferenceEffect;
let preferenceListener;
let listenerRemoved;
let resolvePreference;
const { useReducedMotionPreference: readMotionPreference } = loadTypeScript(
  "hooks/useReducedMotionPreference.ts",
  {
    react: {
      useState: (initial) => {
        if (preferenceState === undefined) preferenceState = initial;
        return [
          preferenceState,
          (value) => {
            preferenceState = value;
          },
        ];
      },
      useEffect: (effect) => {
        preferenceEffect = effect;
      },
    },
    "react-native": {
      AccessibilityInfo: {
        isReduceMotionEnabled: () =>
          new Promise((resolve) => {
            resolvePreference = resolve;
          }),
        addEventListener: (name, listener) => {
          assert.equal(name, "reduceMotionChanged");
          preferenceListener = listener;
          return {
            remove: () => {
              listenerRemoved = true;
            },
          };
        },
      },
    },
    "react-native-reanimated": { useReducedMotion: () => systemPreference },
  },
);

test("motion preference refreshes the startup setting, follows changes and removes its listener", async () => {
  preferenceState = undefined;
  systemPreference = false;
  listenerRemoved = false;
  assert.equal(readMotionPreference(), false);
  const cleanup = preferenceEffect();
  resolvePreference(true);
  await Promise.resolve();
  assert.equal(readMotionPreference(), true);
  preferenceListener(false);
  assert.equal(readMotionPreference(), false);
  preferenceListener(true);
  assert.equal(readMotionPreference(), true);
  cleanup();
  assert.equal(listenerRemoved, true);
});

test("a pending motion snapshot cannot overwrite a live change or update after cleanup", async () => {
  preferenceState = undefined;
  systemPreference = false;
  readMotionPreference();
  const cleanup = preferenceEffect();
  preferenceListener(true);
  resolvePreference(false);
  await Promise.resolve();
  assert.equal(readMotionPreference(), true);
  cleanup();

  preferenceState = undefined;
  readMotionPreference();
  preferenceEffect()();
  resolvePreference(true);
  await Promise.resolve();
  assert.equal(readMotionPreference(), false);
});

let shared = [];
let motionEffects = [];
let cancelled = [];
let repeated = [];
function interpolate(value, inputs, outputs) {
  for (let index = 1; index < inputs.length; index++) {
    if (value <= inputs[index]) {
      const fraction =
        (value - inputs[index - 1]) / (inputs[index] - inputs[index - 1]);
      return (
        outputs[index - 1] + fraction * (outputs[index] - outputs[index - 1])
      );
    }
  }
  return outputs[outputs.length - 1];
}
const animationMock = {
  default: { createAnimatedComponent: () => "AnimatedGroup" },
  cancelAnimation: (value) => cancelled.push(value),
  createAnimatedPropAdapter: (adapter) => adapter,
  Easing: { linear: "linear", inOut: (value) => value, ease: "ease" },
  ReduceMotion: { Never: "never" },
  interpolate,
  useAnimatedProps: (getter, _deps, adapter) => () => {
    const props = getter();
    adapter?.(props);
    return props;
  },
  useSharedValue: (value) => {
    const sharedValue = { value };
    shared.push(sharedValue);
    return sharedValue;
  },
  withDelay: (_delay, value) => value,
  withRepeat: (value, _count, _reverse, _callback, reduceMotion) => {
    repeated.push({ value, reduceMotion });
    return value;
  },
  withSequence: (...values) => values[values.length - 1],
  withTiming: (value) => value,
};
loadTypeScript("components/gogo/mascot/motion/svgMotion.ts", {
  "react-native": { Platform: { OS: "ios" } },
  "react-native-reanimated": animationMock,
});
const motion = loadTypeScript("components/gogo/mascot/motion/useGogoMotion.ts", {
  react: { useEffect: (effect) => motionEffects.push(effect) },
  "react-native": { Platform: { OS: "ios" } },
  "react-native-reanimated": animationMock,
});
function resetMotion() {
  shared = [];
  motionEffects = [];
  cancelled = [];
  repeated = [];
}

test("Gogo waves around the hand attachment and celebrates with a rising bounce", () => {
  resetMotion();
  const wave = motion.useGogoMotion("wave", true);
  const firstArm = wave.rightArmProps().matrix;
  shared[1].value = 0.5;
  const secondArm = wave.rightArmProps().matrix;
  assert.notDeepEqual(secondArm, firstArm);
  for (const matrix of [firstArm, secondArm]) {
    assert.ok(
      Math.abs(matrix[0] * 172 + matrix[2] * 124 + matrix[4] - 172) < 0.0001,
    );
    assert.ok(
      Math.abs(matrix[1] * 172 + matrix[3] * 124 + matrix[5] - 124) < 0.0001,
    );
  }
  resetMotion();
  const celebration = motion.useGogoMotion("celebrate", true);
  shared[0].value = 0.45;
  const matrix = celebration.bodyProps().matrix;
  assert.ok(matrix[3] * 200 + matrix[5] < 200);
});

test("mascot loops are cleaned up and static poses never start them", () => {
  resetMotion();
  motion.useGogoMotion("celebrate", true);
  const cleanup = motionEffects[0]();
  assert.ok(repeated.length > 0);
  assert.ok(repeated.every((loop) => loop.reduceMotion === "never"));
  cancelled = [];
  cleanup();
  assert.ok(shared.every((value) => cancelled.includes(value)));
  resetMotion();
  const still = motion.useGogoMotion("celebrate", false);
  motionEffects[0]();
  assert.equal(repeated.length, 0);
  assert.deepEqual(still.bodyProps().matrix, [1, 0, 0, 1, 0, 0]);
  assert.deepEqual(still.rightArmProps().matrix, [1, 0, -0, 1, 0, 0]);
});

test("confetti falls while celebrating and is visible in a still pose", () => {
  const progress = { value: 0.2 };
  const falling = motion.useGogoConfetti(progress, 0, true);
  const first = falling().matrix[5];
  progress.value = 0.6;
  assert.ok(falling().matrix[5] > first);
  const still = motion.useGogoConfetti(progress, 0, false)();
  assert.equal(still.opacity, 1);
  assert.equal(still.matrix[5], 0);
});

const svgMock = {
  default: "Svg",
  Circle: "Circle",
  Ellipse: "Ellipse",
  G: "Group",
  Path: "Path",
  Rect: "Rect",
};
const artworkParts = loadTypeScript("components/gogo/mascot/GogoArtworkParts.tsx", {
  "react-native-reanimated": animationMock,
  "react-native-svg": svgMock,
});
const { GogoArtwork } = loadTypeScript("components/gogo/mascot/GogoArtwork.tsx", {
  "@/components/gogo/mascot/motion/useGogoMotion": motion,
  "@/components/gogo/mascot/GogoArtworkParts": artworkParts,
  "react-native-svg": svgMock,
});

test("all poses keep the supplied mint body, antenna and natural view box", () => {
  for (const pose of ["base", "wave", "celebrate", "lost"]) {
    resetMotion();
    const artwork = GogoArtwork({ pose, size: 120, animated: false });
    const content = [...nodes(artwork)];
    assert.equal(artwork.props.width, 120);
    assert.equal(
      artwork.props.viewBox,
      pose === "base" ? "0 0 200 220" : "-12 -4 224 228",
    );
    assert.ok(
      content.some(
        (node) =>
          node.type === "Rect" &&
          node.props.x === 26 &&
          node.props.fill === "#1EEBC8",
      ),
    );
    assert.ok(
      content.some(
        (node) =>
          node.type === "Circle" &&
          node.props.cy === 14 &&
          node.props.stroke === "#0FB898",
      ),
    );
  }
});
