const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");

function* nodes(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity))
    yield* nodes(child);
}
function text(node) {
  return [...nodes(node)]
    .flatMap((child) =>
      [child.props?.children]
        .flat(Infinity)
        .filter((value) => typeof value === "string"),
    )
    .join(" ");
}
function hookState() {
  const state = { values: [], cursor: 0 };
  return {
    reset() {
      state.values = [];
      state.cursor = 0;
    },
    render(Component) {
      state.cursor = 0;
      return Component();
    },
    hooks: {
      useState(initial) {
        const index = state.cursor++;
        if (!(index in state.values)) state.values[index] = initial;
        return [
          state.values[index],
          (next) => {
            state.values[index] =
              typeof next === "function" ? next(state.values[index]) : next;
          },
        ];
      },
      useRef: (initial) => ({ current: initial }),
      useMemo: (factory) => factory(),
      useEffect() {},
      useCallback: (callback) => callback,
    },
  };
}
const native = Object.fromEntries(
  [
    "View",
    "Text",
    "TouchableOpacity",
    "Pressable",
    "Modal",
    "ScrollView",
    "TextInput",
    "FlatList",
    "KeyboardAvoidingView",
  ].map((name) => [name, name]),
);
native.StyleSheet = {
  create: (styles) => styles,
  absoluteFillObject: { position: "absolute" },
};
native.Platform = { OS: "ios" };
const tw = { default: () => ({}) };
const routes = [];
const navigation = {
  useLockedRouter: () => ({
    replace: (route) => routes.push(route),
    push: (route) => routes.push(route),
  }),
};
const settingsHooks = hookState();
const logout = { calls: [], token: "push-token", fail: false, pending: null };
const { default: Settings } = loadTypeScript("app/(app)/(tabs)/settings.tsx", {
  "@/components/CustomeTopBarNav": { default: "TopBar" },
  "@/components/buttons/SheetCloseButton": { default: "CloseButton" },
  "@/components/ui/AppLoader": { default: "SmallLoader" },
  "@/components/ui/MascotMoment": { MascotMoment: "GogoMessage" },
  "@/hooks/usePressGuard": { usePressGuard: (callback) => callback },
  "@/context/AuthContext": {
    useAuth: () => ({
      user: { name: "Ada", email: "ada@example.com" },
      setUser: (value) => logout.calls.push(["user", value]),
    }),
  },
  "@/context/PushNotificationContext": {
    usePushNotification: () => ({ expoPushToken: logout.token }),
  },
  "@/services/mutations": {
    useRemovePushToken: () => ({
      mutateAsync: async (payload) => logout.calls.push(["push", payload]),
    }),
  },
  "@/store/auth": {
    useAuthStore: {
      getState: () => ({
        logout: async () => {
          logout.calls.push(["auth"]);
          if (logout.fail) throw new Error("Storage unavailable");
          if (logout.pending) await logout.pending;
        },
      }),
    },
  },
  "@/utils/storage": {
    saveItem: async (...args) => logout.calls.push(["storage", ...args]),
  },
  "@/utils/globalErrorHandler": {
    showGlobalError: (message) => logout.calls.push(["error", message]),
  },
  "@/utils/navigation": navigation,
  "@expo/vector-icons": { Ionicons: "Icon" },
  react: settingsHooks.hooks,
  "react-native": native,
  twrnc: tw,
});
function resetLogout() {
  settingsHooks.reset();
  routes.length = 0;
  Object.assign(logout, {
    calls: [],
    token: "push-token",
    fail: false,
    pending: null,
  });
}
function renderSettings() {
  return settingsHooks.render(Settings);
}
function openLogout() {
  const screen = renderSettings();
  const button = [...nodes(screen)].find(
    (node) => node.type === "TouchableOpacity" && text(node) === "Logout",
  );
  button.props.onPress();
  return [...nodes(renderSettings())].find((node) => node.type === "Modal");
}
test("opening and cancelling the Gogo logout prompt leaves the session untouched", () => {
  resetLogout();
  assert.equal(
    [...nodes(renderSettings())].find((node) => node.type === "Modal").props
      .visible,
    false,
  );
  const modal = openLogout();
  assert.equal(modal.props.visible, true);
  assert.ok([...nodes(modal)].find((node) => node.type === "GogoMessage"));
  [...nodes(modal)].find((node) => node.type === "CloseButton").props.onPress();
  assert.equal(
    [...nodes(renderSettings())].find((node) => node.type === "Modal").props
      .visible,
    false,
  );
  assert.deepEqual(logout.calls, []);
  assert.deepEqual(routes, []);
});
test("confirming logout retains token cleanup, stored-session cleanup and navigation", async () => {
  resetLogout();
  const modal = openLogout();
  await [...nodes(modal)]
    .find((node) => node.props.accessibilityLabel === "Confirm logout")
    .props.onPress();
  assert.deepEqual(logout.calls, [
    ["push", { token: "push-token" }],
    ["auth"],
    ["storage", "user", "{}"],
    ["user", null],
  ]);
  assert.deepEqual(routes, ["/login"]);
});
test("logout stays busy until the real operation finishes and reports a failure", async () => {
  resetLogout();
  let finish;
  logout.pending = new Promise((resolve) => {
    finish = resolve;
  });
  const request = [...nodes(openLogout())]
    .find((node) => node.props.accessibilityLabel === "Confirm logout")
    .props.onPress();
  let modal = [...nodes(renderSettings())].find(
    (node) => node.type === "Modal",
  );
  assert.equal(
    [...nodes(modal)].find(
      (node) => node.props.accessibilityLabel === "Confirm logout",
    ).props.disabled,
    true,
  );
  modal.props.onRequestClose();
  assert.equal(
    [...nodes(renderSettings())].find((node) => node.type === "Modal").props
      .visible,
    true,
  );
  finish();
  await request;
  resetLogout();
  logout.fail = true;
  await [...nodes(openLogout())]
    .find((node) => node.props.accessibilityLabel === "Confirm logout")
    .props.onPress();
  modal = [...nodes(renderSettings())].find((node) => node.type === "Modal");
  assert.equal(modal.props.visible, true);
  assert.equal(
    [...nodes(modal)].find(
      (node) => node.props.accessibilityLabel === "Confirm logout",
    ).props.disabled,
    false,
  );
  assert.ok(logout.calls.some(([kind]) => kind === "error"));
  assert.deepEqual(routes, []);
});

