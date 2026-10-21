const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");

let values = [],
  effects = [],
  cancelled = [],
  loops = [],
  timings = [];
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
const reanimated = {
  cancelAnimation: (value) => cancelled.push(value),
  createAnimatedPropAdapter: (adapter) => adapter,
  Easing,
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
  interpolate: (value, inputs, outputs) =>
    outputs[0] +
    ((value - inputs[0]) / (inputs[1] - inputs[0])) * (outputs[1] - outputs[0]),
  withRepeat: (animation, _count, _reverse, _callback, motion) => {
    loops.push({ animation, motion });
    return animation;
  },
  withTiming: (value, options) => {
    timings.push(options);
    return value;
  },
  withDelay: (_delay, animation) => animation,
  withSequence: (...animations) => animations.at(-1),
};
loadTypeScript("utils/svgMotion.ts", {
  "react-native": { Platform: { OS: "android" } },
  "react-native-reanimated": reanimated,
});
const { useGogoLoadingMotion, useGogoLoadingRing } = loadTypeScript(
  "hooks/useGogoLoadingMotion.ts",
  {
    react: { useEffect: (effect) => effects.push(effect) },
    "react-native-reanimated": reanimated,
  },
);

function reset() {
  values = [];
  effects = [];
  cancelled = [];
  loops = [];
  timings = [];
}
const point = (matrix, x, y) => [
  matrix[0] * x + matrix[2] * y + matrix[4],
  matrix[1] * x + matrix[3] * y + matrix[5],
];
const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test("the loading character bobs, spins, blinks and taps around the supplied SVG attachment points", () => {
  reset();
  const motion = useGogoLoadingMotion(true);
  values[0].value = 1;
  assert.deepEqual(point(motion.bodyProps().matrix, 100, 200), [100, 195]);
  assert.deepEqual(point(motion.shadowProps().matrix, 100, 207), [100, 207]);
  near(motion.shadowProps().opacity, 0.07);
  values[1].value = 0.25;
  const antenna = motion.antennaProps().matrix;
  assert.deepEqual(point(antenna, 100, 14), [100, 14]);
  const ringEdge = point(antenna, 109, 14);
  near(ringEdge[0], 100);
  near(ringEdge[1], 23);
  values[2].value = 0.08;
  assert.deepEqual(point(motion.eyeProps().matrix, 100, 96), [100, 96]);
  values[3].value = 1;
  assert.deepEqual(motion.pupilProps().matrix.slice(4), [6, -4]);
  values[4].value = 1;
  const armAnchor = point(motion.rightArmProps().matrix, 172, 128);
  near(armAnchor[0], 172);
  near(armAnchor[1], 128);
});

test("loading rings reach the same hop in sequence with 200 ms between them", () => {
  const progress = { value: 0 };
  const rings = [0, 200, 400].map((delay) =>
    useGogoLoadingRing(progress, delay, true),
  );
  for (let index = 0; index < rings.length; index++) {
    progress.value = 0.3 + (index * 200) / 1200;
    near(rings[index]().matrix[5], -14);
    near(rings[index]().opacity, 1);
    assert.ok(
      rings.filter((ring) => Math.abs(ring().matrix[5] + 14) < 1e-8).length ===
        1,
    );
  }
});

test("all loader loops stop on cleanup and disabled motion remains visible and still", () => {
  reset();
  useGogoLoadingMotion(true);
  const cleanup = effects[0]();
  assert.ok(loops.every((loop) => loop.motion === "never"));
  assert.ok(timings.some((timing) => timing.duration === 1200));
  cancelled = [];
  cleanup();
  assert.ok(values.every((value) => cancelled.includes(value)));
  reset();
  const motion = useGogoLoadingMotion(false);
  effects[0]();
  assert.equal(loops.length, 0);
  for (const props of [
    motion.bodyProps,
    motion.shadowProps,
    motion.antennaProps,
    motion.eyeProps,
    motion.pupilProps,
    motion.rightArmProps,
  ]) {
    props().matrix.forEach((value, index) =>
      near(value, [1, 0, 0, 1, 0, 0][index]),
    );
  }
  const ring = useGogoLoadingRing(motion.rings, 200, false)();
  assert.deepEqual(ring.matrix, [1, 0, 0, 1, 0, 0]);
  assert.equal(ring.opacity, 1);
});

