const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");
const { getFeedFrenzyLevel } = loadTypeScript("utils/feedFrenzy.ts");

const current = (intensity, updatedAt = "2026-10-21T12:00:00Z") => ({
  type: "CURRENT_FRENZY",
  metadata: { intensity },
  updatedAt,
});
test("live server frenzy levels select the four supplied poses", () => {
  assert.equal(getFeedFrenzyLevel([]), 1);
  assert.equal(getFeedFrenzyLevel([current("LOW")]), 2);
  assert.equal(getFeedFrenzyLevel([current("MEDIUM")]), 3);
  assert.equal(getFeedFrenzyLevel([current("HIGH")]), 4);
});
test("history and unrelated updates do not heat the button, and the latest current state wins", () => {
  const history = { ...current("HIGH"), type: "TICKET_FRENZY" };
  assert.equal(getFeedFrenzyLevel([history, { type: "DONATION_MADE" }]), 1);
  assert.equal(
    getFeedFrenzyLevel([
      current("HIGH", "2026-10-21T11:00:00Z"),
      history,
      current("LOW"),
    ]),
    2,
  );
});

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
function interpolate(value, inputs, outputs) {
  for (let i = 1; i < inputs.length; i++) {
    if (value <= inputs[i])
      return (
        outputs[i - 1] +
        ((value - inputs[i - 1]) / (inputs[i] - inputs[i - 1])) *
          (outputs[i] - outputs[i - 1])
      );
  }
  return outputs[outputs.length - 1];
}
let effects = [],
  shared = [],
  cancelled = [],
  timings = [];
const animationMock = {
  default: { createAnimatedComponent: () => "AnimatedGroup" },
  cancelAnimation: (value) => cancelled.push(value),
  createAnimatedPropAdapter: (adapter) => adapter,
  Easing: { linear: "linear" },
  ReduceMotion: { Never: "never" },
  interpolate,
  useAnimatedProps: (getter, _deps, adapter) => () => {
    const props = getter();
    adapter?.(props);
    return props;
  },
  useSharedValue: (value) => {
    const entry = { value };
    shared.push(entry);
    return entry;
  },
  withRepeat: (value, _count, _reverse, _callback, reduceMotion) => {
    assert.equal(reduceMotion, "never");
    return value;
  },
  withTiming: (value, config) => {
    timings.push(config.duration);
    return value;
  },
};
loadTypeScript("components/gogo/mascot/motion/svgMotion.ts", {
  "react-native": { Platform: { OS: "android" } },
  "react-native-reanimated": animationMock,
});
const motion = loadTypeScript("components/gogo/mascot/motion/useGogoFrenzyMotion.ts", {
  react: { useEffect: (effect) => effects.push(effect) },
  "react-native-reanimated": animationMock,
});
function resetMotion() {
  effects = [];
  shared = [];
  cancelled = [];
  timings = [];
}
test("higher heat makes Gogo hop higher and flames move faster, with loops cleaned up", () => {
  let lastLift = 0,
    lastFlameMs = Infinity;
  for (const level of [1, 2, 3, 4]) {
    resetMotion();
    const pose = motion.useGogoFrenzyMotion(level, true);
    const cleanup = effects[0]();
    assert.ok(timings[1] < lastFlameMs);
    lastFlameMs = timings[1];
    shared[0].value = level >= 3 ? 0.45 : 0.5;
    const matrix = pose.bodyProps().matrix;
    const lift = 200 - (matrix[3] * 200 + matrix[5]);
    assert.ok(lift > lastLift);
    lastLift = lift;
    cancelled = [];
    cleanup();
    assert.ok(shared.every((value) => cancelled.includes(value)));
  }
});
test("flames and raised arms stay attached to their anchors while animating", () => {
  resetMotion();
  const pose = motion.useGogoFrenzyMotion(4, true);
  shared[0].value = 0.45;
  shared[1].value = 0.25;
  for (const [matrix, x, y] of [
    [pose.flameProps().matrix, 20, 56],
    [pose.leftArmProps().matrix, 28, 124],
    [pose.rightArmProps().matrix, 172, 124],
    [pose.leftStarProps().matrix, 70, 96],
  ]) {
    assert.ok(Math.abs(matrix[0] * x + matrix[2] * y + matrix[4] - x) < 0.0001);
    assert.ok(Math.abs(matrix[1] * x + matrix[3] * y + matrix[5] - y) < 0.0001);
  }
});
test("Inferno's flame stays inside the artwork during its highest hop and widest flicker", () => {
  resetMotion();
  const pose = motion.useGogoFrenzyMotion(4, true);
  const apply = (matrix, [x, y]) => [
    matrix[0] * x + matrix[2] * y + matrix[4],
    matrix[1] * x + matrix[3] * y + matrix[5],
  ];
  for (const bodyPhase of [0, 0.45, 0.7, 1]) {
    for (const flamePhase of [0, 0.25, 0.55, 0.8, 1]) {
      shared[0].value = bodyPhase;
      shared[1].value = flamePhase;
      shared[4].value = 0.25;
      const [x, y] = apply(pose.flameProps().matrix, [20, 0]);
      const tip = apply(
        pose.shakeProps().matrix,
        apply(pose.bodyProps().matrix, [
          100 + (x - 20) * 1.7,
          9 + (y - 56) * 1.7,
        ]),
      );
      assert.ok(tip[1] >= -145);
      assert.ok(tip[0] >= -48 && tip[0] <= 248);
    }
  }
});