const searchHooks = hookState();
let searchQuery = { isPending: true };
const { default: SearchScreen } = loadTypeScript(
  "app/(app)/(tabs)/search.tsx",
  {
    "@/components/View": { default: "Content" },
    "@/components/ui/AppLoader": { default: "SmallLoader" },
    "@/components/ui/EventCard": { default: "EventCard" },
    "@/services/queries": { useGetSearchResult: () => searchQuery },
    "@/utils/navigation": navigation,
    "lucide-react-native": { SearchIcon: "Icon" },
    react: searchHooks.hooks,
    "react-native": native,
    twrnc: tw,
  },
);
test("a blank search shows guidance even while the query is pending", () => {
  searchHooks.reset();
  searchQuery = { isPending: true };
  const screen = searchHooks.render(SearchScreen);
  assert.match(text(screen), /Type something/);
  assert.equal(
    [...nodes(screen)].some((node) => node.type === "SmallLoader"),
    false,
  );
});
test("event search uses the small loader directly below the input without filling the page", () => {
  searchHooks.reset();
  searchQuery = { isPending: true };
  let screen = searchHooks.render(SearchScreen);
  [...nodes(screen)]
    .find((node) => node.type === "TextInput")
    .props.onChangeText("trees");
  screen = searchHooks.render(SearchScreen);
  const content = [...nodes(screen)].find((node) => node.type === "Content");
  assert.equal(content.props.children.type, "SmallLoader");
  assert.equal(content.props.children.props.style.alignSelf, "center");
  assert.equal(content.props.children.props.style.flex, undefined);
  assert.equal(content.props.children.props.style.justifyContent, undefined);
});

