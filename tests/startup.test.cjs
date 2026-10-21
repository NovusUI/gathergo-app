const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");

let effects = [],
  values = [],
  cancelled = [],
  completion;
const { Easing } = loadTypeScript(
  "node_modules/react-native-reanimated/src/Easing.ts",
  {
    "./Bezier": loadTypeScript(
      "node_modules/react-native-reanimated/src/Bezier.ts",
      { "./errors": { ReanimatedError: Error } },
    ),
  },
);
const animation = {
  Easing,
  ReduceMotion: { Never: "never" },
  cancelAnimation: (value) => cancelled.push(value),
  useSharedValue: (initial) => {
    const value = { value: initial };
    values.push(value);
    return value;
  },
  withTiming: (_value, options, onComplete) => {
    completion = { options, onComplete };
    return 0;
  },
  runOnJS: (fn) => fn,
};
const { useGogoStartupMotion, startupValue } = loadTypeScript(
  "hooks/useGogoStartupMotion.ts",
  {
    react: {
      useEffect: (effect) => effects.push(effect),
      useRef: (current) => ({ current }),
      useCallback: (fn) => fn,
    },
    "@/utils/svgMotion": {},
    "react-native-reanimated": animation,
  },
);
function resetMotion() {
  effects = [];
  values = [];
  cancelled = [];
  completion = undefined;
}
test("startup plays once for the supplied duration and signals only a completed animation", () => {
  resetMotion();
  let finished = 0;
  const progress = useGogoStartupMotion(true, () => finished++, true);
  const cleanup = effects[0]();
  assert.equal(progress.value, 0);
  assert.equal(completion.options.duration, 5600);
  assert.equal(completion.options.reduceMotion, "never");
  completion.onComplete(false);
  assert.equal(finished, 0);
  completion.onComplete(true);
  assert.equal(finished, 1);
  cleanup();
  assert.ok(cancelled.includes(progress));
});
test("startup does not advance before the native splash handoff", () => {
  resetMotion();
  let finished = false;
  useGogoStartupMotion(
    true,
    () => {
      finished = true;
    },
    false,
  );
  effects[0]();
  assert.equal(completion, undefined);
  assert.equal(finished, false);
});
test("reduced motion still waits for the native splash handoff", () => {
  resetMotion();
  let finished = false;
  useGogoStartupMotion(
    false,
    () => {
      finished = true;
    },
    false,
  );
  effects[0]();
  assert.equal(completion, undefined);
  assert.equal(finished, false);
});
test("reduced motion shows the complete pose and never waits for a timer", () => {
  resetMotion();
  let finished = false;
  const progress = useGogoStartupMotion(
    false,
    () => {
      finished = true;
    },
    true,
  );
  effects[0]();
  assert.equal(progress.value, 100);
  assert.equal(finished, true);
  assert.equal(completion, undefined);
});
test("the startup begins with rings and ends with visible Gogo instead of a blank frame", () => {
  assert.equal(startupValue("body", "opacity", 0, 1), 0);
  assert.equal(startupValue("ring1c", "dash", 20, 0), 0);
  assert.equal(startupValue("body", "opacity", 100, 1), 1);
  assert.equal(startupValue("body", "scale", 100, 1), 1);
  assert.equal(startupValue("pup1", "scale", 100, 1), 1);
  assert.equal(startupValue("mouth", "dash", 100, 0), 0);
});

let state = [],
  cursor = 0,
  layoutEffects = [],
  loading = false,
  hydrated = true,
  hidden = 0,
  fontsReady = true;
const hooks = {
  useState(initial) {
    const index = cursor++;
    if (!(index in state))
      state[index] = typeof initial === "function" ? initial() : initial;
    return [
      state[index],
      (next) => {
        state[index] = typeof next === "function" ? next(state[index]) : next;
      },
    ];
  },
  useEffect: (effect) => layoutEffects.push(effect),
  useCallback: (fn) => fn,
};
const dependencies = {
  "@/context/AuthContext": {
    AuthProvider: "AuthProvider",
    useAuth: () => ({ loading }),
  },
  "@/context/ConversationContext": {
    ConversationProvider: "ConversationProvider",
  },
  "@/context/NotificationContext": {
    NotificationProvider: "NotificationProvider",
  },
  "@/context/PushNotificationContext": {
    PushNotificationProvider: "PushNotificationProvider",
  },
  "@/context/SocketContext": { SocketProvider: "SocketProvider" },
  "@/navigators/RootNavigators": { default: "Navigator" },
  "@/components/ui/AppToast": { default: "Toast" },
  "@/components/ui/GogoStartupScreen": { default: "Startup" },
  "@/store/auth": { useAuthStore: () => ({ hasHydrated: hydrated }) },
  "@/utils/fonts": { applyUrbanistFontDefaults() {}, URBANIST_FONT_ASSETS: {} },
  "@gorhom/bottom-sheet": { BottomSheetModalProvider: "Sheets" },
  "@react-native-async-storage/async-storage": { default: {} },
  "@tanstack/query-async-storage-persister": {
    createAsyncStoragePersister: () => ({}),
  },
  "@tanstack/react-query": { QueryClient: class {} },
  "@tanstack/react-query-persist-client": {
    PersistQueryClientProvider: "Queries",
  },
  "expo-font": { useFonts: () => [fontsReady, null] },
  "expo-splash-screen": {
    preventAutoHideAsync() {},
    hideAsync: async () => {
      hidden++;
    },
  },
  react: hooks,
  "react-native-gesture-handler": { GestureHandlerRootView: "GestureRoot" },
  "react-native-paystack-webview": { PaystackProvider: "Payments" },
  "../global.css": {},
};
const { default: RootLayout } = loadTypeScript("app/_layout.tsx", dependencies);
function* nodes(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity))
    yield* nodes(child);
}
function resetLayout() {
  state = [];
  cursor = 0;
  layoutEffects = [];
  loading = false;
  hydrated = true;
  hidden = 0;
  fontsReady = true;
}
function appContent() {
  resetLayout();
  const Component = [...nodes(RootLayout())].find(
    (node) => node.type?.name === "AppContent",
  ).type;
  state = [];
  return () => {
    cursor = 0;
    layoutEffects = [];
    const screen = Component();
    layoutEffects.forEach((effect) => effect());
    return screen;
  };
}
test("native splash hides only after the startup screen lays out", () => {
  const render = appContent();
  const screen = render();
  assert.equal(screen.type, "Startup");
  assert.equal(hidden, 0);
  screen.props.onLayout();
  assert.equal(hidden, 1);
});
test("navigation waits for both the animation and sign-in restoration", () => {
  const render = appContent();
  loading = true;
  hydrated = false;
  let screen = render();
  screen.props.onComplete();
  assert.equal(render().type, "Startup");
  loading = false;
  assert.equal(render().type, "Startup");
  hydrated = true;
  render();
  screen = render();
  assert.equal(screen.type, "Sheets");
  assert.equal(screen.props.children.type, "Navigator");
});
test("subsequent auth loading does not replay the startup animation", () => {
  const render = appContent();
  render().props.onComplete();
  render();
  assert.equal(render().type, "Sheets");
  loading = true;
  assert.equal(render().type, "Sheets");
});
test("font loading keeps the native splash instead of revealing an unfinished app", () => {
  resetLayout();
  fontsReady = false;
  assert.equal(RootLayout(), null);
  assert.equal(hidden, 0);
});