let reducedMotion = false;
const loaderModule = loadTypeScript("components/ui/ImpactPageLoader.tsx", {
  "@/components/ui/GogoLoadingArtwork": { GogoLoadingArtwork: "Artwork" },
  "@/hooks/useReducedMotionPreference": {
    useReducedMotionPreference: () => reducedMotion,
  },
  "react-native": {
    View: "View",
    Text: "Text",
    StyleSheet: { create: (styles) => styles },
  },
  twrnc: { default: () => ({}) },
});
const ImpactPageLoader = loaderModule.default;
const { default: FullScreenLoader } = loadTypeScript(
  "components/ui/FullScreenLoader.tsx",
  {
    "@/components/ui/ImpactPageLoader": loaderModule,
  },
);

test("full-screen and compact loaders retain page text, accessibility and caller styles", () => {
  for (const compact of [true, false]) {
    for (const preference of [true, false]) {
      reducedMotion = preference;
      const style = { paddingTop: 42 };
      const loader = ImpactPageLoader({
        title: "Loading event",
        message: "Fetching details.",
        compact,
        style,
      });
      assert.equal(loader.props.accessibilityRole, "progressbar");
      assert.equal(
        loader.props.accessibilityLabel,
        "Loading event. Fetching details.",
      );
      assert.ok(loader.props.style.includes(style));
      const [artwork, title, message] = loader.props.children;
      assert.equal(artwork.props.width, compact ? 144 : 180);
      assert.equal(artwork.props.animated, !preference);
      assert.equal(title.props.children, "Loading event");
      assert.equal(message.props.children, "Fetching details.");
    }
  }
  const screen = FullScreenLoader({
    title: "Loading account",
    message: "Signing in.",
  });
  assert.equal(screen.type, ImpactPageLoader);
  assert.equal(screen.props.title, "Loading account");
  assert.equal(screen.props.message, "Signing in.");
});

const { useGogoSpinnerMotion } = loadTypeScript(
  "hooks/useGogoSpinnerMotion.ts",
  {
    react: { useEffect: (effect) => effects.push(effect) },
    "react-native-reanimated": reanimated,
  },
);

test("the small spinner rotates and pulses around its ring and face centres", () => {
  reset();
  const motion = useGogoSpinnerMotion(true);
  values[0].value = 0.25;
  const edge = point(motion.ringProps().matrix, 61, 32);
  near(edge[0], 32);
  near(edge[1], 61);
  values[1].value = 1;
  const face = motion.faceProps().matrix;
  near(face[0], 1.06);
  const anchor = point(face, 32, 34);
  near(anchor[0], 32);
  near(anchor[1], 34);
  values[2].value = 1;
  assert.deepEqual(motion.pupilProps().matrix.slice(4), [2, -1]);
});

test("small spinner loops cancel on unmount and reduced motion removes all movement", () => {
  reset();
  useGogoSpinnerMotion(true);
  const cleanup = effects[0]();
  assert.ok(timings.some((timing) => timing.duration === 1000));
  assert.ok(timings.some((timing) => timing.duration === 700));
  assert.ok(loops.every((loop) => loop.motion === "never"));
  cancelled = [];
  cleanup();
  assert.ok(values.every((value) => cancelled.includes(value)));
  reset();
  const motion = useGogoSpinnerMotion(false);
  effects[0]();
  assert.equal(loops.length, 0);
  for (const props of [motion.ringProps, motion.faceProps, motion.pupilProps]) {
    props().matrix.forEach((value, index) =>
      near(value, [1, 0, 0, 1, 0, 0][index]),
    );
  }
});