const passesHooks = hookState();
let ticketQuery, registrationQuery;
const { default: MyPassesPage } = loadTypeScript("app/(app)/my-passes.tsx", {
  "@/components/ui/AppRefreshControl": {
    default: "RefreshControl",
    RefreshIndicator: "RefreshIndicator",
  },
  "@/components/CustomeTopBarNav": { default: "TopBar" },
  "@/components/EventImageWithProcessing": {
    EventImageWithProcessing: "EventImage",
  },
  "@/components/ui/MascotMoment": { MascotMoment: "GogoMessage" },
  "@/components/ui/ImpactPageLoader": { default: "PageLoader" },
  "@/services/queries": {
    useMyTickets: () => ticketQuery,
    useMyRegistrations: () => registrationQuery,
  },
  "@/utils/dateTimeHandler": { formatEventDateTime: () => "Tomorrow" },
  "@/utils/navigation": navigation,
  "@/utils/utils": { numberWithCommas: (value) => String(value) },
  "@expo/vector-icons": { Ionicons: "Icon" },
  "react-native-qrcode-svg": { default: "QRCode" },
  react: passesHooks.hooks,
  "react-native": native,
  twrnc: tw,
});
function resetPasses() {
  passesHooks.reset();
  routes.length = 0;
  ticketQuery = {
    data: { data: [] },
    isPending: false,
    isFetching: false,
    isError: false,
    isRefetching: false,
    refetch() {},
  };
  registrationQuery = {
    data: { data: [] },
    isPending: false,
    isFetching: false,
    isError: false,
    isRefetching: false,
    refetch() {},
  };
}
function passNodes() {
  const screen = passesHooks.render(MyPassesPage);
  return [...nodes(screen)].flatMap((node) =>
    ["EmptyState", "PassCard"].includes(node.type?.name)
      ? [...nodes(node.type(node.props))]
      : [node],
  );
}
test("no owned passes shows lost Gogo without the dashboard, filters or explore button", () => {
  resetPasses();
  const content = passNodes();
  assert.equal(
    content.find((node) => node.type === "GogoMessage").props.variant,
    "empty",
  );
  assert.equal(
    content.some((node) => node.props.children === "Your access"),
    false,
  );
  assert.equal(
    content.some((node) => node.type === "TouchableOpacity"),
    false,
  );
});
test("loading passes keeps the real loading state instead of claiming no tickets", () => {
  resetPasses();
  ticketQuery.isPending = true;
  ticketQuery.data = undefined;
  assert.equal(passesHooks.render(MyPassesPage).type, "PageLoader");
});
const ownedRegistration = {
  id: "registration-1",
  qrCode: "qr-1",
  isUsed: false,
  createdAt: "2026-10-01T12:00:00Z",
  transactionId: "transaction-1",
  eventId: "event-1",
  event: {
    id: "event-1",
    title: "Tree planting",
    startDate: "2035-10-21T12:00:00Z",
    endDate: "2035-10-21T14:00:00Z",
    location: "Lagos",
    registrationType: "registration",
    isPhysicalEvent: true,
  },
};

test("owned registrations remain accessible when there are no tickets", () => {
  resetPasses();
  registrationQuery.data.data = [ownedRegistration];
  const content = passNodes();
  assert.equal(
    content.some((node) => node.type === "GogoMessage"),
    false,
  );
  assert.ok(content.some((node) => node.props.children === "Tree planting"));
  const screen = passesHooks.render(MyPassesPage);
  const card = [...nodes(screen)].find(
    (node) => node.type?.name === "PassCard",
  );
  card.props.onOpenEvent(card.props.pass);
  assert.deepEqual(routes, ["/event/event-1"]);
});

