/* eslint-disable react-hooks/rules-of-hooks -- The harness drives the gesture hook through native events. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const React = require("react");
const { loadTypeScript } = require("./loadTypeScript.cjs");

let state, cursor, pendingEffects, cleanups, shared, springs, jsQueue, tasks;
let reducedMotion = false;
const hooks = {
  useRef(initial) {
    const index = cursor++;
    if (!(index in state)) state[index] = { current: initial };
    return state[index];
  },
  useState(initial) {
    const index = cursor++;
    if (!(index in state)) state[index] = initial;
    return [state[index], (value) => { state[index] = value; }];
  },
  useCallback: (fn) => fn,
  useMemo: (fn) => fn(),
  useEffect(effect, deps) {
    const index = cursor++;
    const previous = state[index];
    if (!previous || deps.some((value, i) => value !== previous[i])) {
      pendingEffects.push(() => {
        cleanups[index]?.();
        cleanups[index] = effect();
      });
    }
    state[index] = deps;
  },
};
class GestureDouble {
  constructor() { this.handlers = {}; this.config = {}; }
}
for (const name of ["enabled", "maxPointers", "manualActivation", "blocksExternalGesture"]) {
  GestureDouble.prototype[name] = function (value) { this.config[name] = value; return this; };
}
for (const name of ["onTouchesDown", "onTouchesMove", "onStart", "onUpdate", "onEnd", "onFinalize"]) {
  GestureDouble.prototype[name] = function (fn) { this.handlers[name] = fn; return this; };
}
const reanimated = {
  default: { View: "AnimatedView", ScrollView: "AnimatedScrollView" },
  useSharedValue(initial) {
    const ref = hooks.useRef({ value: initial });
    if (!shared.includes(ref.current)) shared.push(ref.current);
    return ref.current;
  },
  useAnimatedStyle: (getter) => getter,
  useDerivedValue: (getter) => ({ get value() { return getter(); } }),
  useAnimatedScrollHandler: (handler) => handler,
  cancelAnimation() {},
  withSpring(value, config) { springs.push({ value, ...config }); return value; },
  runOnUI: (fn) => fn,
  runOnJS: (fn) => (...args) => jsQueue.push(() => fn(...args)),
};
const { useGogoPullToRefresh } = loadTypeScript("hooks/useGogoPullToRefresh.ts", {
  react: hooks,
  "@/hooks/useReducedMotionPreference": { useReducedMotionPreference: () => reducedMotion },
  "react-native-gesture-handler": {
    Gesture: { Pan: () => new GestureDouble(), Native: () => new GestureDouble() },
  },
  "react-native-reanimated": reanimated,
});

function setup(onRefresh = async () => {}, onScroll) {
  state = []; cleanups = []; shared = []; springs = []; jsQueue = []; tasks = [];
  reducedMotion = false;
  let refreshing = false;
  const render = () => {
    cursor = 0; pendingEffects = [];
    const ui = useGogoPullToRefresh({ refreshing, onRefresh, onScroll });
    pendingEffects.forEach((effect) => effect());
    return ui;
  };
  return {
    render,
    setRefreshing(value) { refreshing = value; },
    flushJS() { while (jsQueue.length) tasks.push(jsQueue.shift()()); },
    async finish() { await Promise.all(tasks); },
    unmount() { cleanups.forEach((cleanup) => cleanup?.()); },
  };
}
const touch = (x, y, count = 1) => ({ numberOfTouches: count, allTouches: [{ absoluteX: x, absoluteY: y }] });
function start(ui, dy = 20, dx = 0, count = 1) {
  const gesture = ui.panGesture.handlers;
  let decision = "waiting";
  gesture.onTouchesDown(touch(100, 200));
  gesture.onTouchesMove(touch(100 + dx, 200 + dy, count), {
    activate() { decision = "active"; }, fail() { decision = "failed"; },
  });
  if (decision === "active") gesture.onStart({ translationY: dy });
  return decision;
}
function release(ui, success = true) {
  ui.panGesture.handlers.onEnd({}, success);
  ui.panGesture.handlers.onFinalize({}, success);
}

test("Gogo and the content follow the pull continuously; no data request starts while dragging", () => {
  let calls = 0;
  const harness = setup(async () => { calls++; });
  const ui = harness.render(); springs = [];
  assert.strictEqual(ui.panGesture.config.blocksExternalGesture, ui.scrollGesture);
  assert.equal(start(ui), "active");
  assert.equal(ui.contentStyle().transform[0].translateY, 0, "activation causes no jump");
  ui.panGesture.handlers.onUpdate({ translationY: 80 });
  assert.equal(ui.contentStyle().transform[0].translateY, 30);
  assert.equal(ui.revealStyle().height, 30);
  assert.equal(ui.pullProgress.value, 30 / 64);
  const halfPullScale = ui.artworkStyle().transform[0].scale;
  ui.panGesture.handlers.onUpdate({ translationY: 148 });
  assert.equal(ui.revealStyle().height, 64);
  assert.ok(ui.artworkStyle().transform[0].scale > halfPullScale);
  assert.equal(springs.length, 0, "dragging writes the visible position directly");
  assert.equal(calls, 0); assert.equal(jsQueue.length, 0);
  ui.panGesture.handlers.onUpdate({ translationY: 1000 });
  assert.equal(ui.revealStyle().height, 112, "long pulls meet resistance and stop extending");
});

test("short pulls and pulling back below the threshold settle without refreshing", () => {
  const harness = setup(); const ui = harness.render(); springs = [];
  for (const translation of [90, 148]) {
    start(ui); ui.panGesture.handlers.onUpdate({ translationY: translation });
    if (translation === 148) ui.panGesture.handlers.onUpdate({ translationY: 90 });
    release(ui);
    assert.equal(ui.revealStyle().height, 0);
    assert.equal(jsQueue.length, 0);
    assert.equal(springs.at(-1).overshootClamping, true);
  }
});

test("release past the threshold starts exactly one refresh and holds Gogo until it finishes", async () => {
  let resolve, calls = 0;
  const harness = setup(() => { calls++; return new Promise((done) => { resolve = done; }); });
  let ui = harness.render(); start(ui);
  ui.panGesture.handlers.onUpdate({ translationY: 150 }); release(ui);
  assert.equal(ui.revealStyle().height, 64);
  assert.equal(calls, 0);
  assert.equal(start(ui), "failed", "the UI thread locks before JS begins the request");
  harness.flushJS(); ui = harness.render();
  assert.equal(calls, 1); assert.equal(ui.busy, true);
  assert.equal(ui.panGesture.config.enabled, false);
  ui.refresh(); assert.equal(calls, 1, "accessibility refresh cannot overlap the active request");
  resolve(); await harness.finish(); ui = harness.render();
  assert.equal(ui.busy, false); assert.equal(ui.revealStyle().height, 0);
  assert.equal(start(ui), "active");
});

test("scrolling, horizontal swipes, taps, and multiple fingers keep native navigation", () => {
  const harness = setup(); const ui = harness.render();
  ui.scrollHandler({ nativeEvent: { contentOffset: { y: 300 } } });
  assert.equal(start(ui), "failed");
  ui.scrollHandler({ nativeEvent: { contentOffset: { y: 0 } } });
  const manager = { activate() { assert.fail("a swipe that started below the top cannot become refresh"); }, fail() {} };
  ui.panGesture.handlers.onTouchesMove(touch(100, 280), manager);
  assert.equal(start(ui, -30), "failed");
  assert.equal(start(ui, 12, 100), "failed");
  assert.equal(start(ui, 5), "waiting");
  assert.equal(start(ui, 20, 0, 2), "failed");
  assert.equal(ui.revealStyle().height, 0);
  assert.equal(jsQueue.length, 0);
  assert.equal(start(ui), "active", "a new pull at the top works even with short content");
});

test("cancelling a full pull never refreshes", () => {
  const harness = setup(); const ui = harness.render();
  start(ui); ui.panGesture.handlers.onUpdate({ translationY: 250 });
  release(ui, false);
  assert.equal(jsQueue.length, 0); assert.equal(ui.revealStyle().height, 0);
});

test("native scroll events still reach the virtualized list while tracking whether a pull can begin", () => {
  let received;
  const harness = setup(async () => {}, (event) => { received = event; });
  const ui = harness.render();
  const event = { nativeEvent: { contentOffset: { y: 120 } }, timeStamp: 42 };
  ui.scrollHandler(event);
  assert.strictEqual(received, event);
  assert.equal(start(ui), "failed");
});

test("external refresh state holds the indicator until both it and the requested work finish", async () => {
  const harness = setup(); let ui = harness.render();
  ui.refresh(); harness.setRefreshing(true); ui = harness.render();
  await harness.finish(); ui = harness.render();
  assert.equal(ui.busy, true); assert.equal(ui.revealStyle().height, 64);
  harness.setRefreshing(false); ui = harness.render();
  assert.equal(ui.busy, false); assert.equal(ui.revealStyle().height, 0);
});

test("an instant response unlocks the gesture even if React batches the pending state away", async () => {
  const harness = setup(); const ui = harness.render();
  start(ui); ui.panGesture.handlers.onUpdate({ translationY: 150 }); release(ui);
  harness.flushJS(); await harness.finish();
  const next = harness.render();
  assert.equal(next.revealStyle().height, 0, "completion commits even without a pending render");
  assert.equal(start(next), "active");
});

test("a failed request clears the indicator and allows retry while preserving the error", async () => {
  const error = Error("offline");
  const harness = setup(async () => { throw error; }); const ui = harness.render();
  start(ui); ui.panGesture.handlers.onUpdate({ translationY: 150 }); release(ui);
  harness.flushJS(); await assert.rejects(harness.finish(), error);
  const next = harness.render();
  assert.equal(next.busy, false); assert.equal(next.revealStyle().height, 0);
  assert.equal(start(next), "active");
});

test("reduced motion keeps Gogo still and settles without a spring", () => {
  const harness = setup(); reducedMotion = true;
  const ui = harness.render(); springs = [];
  start(ui); ui.panGesture.handlers.onUpdate({ translationY: 100 });
  assert.deepEqual(ui.artworkStyle().transform, [{ scale: 1 }, { rotate: "0deg" }]);
  release(ui); assert.equal(springs.length, 0); assert.equal(ui.revealStyle().height, 0);
});

test("unmounting during refresh does not write component state when the request completes", async () => {
  let resolve;
  const harness = setup(() => new Promise((done) => { resolve = done; }));
  const ui = harness.render(); ui.refresh(); harness.unmount();
  const requested = state[0];
  resolve(); await harness.finish();
  assert.equal(state[0], requested);
});

function* nodes(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child);
}
const styles = {
  contentStyle: { transform: [{ translateY: 24 }] },
  revealStyle: { height: 24 }, artworkStyle: { opacity: 1 },
  panGesture: {}, scrollGesture: {}, scrollHandler() {},
  pullProgress: { value: 0.5 },
};
let current, passed;
const refreshContext = { Provider: "RefreshProvider" };
const { default: GogoRefreshScrollView, RefreshIndicator } = loadTypeScript("components/ui/GogoRefreshScrollView.tsx", {
  "@/hooks/useGogoPullToRefresh": { useGogoPullToRefresh(props) { passed = props; return current; } },
  react: { ...React, createContext: () => refreshContext, useContext: () => current,
    forwardRef: (render) => Object.assign((props) => render(props, null), { render }) },
  "react-native": { View: "View", StyleSheet: { create: (value) => value } },
  "react-native-gesture-handler": { GestureDetector: "GestureDetector" },
  "react-native-reanimated": reanimated,
  "./AppLoader": { default: "AppLoader" },
});

test("the scroll component displays one drag-responsive Gogo and preserves content and scrolling props", () => {
  for (const busy of [false, true]) {
    const refresh = async () => {}; current = { ...styles, busy, refresh() {} };
    const tree = GogoRefreshScrollView({ refreshing: busy, onRefresh: refresh,
      children: React.createElement("RideContent"), keyboardShouldPersistTaps: "handled",
      style: { width: "100%" }, contentContainerStyle: { paddingBottom: 20 } });
    const all = [...nodes(tree), ...nodes(RefreshIndicator())]; const scroll = all.find((node) => node.type === "AnimatedScrollView");
    const loaders = all.filter((node) => node.type === "AppLoader");
    assert.equal(loaders.length, 1); assert.equal(loaders[0].props.animating, busy);
    assert.equal(loaders[0].props.hidesWhenStopped, false, "Gogo is visible during the drag before refreshing");
    assert.equal(loaders[0].props.pullProgress, current.pullProgress);
    assert.deepEqual(passed, { refreshing: busy, onRefresh: refresh, onScroll: undefined });
    assert.equal(scroll.props.bounces, false); assert.equal(scroll.props.overScrollMode, "never");
    assert.equal(scroll.props.refreshControl, undefined, "no second native spinner or competing pull gesture");
    assert.equal(scroll.props.keyboardShouldPersistTaps, "handled");
    assert.equal(scroll.props.onScroll, current.scrollHandler);
    assert.ok(all.some((node) => node.type === "RideContent"));
    assert.equal(scroll.props.contentContainerStyle[0].flexGrow, 1);
    assert.deepEqual(scroll.props.contentContainerStyle[1], { paddingBottom: 20 });
  }
});

test("screen readers can refresh and existing accessibility actions remain available", () => {
  let refreshes = 0, otherAction;
  current = { ...styles, busy: false, refresh() { refreshes++; } };
  const tree = GogoRefreshScrollView({ refreshing: false, onRefresh: async () => {},
    accessibilityActions: [{ name: "inspect", label: "Inspect ride" }],
    onAccessibilityAction: (event) => { otherAction = event.nativeEvent.actionName; } });
  const scroll = [...nodes(tree)].find((node) => node.type === "AnimatedScrollView");
  assert.deepEqual(scroll.props.accessibilityActions.map((action) => action.name), ["inspect", "refresh"]);
  scroll.props.onAccessibilityAction({ nativeEvent: { actionName: "refresh" } });
  scroll.props.onAccessibilityAction({ nativeEvent: { actionName: "inspect" } });
  assert.equal(refreshes, 1); assert.equal(otherAction, "inspect");
});

test("virtualized lists retain their scroll ref and inline indicators leave the profile header stationary", () => {
  current = { ...styles, busy: false, refresh() {} };
  const ref = { current: null };
  const children = React.createElement("ProfileContent");
  const tree = GogoRefreshScrollView.render({ refreshing: false, onRefresh() {}, inlineIndicator: true, children }, ref);
  const all = [...nodes(tree)];
  const scroll = all.find((node) => node.type === "AnimatedScrollView");
  assert.strictEqual(scroll.props.ref, ref);
  assert.strictEqual(scroll.props.children, children);
  assert.equal(all.some((node) => [node.props.style].flat().includes(current.contentStyle)), false);
  assert.equal(all.some((node) => node.type === RefreshIndicator), false, "the profile section owns its single inline indicator");
});