test("still frenzy poses do not start loops and embers stay visible without moving", () => {
  for (const level of [1, 2, 3, 4]) {
    resetMotion();
    const pose = motion.useGogoFrenzyMotion(level, false);
    effects[0]();
    assert.equal(timings.length, 0);
    assert.deepEqual(pose.bodyProps().matrix, [1, 0, 0, 1, 0, 0]);
    const ember = motion.useGogoEmberMotion(
      { value: 0.4 },
      0.2,
      level,
      false,
    )();
    assert.equal(ember.opacity, 1);
    assert.equal(ember.matrix[5], 0);
  }
  const progress = { value: 0.2 };
  const ember = motion.useGogoEmberMotion(progress, 0, 4, true);
  const firstY = ember().matrix[5];
  progress.value = 0.7;
  assert.ok(ember().matrix[5] < firstY);
});
const svgMock = {
  default: "Svg",
  Circle: "Circle",
  Ellipse: "Ellipse",
  G: "Group",
  Path: "Path",
  Rect: "Rect",
  Defs: "Defs",
  RadialGradient: "RadialGradient",
  Stop: "Stop",
};
const artworkParts = loadTypeScript("components/gogo/mascot/GogoArtworkParts.tsx", {
  "react-native-reanimated": animationMock,
  "react-native-svg": svgMock,
});
const { GogoFrenzyArtwork } = loadTypeScript(
  "components/gogo/mascot/GogoFrenzyArtwork.tsx",
  {
    "@/components/gogo/mascot/GogoArtworkParts": artworkParts,
    "@/components/gogo/mascot/motion/useGogoFrenzyMotion": motion,
    react: { useId: () => "test-aura" },
    "react-native-svg": svgMock,
  },
);
test("all frenzy poses retain Gogo's body and full flame view box, with star eyes only for inferno", () => {
  for (const level of [1, 2, 3, 4]) {
    resetMotion();
    const artwork = GogoFrenzyArtwork({ level, size: 66, animated: false });
    const content = [...nodes(artwork)];
    assert.equal(artwork.props.viewBox, "-48 -145 296 365");
    assert.ok(
      content.some(
        (node) => node.type === "Rect" && node.props.fill === "#1EEBC8",
      ),
    );
    assert.equal(
      content.filter(
        (node) => node.type === "Path" && node.props.fill === "#FF8A00",
      ).length,
      level === 4 ? 2 : 0,
    );
  }
});