test("passes wait for either request and cached empty rechecks before showing the empty state", () => {
  for (const kind of ["ticket", "registration"]) {
    for (const pending of [true, false]) {
      resetPasses();
      const query = kind === "ticket" ? ticketQuery : registrationQuery;
      query.isPending = pending;
      query.isFetching = true;
      if (pending) query.data = undefined;
      assert.equal(passesHooks.render(MyPassesPage).type, "PageLoader");
      assert.equal(
        passNodes().some((node) => node.type === "GogoMessage"),
        false,
      );
      query.data = { data: [] };
      query.isPending = false;
      query.isFetching = false;
      assert.equal(
        passNodes().find((node) => node.type === "GogoMessage").props.variant,
        "empty",
      );
    }
  }
});
test("a failed passes request shows retry instead of an empty state and retries both sources", async () => {
  for (const kind of ["ticket", "registration"]) {
    resetPasses();
    const query = kind === "ticket" ? ticketQuery : registrationQuery;
    query.isError = true;
    query.data = undefined;
    const content = passNodes();
    assert.equal(
      content.some((node) => node.type === "GogoMessage"),
      false,
    );
    let ticketsRetried = 0,
      registrationsRetried = 0;
    ticketQuery.refetch = async () => {
      ticketsRetried++;
    };
    registrationQuery.refetch = async () => {
      registrationsRetried++;
    };
    const retry = passNodes().find(
      (node) => node.props.accessibilityLabel === "Retry loading passes",
    );
    await retry.props.onPress();
    assert.equal(ticketsRetried, 1);
    assert.equal(registrationsRetried, 1);
    query.isFetching = true;
    assert.equal(passesHooks.render(MyPassesPage).type, "PageLoader");
  }
});
test("owned passes stay visible during a background check", () => {
  resetPasses();
  registrationQuery.data.data = [ownedRegistration];
  registrationQuery.isFetching = true;
  registrationQuery.isRefetching = true;
  const content = passNodes();
  assert.ok(content.some((node) => node.props.children === "Tree planting"));
  assert.equal(
    content.some(
      (node) => node.type === "PageLoader" || node.type === "GogoMessage",
    ),
    false,
  );
});

