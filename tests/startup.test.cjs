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
test("welcome animation plays once for the supplied duration and signals only a completed animation", () => {
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
test("welcome animation waits for its screen to lay out", () => {
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
test("reduced motion still waits for welcome layout", () => {
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
test("the welcome animation begins with rings and ends with visible Gogo instead of a blank frame", () => {
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
  onboardingHydrated = true,
  navigationReady = true,
  readyListener,
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
  useRef(initial) {
    return hooks.useState(() => ({ current: initial }))[0];
  },
  useEffect: (effect) => layoutEffects.push(effect),
  useCallback: (fn) => fn,
};
const navigation = {
  isReady: () => navigationReady,
  addListener: (event, listener) => {
    assert.equal(event, "ready");
    readyListener = listener;
    return () => {
      readyListener = undefined;
    };
  },
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
  "@/store/auth": { useAuthStore: () => ({ hasHydrated: hydrated }) },
  "@/store/onboarding": {
    useOnboardingStore: () => ({
      hasHydrated: onboardingHydrated,
      hydrate: async () => {},
    }),
  },
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
  "expo-router": { useNavigationContainerRef: () => navigation },
  "expo-splash-screen": {
    preventAutoHideAsync() {},
    hideAsync: async () => {
      hidden++;
    },
  },
  react: hooks,
  "react-native": { View: "View" },
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
  onboardingHydrated = true;
  navigationReady = true;
  readyListener = undefined;
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
    const cleanups = layoutEffects.map((effect) => effect());
    return { screen, cleanups };
  };
}
test("the native logo stays visible during font loading", () => {
  resetLayout();
  fontsReady = false;
  assert.equal(RootLayout(), null);
  assert.equal(hidden, 0);
});
test("the native logo stays visible until auth and welcome preferences are restored", () => {
  const render = appContent();
  loading = true;
  hydrated = false;
  onboardingHydrated = false;
  assert.equal(render().screen, null);
  loading = false;
  assert.equal(render().screen, null);
  hydrated = true;
  assert.equal(render().screen, null);
  onboardingHydrated = true;
  assert.equal(render().screen.type, "Sheets");
  assert.equal(hidden, 0);
});
test("the logo hands off directly to mounted navigation after layout", () => {
  const render = appContent();
  const { screen } = render();
  const content = screen.props.children;
  assert.equal(content.props.children.type, "Navigator");
  assert.equal(content.props.style.backgroundColor, "#01082E");
  assert.equal(hidden, 0);
  content.props.onLayout();
  render();
  assert.equal(hidden, 1);
});
test("layout alone cannot hide the native logo before navigation is ready", () => {
  const render = appContent();
  navigationReady = false;
  render().screen.props.children.props.onLayout();
  const { cleanups } = render();
  assert.equal(hidden, 0);
  navigationReady = true;
  readyListener();
  assert.equal(hidden, 1);
  cleanups
    .filter((fn) => typeof fn === "function")
    .forEach((cleanup) => cleanup());
  assert.equal(readyListener, undefined);
});

const stored = new Map();
let readCount = 0,
  readFailure,
  writeFailure;
const storage = {
  getItem: async (key) => {
    readCount++;
    if (readFailure) throw readFailure;
    return stored.get(key) ?? null;
  },
  setItem: async (key, value) => {
    if (writeFailure) throw writeFailure;
    stored.set(key, value);
  },
};
const { useOnboardingStore } = loadTypeScript("store/onboarding.ts", {
  "@react-native-async-storage/async-storage": { default: storage },
});
function resetWelcome() {
  stored.clear();
  readCount = 0;
  readFailure = undefined;
  writeFailure = undefined;
  useOnboardingStore.setState({ hasSeenWelcome: false, hasHydrated: false });
}
const onboardingRoutes = [];
let windowSize = { width: 390, height: 844 };
const slideData = loadTypeScript("app/(auth)/onboarding/slides.ts");
const { default: Onboarding } = loadTypeScript(
  "app/(auth)/onboarding/index.tsx",
  {
    "@/components/ui/GogoWelcomeScreen": { default: "Welcome" },
    "@/store/onboarding": {
      useOnboardingStore: () => useOnboardingStore.getState(),
    },
    "@/components/buttons/CustomBtn1": { default: "NextButton" },
    "@/components/buttons/SkipOnboardingButton": { default: "SkipButton" },
    "@/hooks/useReducedMotionPreference": {
      useReducedMotionPreference: () => reducedMotion,
    },
    "@/utils/navigation": {
      useLockedRouter: () => ({
        replace: (route) => onboardingRoutes.push(route),
      }),
    },
    "expo-router": { useFocusEffect() {} },
    react: hooks,
    "react-native": {
      AppState: {
        currentState: "active",
        addEventListener: () => ({ remove() {} }),
      },
      FlatList: "Pager",
      StatusBar: "StatusBar",
      View: "View",
      StyleSheet: { create: (value) => value },
      useWindowDimensions: () => windowSize,
    },
    "react-native-safe-area-context": { SafeAreaView: "SafeArea" },
    "./Slide": { default: "Slide" },
    "./slides": slideData,
  },
);
test("a first visit shows Gogo welcome, then Continue opens onboarding and persists it", async () => {
  resetWelcome();
  await useOnboardingStore.getState().hydrate();
  assert.equal(useOnboardingStore.getState().hasHydrated, true);
  const welcome = Onboarding();
  assert.equal(welcome.type, "Welcome");
  welcome.props.onContinue();
  assert.equal(Onboarding().type.name, "OnboardingSlides");
  assert.equal(stored.get("gathergo_welcome_seen"), "seen");
});
test("returning visits skip welcome, including after the store is recreated on relaunch", async () => {
  resetWelcome();
  useOnboardingStore.getState().completeWelcome();
  useOnboardingStore.setState({ hasSeenWelcome: false, hasHydrated: false });
  await useOnboardingStore.getState().hydrate();
  assert.equal(Onboarding().type.name, "OnboardingSlides");
  await useOnboardingStore.getState().hydrate();
  assert.equal(readCount, 1);
});
test("unavailable preference storage reports the error and allows the welcome flow", async () => {
  resetWelcome();
  readFailure = new Error("storage unavailable");
  writeFailure = readFailure;
  const errors = [];
  const previous = console.error;
  console.error = (...args) => errors.push(args);
  try {
    await useOnboardingStore.getState().hydrate();
    assert.equal(useOnboardingStore.getState().hasHydrated, true);
    const welcome = Onboarding();
    assert.equal(welcome.type, "Welcome");
    welcome.props.onContinue();
    await Promise.resolve();
    assert.equal(Onboarding().type.name, "OnboardingSlides");
    assert.equal(errors.length, 2);
    assert.equal(errors[0][1], readFailure);
    assert.equal(errors[1][1], writeFailure);
  } finally {
    console.error = previous;
  }
});

let reducedMotion = false,
  welcomeMotion;
const { default: GogoWelcomeScreen } = loadTypeScript(
  "components/ui/GogoWelcomeScreen.tsx",
  {
    "@/components/buttons/CustomBtn1": { default: "ContinueButton" },
    "@/components/buttons/SkipOnboardingButton": { default: "SkipButton" },
    "@/hooks/useReducedMotionPreference": {
      useReducedMotionPreference: () => reducedMotion,
    },
    "@/hooks/useGogoStartupMotion": {
      useGogoStartupMotion: (animated, onComplete, ready) => {
        welcomeMotion = { animated, onComplete, ready };
        return { value: animated ? 0 : 100 };
      },
    },
    react: hooks,
    "react-native": {
      View: "View",
      Text: "Text",
      ScrollView: "ScrollView",
      StatusBar: "StatusBar",
      StyleSheet: { create: (value) => value },
    },
    "react-native-safe-area-context": { SafeAreaView: "SafeArea" },
    "./GogoStartupArtwork": { GogoStartupArtwork: "Artwork" },
  },
);
test("the welcome uses navy throughout and Continue is available during the animation", () => {
  resetLayout();
  reducedMotion = false;
  let continued = 0;
  const render = () => {
    cursor = 0;
    return GogoWelcomeScreen({ onContinue: () => continued++, onSkip() {} });
  };
  let screen = render();
  assert.equal(screen.props.style.backgroundColor, "#01082E");
  assert.equal(welcomeMotion.ready, false);
  const content = [...nodes(screen)];
  assert.equal(
    content.find((node) => node.type === "StatusBar").props.barStyle,
    "light-content",
  );
  content.find((node) => node.props.onLayout).props.onLayout();
  screen = render();
  assert.equal(welcomeMotion.ready, true);
  assert.equal(welcomeMotion.animated, true);
  const button = [...nodes(screen)].find(
    (node) => node.type === "ContinueButton",
  );
  assert.notEqual(button.props.disabled, true);
  button.props.onPress();
  assert.equal(continued, 1);
});
test("the welcome respects reduced motion and leaves its Continue button available", () => {
  resetLayout();
  reducedMotion = true;
  const screen = GogoWelcomeScreen({ onContinue() {}, onSkip() {} });
  assert.equal(welcomeMotion.animated, false);
  assert.equal(
    [...nodes(screen)].find((node) => node.type === "Artwork").props.animated,
    false,
  );
  assert.ok([...nodes(screen)].find((node) => node.type === "ContinueButton"));
});

test("Skip from the Gogo welcome goes straight to login and remembers the welcome", () => {
  resetWelcome();
  onboardingRoutes.length = 0;
  const welcome = Onboarding();
  welcome.props.onSkip();
  assert.deepEqual(onboardingRoutes, ["/login"]);
  assert.equal(useOnboardingStore.getState().hasSeenWelcome, true);
  assert.equal(stored.get("gathergo_welcome_seen"), "seen");
});
function onboardingSlides() {
  resetLayout();
  resetWelcome();
  reducedMotion = false;
  windowSize = { width: 390, height: 844 };
  useOnboardingStore.getState().completeWelcome();
  onboardingRoutes.length = 0;
  const element = Onboarding();
  const scrolls = [];
  const render = () => {
    cursor = 0;
    const screen = element.type(element.props);
    [...nodes(screen)].find((node) => node.type === "Pager").props.ref.current =
      { scrollToIndex: (options) => scrolls.push(options) };
    return screen;
  };
  return { render, scrolls };
}
const findNode = (screen, type) =>
  [...nodes(screen)].find((node) => node.type === type);
function swipeTo(render, index) {
  findNode(render(), "Pager").props.onMomentumScrollEnd({
    nativeEvent: { contentOffset: { x: windowSize.width * index } },
  });
}
test("Skip remains available on every onboarding page and exits directly to login", () => {
  for (let page = 0; page < slideData.slides.length; page++) {
    const { render } = onboardingSlides();
    swipeTo(render, page);
    const screen = render();
    assert.ok(
      [...nodes(screen)].some(
        (node) => node.props.accessibilityLabel === `Page ${page + 1} of 3`,
      ),
    );
    findNode(screen, "SkipButton").props.onPress();
    assert.deepEqual(onboardingRoutes, ["/login"]);
  }
});
test("Next advances the slides and Get started finishes the flow", () => {
  const { render, scrolls } = onboardingSlides();
  for (let page = 0; page < 3; page++) {
    const button = findNode(render(), "NextButton");
    assert.equal(button.props.title, page === 2 ? "Get started" : "Next");
    button.props.onPress();
  }
  assert.deepEqual(scrolls, [
    { index: 1, animated: true },
    { index: 2, animated: true },
  ]);
  assert.deepEqual(onboardingRoutes, ["/login"]);
});
test("swiping updates the page controls, and resizing keeps the selected page", () => {
  const { render, scrolls } = onboardingSlides();
  swipeTo(render, 2);
  assert.equal(findNode(render(), "NextButton").props.title, "Get started");
  windowSize = { width: 320, height: 568 };
  const pager = findNode(render(), "Pager");
  assert.deepEqual(pager.props.getItemLayout(null, 2), {
    length: 320,
    offset: 640,
    index: 2,
  });
  pager.props.onLayout();
  assert.deepEqual(scrolls.at(-1), { index: 2, animated: false });
  assert.equal(
    pager.props.renderItem({ item: slideData.slides[2], index: 2 }).props.style
      .width,
    320,
  );
});
test("reduced motion changes pages without an animated scroll", () => {
  const { render, scrolls } = onboardingSlides();
  reducedMotion = true;
  findNode(render(), "NextButton").props.onPress();
  assert.deepEqual(scrolls, [{ index: 1, animated: false }]);
});
const { default: OnboardingSlide } = loadTypeScript(
  "app/(auth)/onboarding/Slide.tsx",
  {
    "@/components/ui/GgCircleArtwork": { default: "CircleArtwork" },
    "@/components/ui/LocalSvgAsset": { default: "Artwork" },
    "@/components/ui/GogoOnboardingCarpoolArtwork": {
      GogoOnboardingCarpoolArtwork: "CarpoolArtwork",
    },
    "@/hooks/useReducedMotionPreference": {
      useReducedMotionPreference: () => reducedMotion,
    },
    react: hooks,
    "react-native": {
      Animated: {
        Text: "Text",
        Value: class {
          interpolate() {
            return 0;
          }
        },
      },
      View: "View",
      Text: "Text",
      ScrollView: "ScrollView",
      StyleSheet: { create: (value) => value },
      useWindowDimensions: () => windowSize,
    },
  },
);
test("each onboarding slide contains only its illustration and short heading", () => {
  for (const height of [568, 844]) {
    windowSize = { width: 320, height };
    for (const slide of slideData.slides) {
      const screen = OnboardingSlide({ ...slide, active: true });
      assert.equal(screen.type, "ScrollView");
      const text = [...nodes(screen)].filter((node) => node.type === "Text");
      assert.equal(text.length, 1);
      assert.equal(text[0].props.children, slide.title);
      assert.equal(text[0].props.accessibilityRole, "header");
      const artwork = [...nodes(screen)].find((node) =>
        ["Artwork", "CircleArtwork", "CarpoolArtwork"].includes(node.type),
      );
      assert.equal(artwork.props.width, height < 760 ? 220 : 280);
    }
  }
});
test("the Gogo welcome copy is just Impact begins here and retains its Skip control", () => {
  resetLayout();
  let skipped = 0;
  const screen = GogoWelcomeScreen({
    onContinue() {},
    onSkip: () => skipped++,
  });
  const text = [...nodes(screen)].filter((node) => node.type === "Text");
  assert.equal(text.length, 1);
  assert.equal(text[0].props.children, "Impact begins here");
  findNode(screen, "SkipButton").props.onPress();
  assert.equal(skipped, 1);
});
const { default: SkipOnboardingButton } = loadTypeScript(
  "components/buttons/SkipOnboardingButton.tsx",
  {
    "@/hooks/usePressGuard": { usePressGuard: (fn) => fn },
    "react-native": {
      TouchableOpacity: "Button",
      Text: "Text",
      StyleSheet: { create: (value) => value },
    },
  },
);
test("the shared Skip control is labelled for accessibility and is easy to tap", () => {
  let pressed = 0;
  const button = SkipOnboardingButton({ onPress: () => pressed++ });
  assert.equal(button.props.accessibilityLabel, "Skip onboarding");
  assert.equal(button.props.accessibilityRole, "button");
  assert.ok(button.props.style.minHeight >= 44);
  button.props.onPress();
  assert.equal(pressed, 1);
});
