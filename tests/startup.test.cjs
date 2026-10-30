const assert = require("node:assert/strict");
const { after, test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");
const appConfig = require("../app.json").expo;
const { APP_LAUNCH_BACKGROUND, APP_LAUNCH_LOGO_SIZE } = loadTypeScript(
  "constants/appLaunch.ts",
);

const { default: AppLaunchScreen } = loadTypeScript(
  "components/ui/AppLaunchScreen.tsx",
  {
    "react-native": {
      Image: "Logo",
      StatusBar: "StatusBar",
      StyleSheet: { create: (styles) => styles },
      View: "View",
    },
    "../../assets/images/gglogo.png": "app-logo",
  },
);
test("native splash and startup loading use the same app logo on navy", () => {
  const splash = appConfig.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === "expo-splash-screen",
  )[1];
  assert.equal(splash.image, appConfig.icon);
  assert.equal(splash.image, "./assets/images/gglogo.png");
  assert.equal(splash.imageWidth, APP_LAUNCH_LOGO_SIZE);
  assert.equal(splash.resizeMode, "contain");
  assert.equal(APP_LAUNCH_BACKGROUND, "#01082E");
  assert.equal(splash.backgroundColor, APP_LAUNCH_BACKGROUND);
  const screen = AppLaunchScreen();
  assert.equal(screen.props.style.backgroundColor, APP_LAUNCH_BACKGROUND);
  assert.equal(screen.props.style.alignItems, "center");
  assert.equal(screen.props.style.justifyContent, "center");
  assert.equal(screen.props.accessibilityState.busy, true);
  const logo = [...nodes(screen)].find((node) => node.type === "Logo");
  assert.equal(logo.props.source, "app-logo");
  assert.deepEqual(logo.props.style, {
    width: APP_LAUNCH_LOGO_SIZE,
    height: APP_LAUNCH_LOGO_SIZE,
  });
  assert.equal(logo.props.resizeMode, "contain");
  assert.equal(
    [...nodes(screen)].find((node) => node.type === "StatusBar").props
      .backgroundColor,
    APP_LAUNCH_BACKGROUND,
  );
});

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
  "components/gogo/mascot/motion/useGogoStartupMotion.ts",
  {
    react: {
      useEffect: (effect) => effects.push(effect),
      useRef: (current) => ({ current }),
      useCallback: (fn) => fn,
    },
    "@/components/gogo/mascot/motion/svgMotion": {},
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
  appearanceHydrated = true,
  appearanceSetting = "dark",
  appliedSchemes = [],
  navigationReady = true,
  currentRoute,
  readyListener,
  stateListener,
  hidden = 0,
  fontsReady = true;
const frames = new Map();
let nextFrame = 0;
const originalRequestAnimationFrame = global.requestAnimationFrame;
const originalCancelAnimationFrame = global.cancelAnimationFrame;
global.requestAnimationFrame = (callback) => {
  const id = ++nextFrame;
  frames.set(id, callback);
  return id;
};
global.cancelAnimationFrame = (id) => frames.delete(id);
after(() => {
  global.requestAnimationFrame = originalRequestAnimationFrame;
  global.cancelAnimationFrame = originalCancelAnimationFrame;
});
function paintFrame() {
  const callbacks = [...frames.values()];
  frames.clear();
  callbacks.forEach((callback) => callback(0));
}
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
  getCurrentRoute: () => currentRoute,
  addListener: (event, listener) => {
    assert.ok(event === "ready" || event === "state");
    if (event === "ready") readyListener = listener;
    else stateListener = listener;
    return () => {
      if (event === "ready") readyListener = undefined;
      else stateListener = undefined;
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
  "@/store/appearance": {
    useAppearanceStore: selector => {
      const current = { mode: appearanceSetting, hasHydrated: appearanceHydrated, hydrate: async () => {} };
      return selector ? selector(current) : current;
    },
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
  "react-native": { View: "View", StatusBar: "StatusBar", Platform: { OS: "ios" }, Appearance: { setColorScheme: value => appliedSchemes.push(value) } },
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
  appearanceHydrated = true;
  appearanceSetting = "dark";
  appliedSchemes = [];
  navigationReady = true;
  currentRoute = { key: "onboarding", name: "onboarding/index" };
  readyListener = undefined;
  stateListener = undefined;
  hidden = 0;
  fontsReady = true;
  frames.clear();
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
test("the post-splash native window and app shell match the navy screens", () => {
  resetLayout();
  assert.equal(appConfig.backgroundColor, "#01082E");
  assert.equal(
    RootLayout().props.style.backgroundColor,
    appConfig.backgroundColor,
  );
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
test("the logo waits for the destination render frame after layout", () => {
  const render = appContent();
  const { screen } = render();
  const content = screen.props.children;
  assert.equal(content.props.children.type, "Navigator");
  assert.equal(content.props.style.backgroundColor, "#01082E");
  assert.equal(hidden, 0);
  content.props.onLayout();
  render();
  assert.equal(hidden, 0);
  paintFrame();
  assert.equal(hidden, 1);
});
test("startup waits for the saved app appearance before exposing the first screen", () => {
  const render = appContent();
  appearanceHydrated = false;
  assert.equal(render().screen, null);
  appearanceHydrated = true;
  assert.equal(render().screen.type, "Sheets");
});
test("layout alone cannot hide the native logo before navigation is ready", () => {
  const render = appContent();
  navigationReady = false;
  render().screen.props.children.props.onLayout();
  const { cleanups } = render();
  assert.equal(hidden, 0);
  navigationReady = true;
  readyListener();
  assert.equal(hidden, 0);
  paintFrame();
  assert.equal(hidden, 1);
  cleanups
    .filter((fn) => typeof fn === "function")
    .forEach((cleanup) => cleanup());
  assert.equal(readyListener, undefined);
  assert.equal(stateListener, undefined);
});
test("navigation readiness cannot expose an empty route group during a redirect", () => {
  const render = appContent();
  currentRoute = undefined;
  render().screen.props.children.props.onLayout();
  render();
  for (const name of [undefined, "(app)", "(auth)", "(tabs)"]) {
    currentRoute = name ? { key: name, name } : undefined;
    stateListener();
    paintFrame();
    assert.equal(hidden, 0);
  }
  currentRoute = { key: "onboarding", name: "onboarding/index" };
  stateListener();
  assert.equal(hidden, 0);
  paintFrame();
  assert.equal(hidden, 1);
});
test("startup can finish on onboarding, home, profile setup, preferences or a deep link", () => {
  for (const name of [
    "onboarding/index",
    "index",
    "profile-setup/index",
    "preference/index",
    "event/[id]",
    "carpool/[id]",
  ]) {
    const render = appContent();
    currentRoute = { key: name, name };
    render().screen.props.children.props.onLayout();
    render();
    paintFrame();
    assert.equal(hidden, 1, name);
  }
});
test("a redirect before the pending frame keeps the logo visible", () => {
  const render = appContent();
  render().screen.props.children.props.onLayout();
  render();
  currentRoute = { key: "auth", name: "(auth)" };
  stateListener();
  paintFrame();
  assert.equal(hidden, 0);
  currentRoute = { key: "onboarding", name: "onboarding/index" };
  stateListener();
  paintFrame();
  assert.equal(hidden, 1);
});
test("unmounting cancels pending splash dismissal and navigation listeners", () => {
  const render = appContent();
  render().screen.props.children.props.onLayout();
  const { cleanups } = render();
  cleanups
    .filter((cleanup) => typeof cleanup === "function")
    .forEach((cleanup) => cleanup());
  paintFrame();
  assert.equal(hidden, 0);
  assert.equal(readyListener, undefined);
  assert.equal(stateListener, undefined);
});
test("later navigation does not dismiss the launch screen again", () => {
  const render = appContent();
  render().screen.props.children.props.onLayout();
  const { cleanups } = render();
  paintFrame();
  cleanups
    .filter((cleanup) => typeof cleanup === "function")
    .forEach((cleanup) => cleanup());
  render();
  paintFrame();
  assert.equal(hidden, 1);
  assert.equal(readyListener, undefined);
  assert.equal(stateListener, undefined);
});

let authLoading = false,
  authHydrated = true,
  authenticated = true;
const { default: RootNavigator } = loadTypeScript(
  "navigators/RootNavigators.tsx",
  {
    "@/components/ui/AppLaunchScreen": { default: "LaunchScreen" },
    "@/components/ui/FullScreenLoader": { default: "GoogleLoader" },
    react: { useEffect() {}, useState: (value) => [value, () => {}] },
    "expo-linking": {},
    "@/utils/incomingShareRoute": { incomingShareRoute: () => null },
    "react-native": { View: "View", StyleSheet: { absoluteFillObject: {} } },
    "@/context/AuthContext": { useAuth: () => ({ loading: authLoading }) },
    "@/store/auth": {
      useAuthStore: () => ({
        isAuthenticated: authenticated,
        hasHydrated: authHydrated,
        googleAuthPhase: "idle",
      }),
    },
    "expo-router": {
      Stack: Object.assign(function Stack() {}, { Screen: "Screen" }),
      usePathname: () => "/",
      useRootNavigationState: () => ({ key: "root" }),
      useRouter: () => ({ replace() {} }),
    },
  },
);
test("startup authentication loading keeps the logo screen until navigation can open", () => {
  authLoading = true;
  authHydrated = true;
  assert.equal(RootNavigator().type, "LaunchScreen");
  authLoading = false;
  authHydrated = false;
  assert.equal(RootNavigator().type, "LaunchScreen");
  authHydrated = true;
  for (const value of [true, false]) {
    authenticated = value;
    const stack = [...nodes(RootNavigator())].find(node => node.props.screenOptions);
    assert.equal(stack.props.screenOptions.animation, "none");
    assert.equal(
      stack.props.children[0].props.name,
      value ? "(app)" : "(auth)",
    );
  }
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
    "@/components/gogo/mascot/GogoWelcomeScreen": { default: "Welcome" },
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
  "components/gogo/mascot/GogoWelcomeScreen.tsx",
  {
    "@/components/buttons/CustomBtn1": { default: "ContinueButton" },
    "@/components/buttons/SkipOnboardingButton": { default: "SkipButton" },
    "@/hooks/useReducedMotionPreference": {
      useReducedMotionPreference: () => reducedMotion,
    },
    "@/components/gogo/mascot/motion/useGogoStartupMotion": {
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
    "@/components/gogo/mascot/GogoStartupArtwork": { GogoStartupArtwork: "Artwork" },
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
    "@/components/gogo/mascot/GogoOnboardingCarpoolArtwork": {
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


test('System appearance releases the native override while manual choices set it explicitly', () => {
  for (const [setting, expected] of [['system', null], ['light', 'light'], ['dark', 'dark'], ['system', null]]) {
    resetLayout();
    appearanceSetting = setting;
    RootLayout();
    layoutEffects.forEach(effect => effect());
    assert.deepEqual(appliedSchemes, [expected]);
  }
});
