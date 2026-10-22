const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");

let runtime;
const equalDeps = (a, b) =>
  a && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
const hooks = {
  useState(initial) {
    const i = runtime.cursor++;
    if (!(i in runtime.values))
      runtime.values[i] = typeof initial === "function" ? initial() : initial;
    return [
      runtime.values[i],
      (next) => {
        runtime.values[i] =
          typeof next === "function" ? next(runtime.values[i]) : next;
      },
    ];
  },
  useRef(initial) {
    return hooks.useState(() => ({ current: initial }))[0];
  },
  useCallback(fn, deps) {
    const i = runtime.cursor++;
    if (!equalDeps(runtime.values[i]?.deps, deps))
      runtime.values[i] = { fn, deps };
    return runtime.values[i].fn;
  },
  useEffect(fn, deps) {
    const i = runtime.cursor++;
    const previous = runtime.effects.get(i);
    if (!equalDeps(previous?.deps, deps))
      runtime.pending.push(() => {
        previous?.cleanup?.();
        runtime.effects.set(i, { deps, cleanup: fn() });
      });
  },
};
const native = {
  AppState: {
    currentState: "active",
    addEventListener: (_event, listener) => {
      runtime.appStateListener = listener;
      return {
        remove: () => {
          runtime.appStateListener = null;
        },
      };
    },
  },
  FlatList: "Pager",
  StatusBar: "StatusBar",
  View: "View",
  ScrollView: "ScrollView",
  StyleSheet: { create: (value) => value },
  useWindowDimensions: () => ({ width: 390, height: 844 }),
  Animated: {
    Text: "Heading",
    Value: class {
      constructor(value) {
        this.value = value;
      }
      setValue(value) {
        this.value = value;
      }
      interpolate(options) {
        return { value: this, ...options };
      }
    },
    timing: (value, options) => {
      const record = { value, options, started: false, stopped: false };
      runtime.animations.push(record);
      return {
        start() {
          record.started = true;
        },
        stop() {
          record.stopped = true;
        },
      };
    },
  },
  Easing: { out: (value) => value, cubic: "cubic" },
};
const motionPreference = {
  useReducedMotionPreference: () => runtime.reducedMotion,
};
const data = loadTypeScript("app/(auth)/onboarding/slides.ts");
const { default: Onboarding } = loadTypeScript(
  "app/(auth)/onboarding/index.tsx",
  {
    "@/components/buttons/CustomBtn1": { default: "Next" },
    "@/components/buttons/SkipOnboardingButton": { default: "Skip" },
    "@/components/ui/GogoWelcomeScreen": { default: "Welcome" },
    "@/hooks/useReducedMotionPreference": motionPreference,
    "@/store/onboarding": {
      useOnboardingStore: () => ({
        hasSeenWelcome: true,
        completeWelcome() {},
      }),
    },
    "@/utils/navigation": {
      useLockedRouter: () => ({
        replace: (route) => runtime.routes.push(route),
      }),
    },
    "expo-router": {
      useFocusEffect: (callback) =>
        hooks.useEffect(
          () => (runtime.focused ? callback() : undefined),
          [callback, runtime.focused],
        ),
    },
    react: hooks,
    "react-native": native,
    "react-native-safe-area-context": { SafeAreaView: "SafeArea" },
    "./Slide": { default: "Slide" },
    "./slides": data,
  },
);
const { default: Slide } = loadTypeScript("app/(auth)/onboarding/Slide.tsx", {
  "@/components/ui/GgCircleArtwork": { default: "Circle" },
  "@/components/ui/LocalSvgAsset": { default: "Artwork" },
  "@/components/ui/GogoOnboardingCarpoolArtwork": {
    GogoOnboardingCarpoolArtwork: "CarpoolArtwork",
  },
  "@/hooks/useReducedMotionPreference": motionPreference,
  react: hooks,
  "react-native": native,
});
function* nodes(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity))
    yield* nodes(child);
}
const find = (node, type) =>
  [...nodes(node)].find((child) => child.type === type);