let refs, refIndex, buttonEffects, nativeAnimations, reducedMotion;
class Value {
  constructor(value) {
    this.value = value;
  }
  setValue(value) {
    this.value = value;
  }
  stopAnimation(callback) {
    callback?.(this.value);
  }
  interpolate(config) {
    return {
      read: () =>
        interpolate(this.value, config.inputRange, config.outputRange),
    };
  }
}
class ValueXY extends Value {
  getTranslateTransform() {
    const position = this;
    return [
      {
        get translateX() {
          return position.value.x;
        },
      },
      {
        get translateY() {
          return position.value.y;
        },
      },
    ];
  }
}
function nativeAnimation(value, config) {
  const result = {
    started: false,
    stopped: false,
    start() {
      this.started = true;
      if (value) value.setValue(config.toValue);
    },
    stop() {
      this.stopped = true;
    },
  };
  nativeAnimations.push(result);
  return result;
}
const { default: FlameFeedButton } = loadTypeScript(
  "components/feed/FlameFeedButton.tsx",
  {
    "@expo/vector-icons": { Ionicons: "Icon" },
    "@/hooks/useReducedMotionPreference": {
      useReducedMotionPreference: () => reducedMotion,
    },
    "@/components/gogo/mascot/GogoFrenzyArtwork": { GogoFrenzyArtwork: "FrenzyArtwork" },
    "@/components/gogo/mascot/GogoCarFrenzyArtwork": { GogoCarFrenzyArtwork: "CarFrenzyArtwork" },
    "expo-haptics": {
      impactAsync: () => Promise.resolve(),
      ImpactFeedbackStyle: { Medium: "medium" },
    },
    react: {
      useCallback: (callback) => callback,
      useMemo: (factory) => factory(),
      useEffect: (effect) => buttonEffects.push(effect),
      useRef: (initial) => {
        const index = refIndex++;
        refs[index] ??= { current: initial };
        return refs[index];
      },
    },
    "react-native": {
      Animated: {
        Value,
        ValueXY,
        View: "AnimatedView",
        createAnimatedComponent: () => "Button",
        spring: nativeAnimation,
        timing: nativeAnimation,
        loop: () => nativeAnimation(),
        sequence: () => nativeAnimation(),
      },
      Easing: { linear: "linear" },
      PanResponder: { create: (handlers) => ({ panHandlers: handlers }) },
      Text: "Text",
      TouchableOpacity: "Touchable",
      View: "View",
      useWindowDimensions: () => ({ width: 390, height: 844 }),
    },
    twrnc: { default: () => ({}) },
  },
);
function renderButton(props, preference = false) {
  refs = [];
  refIndex = 0;
  buttonEffects = [];
  nativeAnimations = [];
  reducedMotion = preference;
  const tree = FlameFeedButton({
    unreadCount: 0,
    frenzyLevel: 1,
    onPress() {},
    ...props,
  });
  const cleanups = buttonEffects.map((effect) => effect());
  return {
    tree,
    content: [...nodes(tree)],
    cleanup: () => cleanups.forEach((cleanup) => cleanup?.()),
  };
}
test("feed button opens the feed and keeps heat separate from the unread badge", () => {
  let presses = 0;
  for (const unreadCount of [0, 120]) {
    const { content, cleanup } = renderButton({
      frenzyLevel: 4,
      unreadCount,
      onPress: () => presses++,
    });
    const button = content.find((node) => node.type === "Button");
    button.props.onPress();
    assert.equal(
      content.find((node) => node.type === "FrenzyArtwork").props.level,
      4,
    );
    assert.match(button.props.accessibilityValue.text, /Inferno/);
    assert.equal(
      content.some(
        (node) => node.type === "Text" && node.props.children === "99+",
      ),
      unreadCount > 99,
    );
    cleanup();
  }
  assert.equal(presses, 2);
});
test("reduced motion shows the still roadster without a separate car icon or loops", () => {
  const { content, cleanup } = renderButton(
    { supportsCarpool: true, unreadCount: 3 },
    true,
  );
  assert.equal(
    content.find((node) => node.type === "CarFrenzyArtwork").props.animated,
    false,
  );
  assert.equal(
    content.some((node) => node.type === "Icon"),
    false,
  );
  assert.equal(nativeAnimations.length, 0);
  cleanup();
});
test("dragging remains bounded and does not open the feed on release", () => {
  let presses = 0;
  const { tree, cleanup } = renderButton({ onPress: () => presses++ }, true);
  assert.equal(
    tree.props.onMoveShouldSetPanResponder(null, { dx: -10, dy: 0 }),
    true,
  );
  tree.props.onPanResponderGrant();
  tree.props.onPanResponderMove(null, { dx: -1000, dy: 5000 });
  tree.props.onPanResponderRelease();
  const transform = tree.props.style[1].transform;
  assert.equal(transform[0].translateX, 16);
  assert.equal(transform[1].translateY, 736);
  [...nodes(tree)].find((node) => node.type === "Button").props.onPress();
  assert.equal(presses, 0);
  cleanup();
});
test("opening the feed disables movement and mascot animation", () => {
  const { tree, content, cleanup } = renderButton({
    disabled: true,
    unreadCount: 4,
    supportsCarpool: true,
  });
  assert.equal(tree.props.pointerEvents, "none");
  assert.equal(
    tree.props.onMoveShouldSetPanResponder(null, { dx: 100, dy: 100 }),
    false,
  );
  assert.equal(
    content.find((node) => node.type === "Button").props.disabled,
    true,
  );
  assert.equal(
    content.find((node) => node.type === "CarFrenzyArtwork").props.animated,
    false,
  );
  assert.equal(nativeAnimations.length, 0);
  cleanup();
});

test("unread animation stops when the button unmounts", () => {
  const { cleanup } = renderButton({ supportsCarpool: true, unreadCount: 2 });
  const started = nativeAnimations.filter((animation) => animation.started);
  assert.ok(started.length > 0);
  cleanup();
  assert.ok(started.every((animation) => animation.stopped));
});

test("the feed button selects the matching standing or car artwork at every heat level", () => {
  for (const supportsCarpool of [false, true]) {
    for (const frenzyLevel of [1, 2, 3, 4]) {
      const { content, cleanup } = renderButton({
        supportsCarpool,
        frenzyLevel,
      });
      const artwork = content.find(
        (node) =>
          node.type ===
          (supportsCarpool ? "CarFrenzyArtwork" : "FrenzyArtwork"),
      );
      assert.equal(artwork.props.level, frenzyLevel);
      assert.equal(artwork.props.animated, true);
      assert.equal(
        content.some((node) => node.type === "Icon"),
        false,
      );
      cleanup();
    }
  }
});