const eventHooks = hookState();
const checkoutCalls = [];
let eventTickets = [];
const eventMocks = {
  "@/utils/checkout": { checkoutIntentKey: async () => "checkout-key" },
  "@/components/buttons/SheetCloseButton": { default: "CloseButton" },
  "@/components/AvatarWithLabel": { default: "Avatar" },
  "@/components/CustomeTopBarNav": { default: "TopBar" },
  "@/components/EventImageWithProcessing": {
    EventImageWithProcessing: "EventImage",
  },
  "@/components/PaystackWebViewWrapper": {
    PaystackWebViewWrapper: "PaymentWebView",
  },
  "@/components/View": { default: "Content" },
  "@/components/buttons/CustomBtn1": { default: "ActionButton" },
  "@/components/eventInfo/TicketCard": { default: "TicketOption" },
  "@/components/feed/FlameFeedButton": { default: "FeedButton" },
  "@/components/ui/AnimatedNumber": { AnimatedNumber: "Total" },
  "@/components/ui/AppToast": { default: "Toast" },
  "@/components/ui/ImpactPageLoader": { default: "PageLoader" },
  "@/components/ui/MascotMoment": { MascotMoment: "GogoMessage" },
  "@/components/ui/SdgGoalIcon": { SdgGoalIcon: "GoalIcon" },
  "@/components/volunteer/EventVolunteering": { default: "Volunteering" },
  "@/components/volunteer/VolunteerRolesSheet": { default: "VolunteerRoles" },
  "@/components/volunteer/VolunteerButton": { default: "VolunteerButton" },
  "./DontationProgress": { default: "DonationProgress" },
  "./FeedBottomSheet": { default: "Feed" },
  "@/hooks/useFreeEventRegistration": {
    useFreeEventRegistration: () => ({ isPending: false }),
  },
  "@/hooks/useCheckoutCountdown": { useCheckoutCountdown: () => null },
  "@/context/AuthContext": { useAuth: () => ({ user: { id: "viewer" } }) },
  "@/hooks/useEventFeedConnection": {
    useEventFeedConnection: () => ({
      pinnedFeeds: [],
      regularFeeds: [],
      allFeeds: [],
      getFeedStats: () => ({ totalCount: 0 }),
    }),
  },
  "@/hooks/useEventImagePolling": { useEventImagePolling: () => ({}) },
  "@/services/mutations": Object.fromEntries(
    [
      "useFollowUser",
      "useGetTickets",
      "useInitiateDonation",
      "useRegisterEvent",
      "useUpsertEventImpactReport",
    ].map((name) => [
      name,
      () => ({
        isPending: false,
        mutate() {},
        mutateAsync: async (payload) => {
          checkoutCalls.push([name, payload]);
        },
      }),
    ]),
  ),
  "@/services/queries": {
    useEventDetails: () => ({
      isPending: false,
      isError: false,
      data: {
        data: {
          id: "event-1",
          title: "Tree planting",
          description: "Plant trees together",
          startDate: "2035-10-21T12:00:00Z",
          endDate: "2035-10-21T14:00:00Z",
          isPhysicalEvent: true,
          location: "Lagos",
          registrationType: "ticket",
          registrationFee: 0,
          links: [],
          eventTickets,
          creator: { id: "organiser", username: "organiser" },
          volunteerRoles: [],
          volunteers: [],
          paymentOptions: {
            availableProviders: [],
            requiresPayment: false,
            maxTicketsPerCheckout: 5,
          },
        },
      },
    }),
    useWalletOnboarding: () => ({}),
  },
  "@/utils/dateTimeHandler": {
    formatEventDateTime: () => "Tomorrow",
    isEventPastEnd: () => false,
    isEventEditableBeforeStartDay: () => true,
  },
  "@/utils/globalErrorHandler": {
    showGlobalError() {},
    showGlobalSuccess() {},
    showGlobalWarning() {},
  },
  "@/utils/navigation": navigation,
  "@/utils/shareLinks": {
    buildEventShareLink: () => "https://gathergo.test/event-1",
  },
  "@/utils/utils": { numberWithCommas: (value) => String(value) },
  "@expo/vector-icons": { Ionicons: "Icon" },
  "@gorhom/bottom-sheet": {
    BottomSheetModal: "Sheet",
    BottomSheetScrollView: "SheetScrollView",
    BottomSheetBackdrop: "Backdrop",
    BottomSheetTextInput: "SheetInput",
  },
  "@tanstack/react-query": { useQueryClient: () => ({}) },
  "expo-clipboard": {},
  "expo-router": { useLocalSearchParams: () => ({ id: "event-1" }) },
  "lucide-react-native": { Edit2Icon: "EditIcon", Share2Icon: "ShareIcon" },
  react: eventHooks.hooks,
  "react-native": native,
  twrnc: { default: Object.assign(() => ({}), { style: () => ({}) }) },
};
const { default: EventPage } = loadTypeScript(
  "app/(app)/event/[id].tsx",
  eventMocks,
);
const ticket = {
  id: "ticket-1",
  type: "General",
  price: 0,
  quantity: 20,
  sold: 0,
  isVisible: true,
  perks: [],
  description: "General admission",
  updatedPrice: null,
};
function ticketSheet() {
  const page = eventHooks.render(EventPage);
  return [...nodes(page)].find((node) => node.type === "Sheet");
}
test("empty and unpublished event tickets show lost Gogo without checkout controls", () => {
  for (const tickets of [[], [{ ...ticket, isVisible: false }]]) {
    eventHooks.reset();
    eventTickets = tickets;
    const sheet = ticketSheet();
    assert.equal(
      [...nodes(sheet)].find((node) => node.type === "GogoMessage").props
        .variant,
      "empty",
    );
    assert.equal(
      [...nodes(sheet)].some((node) =>
        ["ActionButton", "Total", "TicketOption"].includes(node.type),
      ),
      false,
    );
    assert.ok([...nodes(sheet)].some((node) => node.type === "CloseButton"));
  }
});
test("published ticket options still select quantities and enable claiming tickets", () => {
  eventHooks.reset();
  eventTickets = [ticket, { ...ticket, id: "hidden", isVisible: false }];
  let sheet = ticketSheet();
  const options = [...nodes(sheet)].filter(
    (node) => node.type === "TicketOption",
  );
  assert.equal(options.length, 1);
  assert.equal(
    [...nodes(sheet)].find((node) => node.type === "ActionButton").props
      .disabled,
    true,
  );
  options[0].props.onQuantityChange(1);
  sheet = ticketSheet();
  assert.equal(
    [...nodes(sheet)].find((node) => node.type === "TicketOption").props
      .selectedQuantity,
    1,
  );
  assert.equal(
    [...nodes(sheet)].find((node) => node.type === "ActionButton").props
      .disabled,
    false,
  );
});