function setup(t) {
  runtime = {
    cursor: 0,
    values: [],
    effects: new Map(),
    pending: [],
    timers: new Map(),
    now: 0,
    id: 0,
    focused: true,
    reducedMotion: false,
    appStateListener: null,
    scrolls: [],
    routes: [],
    animations: [],
  };
  t.mock.method(global, "setTimeout", (fn, delay) => {
    const id = ++runtime.id;
    runtime.timers.set(id, { fn, at: runtime.now + delay });
    return id;
  });
  t.mock.method(global, "clearTimeout", (id) => runtime.timers.delete(id));
  t.after(() => {
    for (const effect of runtime.effects.values()) effect.cleanup?.();
  });
  const scroll = { scrollToIndex: (options) => runtime.scrolls.push(options) };
  let props = { ...data.slides[0], active: true };
  let screen;
  let renderHeading = false;
  const render = () => {
    runtime.cursor = 0;
    runtime.pending = [];
    if (renderHeading) screen = Slide(props);
    else {
      const element = Onboarding();
      screen = element.type(element.props);
      find(screen, "Pager").props.ref.current = scroll;
    }
    runtime.pending.forEach((effect) => effect());
    return screen;
  };
  return {
    render,
    heading(next) {
      renderHeading = true;
      props = { ...props, ...next };
      return render();
    },
    advance(ms) {
      const target = runtime.now + ms;
      for (;;) {
        const next = [...runtime.timers.entries()].sort(
          (a, b) => a[1].at - b[1].at,
        )[0];
        if (!next || next[1].at > target) break;
        runtime.now = next[1].at;
        runtime.timers.delete(next[0]);
        next[1].fn();
        render();
      }
      runtime.now = target;
    },
  };
}
test("onboarding keeps the original illustration order with the requested copy", () => {
  assert.deepEqual(
    data.slides.map((slide) => slide.title),
    ["Make an Impact", "Go together", "Find your people"],
  );
  assert.deepEqual(
    data.slides.map((slide) => slide.artwork),
    ["onboarding1", "onboarding2", "ggcircle"],
  );
});
test("the next page appears after five seconds and the last page waits for Get started", (t) => {
  const ui = setup(t);
  ui.render();
  ui.advance(4999);
  assert.deepEqual(runtime.scrolls, []);
  ui.advance(1);
  assert.deepEqual(runtime.scrolls, [{ index: 1, animated: true }]);
  ui.advance(5000);
  assert.deepEqual(runtime.scrolls.at(-1), { index: 2, animated: true });
  ui.advance(10000);
  assert.equal(runtime.scrolls.length, 2);
  assert.deepEqual(runtime.routes, []);
  find(ui.render(), "Next").props.onPress();
  assert.deepEqual(runtime.routes, ["/login"]);
});
test("manual Next restarts the five-second interval", (t) => {
  const ui = setup(t);
  ui.render();
  ui.advance(4000);
  find(ui.render(), "Next").props.onPress();
  ui.render();
  ui.advance(4999);
  assert.equal(runtime.scrolls.length, 1);
  ui.advance(1);
  assert.deepEqual(runtime.scrolls.at(-1), { index: 2, animated: true });
});
test("dragging pauses automatic movement and a swipe gives the new slide five seconds", (t) => {
  const ui = setup(t);
  const screen = ui.render();
  ui.advance(4000);
  find(screen, "Pager").props.onScrollBeginDrag();
  ui.render();
  ui.advance(10000);
  assert.equal(runtime.scrolls.length, 0);
  find(ui.render(), "Pager").props.onMomentumScrollEnd({
    nativeEvent: { contentOffset: { x: 390 } },
  });
  ui.render();
  ui.advance(4999);
  assert.equal(runtime.scrolls.length, 0);
  ui.advance(1);
  assert.deepEqual(runtime.scrolls, [{ index: 2, animated: true }]);
});
test("automatic movement pauses while backgrounded or unfocused and cleans up on leave", (t) => {
  const ui = setup(t);
  ui.render();
  ui.advance(4000);
  runtime.appStateListener("background");
  ui.render();
  ui.advance(10000);
  assert.equal(runtime.scrolls.length, 0);
  runtime.appStateListener("active");
  ui.render();
  ui.advance(5000);
  assert.equal(runtime.scrolls.length, 1);
  runtime.focused = false;
  ui.render();
  ui.advance(10000);
  assert.equal(runtime.scrolls.length, 1);
  for (const effect of runtime.effects.values()) effect.cleanup?.();
  assert.equal(runtime.timers.size, 0);
  assert.equal(runtime.appStateListener, null);
});
test("reduced motion still advances after five seconds without a page animation", (t) => {
  const ui = setup(t);
  runtime.reducedMotion = true;
  ui.render();
  ui.advance(5000);
  assert.deepEqual(runtime.scrolls, [{ index: 1, animated: false }]);
});
test("headings fade and rise only when active and stop when a slide leaves", (t) => {
  const ui = setup(t);
  ui.heading({ active: false });
  assert.equal(runtime.animations.length, 0);
  let screen = ui.heading({ active: true });
  const animation = runtime.animations[0];
  assert.equal(animation.started, true);
  assert.equal(animation.options.duration, 600);
  assert.equal(animation.options.useNativeDriver, true);
  const heading = find(screen, "Heading");
  assert.deepEqual(
    heading.props.style[1].transform[0].translateY.outputRange,
    [14, 0],
  );
  ui.heading({ active: false });
  assert.equal(animation.stopped, true);
  screen = ui.heading({ active: true });
  assert.equal(runtime.animations.length, 2);
});
test("reduced motion shows headings immediately without a fade or movement", (t) => {
  const ui = setup(t);
  runtime.reducedMotion = true;
  const screen = ui.heading({ active: true });
  assert.equal(runtime.animations.length, 0);
  const style = find(screen, "Heading").props.style[1];
  assert.equal(style.opacity, 1);
  assert.deepEqual(style.transform, [{ translateY: 0 }]);
});

test("only Go together selects the native carpool and animation follows slide visibility and reduced motion", (t) => {
  const ui = setup(t);
  assert.ok(find(ui.heading({ ...data.slides[0], active: true }), "Artwork"));
  let screen = ui.heading({ ...data.slides[1], active: true });
  assert.equal(find(screen, "CarpoolArtwork").props.animated, true);
  screen = ui.heading({ active: false });
  assert.equal(find(screen, "CarpoolArtwork").props.animated, false);
  runtime.reducedMotion = true;
  screen = ui.heading({ active: true });
  assert.equal(find(screen, "CarpoolArtwork").props.animated, false);
  assert.ok(find(ui.heading({ ...data.slides[2], active: true }), "Circle"));
});