const appLoaderModule = loadTypeScript("components/ui/AppLoader.tsx", {
  "./GogoSpinnerArtwork": { GogoSpinnerArtwork: "SpinnerArtwork" },
  "@/hooks/useReducedMotionPreference": {
    useReducedMotionPreference: () => reducedMotion,
  },
  "react-native": { View: "View", StyleSheet: { create: (styles) => styles } },
});
const AppLoader = appLoaderModule.default;

test("small loaders preserve sizing, colours, layout props and accessible loading labels", () => {
  reducedMotion = false;
  for (const [size, expected] of [
    ["small", 24],
    ["large", 40],
    [18, 18],
  ]) {
    const style = { margin: 8 };
    const onLayout = () => {};
    const loader = AppLoader({
      size,
      style,
      onLayout,
      accessibilityLabel: "Saving role",
    });
    assert.equal(loader.props.children.props.size, expected);
    assert.equal(loader.props.children.props.ringColor, "#1EEBC8");
    assert.ok(loader.props.style.includes(style));
    assert.equal(loader.props.onLayout, onLayout);
    assert.equal(loader.props.accessibilityRole, "progressbar");
    assert.equal(loader.props.accessibilityLabel, "Saving role");
    assert.equal(loader.props.accessibilityState.busy, true);
  }
  assert.equal(
    AppLoader({ tone: "dark" }).props.children.props.ringColor,
    "#01082E",
  );
  assert.equal(
    AppLoader({ tone: "light" }).props.children.props.ringColor,
    "#FFFFFF",
  );
  assert.equal(
    AppLoader({ tone: "light", color: "#123456" }).props.children.props
      .ringColor,
    "#123456",
  );
});

test("stopped loaders preserve their space and reduced-motion Gogo stays visible", () => {
  reducedMotion = true;
  const active = AppLoader({});
  assert.equal(active.props.children.type, "SpinnerArtwork");
  assert.equal(active.props.children.props.animated, false);
  reducedMotion = false;
  const hidden = AppLoader({ animating: false, size: 28 });
  assert.equal(hidden.props.children.type, "View");
  assert.deepEqual(hidden.props.children.props.style, {
    width: 28,
    height: 28,
  });
  assert.equal(hidden.props.accessibilityState.busy, false);
  const visible = AppLoader({ animating: false, hidesWhenStopped: false });
  assert.equal(visible.props.children.type, "SpinnerArtwork");
  assert.equal(visible.props.children.props.animated, false);
});

const { default: AppRefreshControl, RefreshIndicator } = loadTypeScript(
  "components/ui/AppRefreshControl.tsx",
  {
    "./AppLoader": appLoaderModule,
    "react-native": {
      RefreshControl: "NativeRefreshControl",
      Platform: { OS: "android" },
      StyleSheet: { create: (styles) => styles },
    },
  },
);

test("refresh controls retain native callbacks and Android scroll children while Gogo reflects refreshing", () => {
  let requests = 0;
  const onRefresh = () => {
    requests++;
  };
  const children = { type: "NativeScrollView", props: {} };
  const style = { flex: 1 };
  const refresh = AppRefreshControl({
    refreshing: true,
    onRefresh,
    children,
    style,
    enabled: false,
  });
  assert.equal(refresh.type, "NativeRefreshControl");
  assert.equal(refresh.props.onRefresh, onRefresh);
  refresh.props.onRefresh();
  assert.equal(requests, 1);
  assert.equal(refresh.props.children, children);
  assert.equal(refresh.props.style, style);
  assert.equal(refresh.props.enabled, false);
  assert.equal(refresh.props.refreshing, true);
  assert.equal(refresh.props.tintColor, "transparent");
  assert.deepEqual(refresh.props.colors, ["transparent"]);
  assert.ok(
    refresh.props.progressViewOffset < -64,
    "native circle must stay above the viewport throughout its 64-point travel",
  );
  assert.equal(RefreshIndicator({ refreshing: false }), null);
  const indicator = RefreshIndicator({ refreshing: true });
  assert.equal(indicator.type, AppLoader);
  assert.equal(indicator.props.accessibilityLabel, "Refreshing");
});
