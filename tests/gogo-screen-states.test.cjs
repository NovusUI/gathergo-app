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
      useRef(initial) {
        const index = state.cursor++;
        if (!(index in state.values)) state.values[index] = { current: initial };
        return state.values[index];
      },
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
    "SectionList",
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
  "@/components/AppearancePreference": { default: "AppearancePreference" },
  "@/components/CustomeTopBarNav": { default: "TopBar" },
  "@/components/buttons/SheetCloseButton": { default: "CloseButton" },
  "@/components/ui/AppLoader": { default: "SmallLoader" },
  "@/components/ui/WalletSetupReminder": { default: "WalletSetupReminder" },
  "@/components/gogo/mascot/MascotMoment": { MascotMoment: "GogoMessage" },
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
    "@/hooks/useResponsiveLayout": { useResponsiveLayout: () => ({ pageWidth: 390, insets: { top: 24 } }) },
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
const { default: MyPassesPage } = loadTypeScript("components/UserPassesTab.tsx", {
  "react-native-safe-area-context": { SafeAreaView: "SafeArea" },
  "@/components/ui/AppRefreshControl": {
    default: "RefreshControl",
    RefreshIndicator: "RefreshIndicator",
  },
  "@/components/CustomeTopBarNav": { default: "TopBar" },
  "@/components/EventImageWithProcessing": {
    EventImageWithProcessing: "EventImage",
  },
  "@/components/ui/WalletSetupReminder": { default: "WalletSetupReminder" },
  "@/components/gogo/mascot/MascotMoment": { MascotMoment: "GogoMessage" },
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
function passesList() {
  return [...nodes(passesHooks.render(MyPassesPage))].find(node => node.type === 'SectionList');
}
function passCards() {
  const list = passesList();
  return list.props.sections.flatMap(section => section.data.map(item => list.props.renderItem({item})));
}
function passNodes() {
  const screen = passesHooks.render(MyPassesPage);
  const list = [...nodes(screen)].find(node => node.type === 'SectionList');
  const rows = list.props.sections.flatMap(section => section.data.map(item => list.props.renderItem({item})));
  const content = [screen, list.props.ListHeaderComponent, ...(rows.length ? rows : [list.props.ListEmptyComponent]), list.props.ListFooterComponent];
  return content.flatMap(item => [...nodes(item)].flatMap(node =>
    ['EmptyState', 'PassCard', 'PassQrModal'].includes(node.type?.name)
      ? [...nodes(node.type(node.props))] : [node]));
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
  assert.ok(passNodes().some(node => node.type === "PageLoader"));
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
  const card = passCards()[0];
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
      assert.ok(passNodes().some(node => node.type === "PageLoader"));
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
    assert.ok(passNodes().some(node => node.type === "PageLoader"));
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

test("paid tickets and registrations share one unfiltered list with working QR and event actions", () => {
  resetPasses();
  ticketQuery.data.data = [{ id: 'paid-ticket', qrCode: 'paid-qr', isUsed: false, createdAt: ownedRegistration.createdAt, transactionId: 'txn-2',
    eventTicket: { id: 'ticket-type', type: 'General', price: 2500, updatedPrice: null, event: { ...ownedRegistration.event, id: 'event-2', title: 'Community dinner', registrationType: 'ticket', startDate: '2035-10-22T12:00:00Z', endDate: '2035-10-22T14:00:00Z' } } }];
  registrationQuery.data.data = [ownedRegistration];
  const cards = passCards();
  assert.deepEqual(cards.map(card => card.props.pass.eventTitle), ['Tree planting', 'Community dinner']);
  assert.equal(passesList().props.sections.length, 1);
  assert.doesNotMatch(text({ props: { children: passNodes() } }), /Your access|Ready for check-in|Archive|Filter/);
  const paid = cards[1]; paid.props.onOpenQr(paid.props.pass);
  assert.equal(passNodes().find(node => node.type === 'QRCode').props.value, 'paid-qr');
  passNodes().find(node => node.type === 'TouchableOpacity' && text(node) === 'Open event').props.onPress();
  assert.deepEqual(routes, ['/event/event-2']);
  assert.equal(passNodes().some(node => node.type === 'QRCode'), false);
});
test("My passes is removed from Settings", () => {
  resetLogout();
  assert.doesNotMatch(text(renderSettings()), /My Passes|My passes/);
});

const eventHooks = hookState();
const checkoutCalls = [];
const paymentMessages = [];
let checkoutResult;
let checkoutFailure;
let cancellationWait;
let cancellationFailure;
let checkoutRequest;
let cancelRequest;
const intentStorage = new Map();
const checkoutUtils = loadTypeScript("utils/checkout.ts", {
  "react-native-get-random-values": {},
  uuid: { v4: require("node:crypto").randomUUID },
  "./storage": {
    getItem: async key => intentStorage.get(key) ?? null,
    saveItem: async (key, value) => { intentStorage.set(key, value); },
    removeItem: async key => { intentStorage.delete(key); },
  },
});
let eventTickets = [];
let publishPending = false;
let publishingTicketId;
let eventEnded = false;
let eventPaid = false;
let walletOnboarding = { showPersistentAlert: false };
let eventLayout = { detailColumns: 1, availableWidth: 390, pageWidth: 390, fontScale: 1, insets: { top: 24, bottom: 34, left: 0, right: 0 } };
const eventMocks = {
  "@/hooks/useResponsiveLayout": { useResponsiveLayout: () => eventLayout },
  "react-native-safe-area-context": { SafeAreaView: "SafeArea" },
  "@/services/serviceFn": {
    recordEventInterest: async () => ({ data: { recorded: true } }),
    cancelEventCheckout: async (...args) => {
      checkoutCalls.push(["cancelEventCheckout", ...args]);
      if (cancellationWait) await cancellationWait;
      if (cancellationFailure) throw cancellationFailure;
      await checkoutUtils.clearCheckoutIntent(args[1], args[2]);
    },
    cancelCheckout: async id => {
      checkoutCalls.push(["cancelCheckout", id]);
      if (cancellationWait) await cancellationWait;
      if (cancellationFailure) throw cancellationFailure;
      if (cancelRequest) await cancelRequest(id);
    },
  },
  "@/utils/checkout": checkoutUtils,
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
  "@/components/ui/WalletSetupReminder": { default: "WalletSetupReminder" },
  "@/components/gogo/mascot/MascotMoment": { MascotMoment: "GogoMessage" },
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
      "usePublishEventTicket",
    ].map((name) => [
      name,
      (options) => ({
        isPending: name === "usePublishEventTicket" ? publishPending : false,
        variables: name === "usePublishEventTicket" ? publishingTicketId : undefined,
        mutate(payload) { if (name === "usePublishEventTicket") checkoutCalls.push([name, payload]); },
        mutateAsync: async (payload) => {
          checkoutCalls.push([name, payload]);
          if (checkoutFailure) throw checkoutFailure;
          if (name === "useGetTickets" && checkoutRequest) {
            const response = await checkoutRequest(payload);
            await options.onSuccess(response);
            return response;
          }
          if (checkoutResult) await options.onSuccess(checkoutResult);
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
            requiresPayment: eventPaid,
            maxTicketsPerCheckout: 5,
          },
        },
      },
    }),
    useWalletOnboarding: () => ({ data: { data: walletOnboarding } }),
  },
  "@/utils/dateTimeHandler": {
    formatEventDateTime: () => "Tomorrow",
    isEventPastEnd: () => eventEnded,
    isEventEditableBeforeStartDay: () => true,
  },
  "@/utils/globalErrorHandler": {
    showGlobalError: message => paymentMessages.push(["error", message]),
    showGlobalSuccess: message => paymentMessages.push(["success", message]),
    showGlobalWarning: message => paymentMessages.push(["warning", message]),
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
test("phones keep the event action below the scrolling details and wide screens place it beside them", () => {
  const original = eventLayout;
  try {
    for (const [width, fontScale, columns] of [[390, 1, false], [760, 1, false], [1024, 1, true], [1366, 1, true], [1024, 1.6, false]]) {
      eventHooks.reset();
      eventLayout = { detailColumns: width >= 960 && fontScale <= 1.4 ? 2 : 1, availableWidth: width, pageWidth: Math.min(width, 1200), fontScale, insets: { top: 24, bottom: 34, left: 0, right: 0 } };
      const page = eventHooks.render(EventPage);
      assert.equal(page.type, 'SafeArea');
      assert.deepEqual(page.props.edges, ['top']);
      const body = page.props.children[0].props.children[1];
      const scrolls = [body.props.children].flat().filter(node => node?.type === 'ScrollView');
      assert.equal(scrolls.length, columns ? 2 : 1);
      assert.equal([...nodes(scrolls[0])].some(node => node.type === 'ActionButton' && node.props.title === 'View tickets'), false);
      assert.equal([...nodes(scrolls[0])].some(node => node.type === 'Avatar'), !columns);
      if (columns) assert.ok([...nodes(scrolls[1])].some(node => node.type === 'ActionButton' && node.props.title === 'View tickets'));
      const sheet = [...nodes(page)].find(node => node.type === 'Sheet');
      assert.equal(sheet.props.topInset, 24);
      assert.equal(sheet.props.bottomInset, 34);
      assert.equal(width - sheet.props.containerStyle.marginLeft - sheet.props.containerStyle.marginRight, Math.min(width, 680));
    }
  } finally { eventLayout = original; }
});
test("pass loading preserves the profile summary and sticky tabs", () => {
  resetPasses(); ticketQuery.isPending = true;
  const summary = {type: 'Summary'}, tabs = () => ({type: 'Tabs'});
  const page = passesHooks.render(() => MyPassesPage({ListHeaderComponent: summary, renderSectionHeader: tabs}));
  const list = [...nodes(page)].find(node => node.type === 'SectionList');
  assert.ok([...nodes(list.props.ListHeaderComponent)].includes(summary));
  assert.strictEqual(list.props.renderSectionHeader, tabs);
  assert.equal(list.props.stickySectionHeadersEnabled, true);
  assert.equal(list.props.ListFooterComponent.type, 'PageLoader');
});

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
test("organisers can publish hidden tickets from the ticket sheet without opening Edit", () => {
  eventHooks.reset(); checkoutCalls.length = 0; routes.length = 0;
  eventTickets = [ticket, { ...ticket, id: "hidden", isVisible: false }];
  const originalAuth = eventMocks["@/context/AuthContext"].useAuth;
  eventMocks["@/context/AuthContext"].useAuth = () => ({ user: { id: "organiser" } });
  try {
    let options = [...nodes(ticketSheet())].filter(node => node.type === "TicketOption");
    assert.equal(options.length, 2);
    const hidden = options.find(node => node.props.isVisible === false);
    assert.equal(hidden.props.onQuantityChange, undefined);
    assert.equal(options.find(node => node.props.isVisible).props.onPublish, undefined);
    hidden.props.onPublish();
    assert.deepEqual(checkoutCalls, [["usePublishEventTicket", "hidden"]]);
    assert.deepEqual(routes, []);
    assert.equal(eventTickets[1].isVisible, false);
    publishPending = true; publishingTicketId = "hidden";
    options = [...nodes(ticketSheet())].filter(node => node.type === "TicketOption");
    const busy = options.find(node => !node.props.isVisible);
    assert.equal(busy.props.isPublishing, true);
    assert.equal(busy.props.publishDisabled, true);
    busy.props.onPublish();
    assert.equal(checkoutCalls.length, 1);
  } finally {
    eventMocks["@/context/AuthContext"].useAuth = originalAuth;
    publishPending = false; publishingTicketId = undefined;
  }
});
test("organisers cannot publish hidden tickets from an ended event", () => {
  eventHooks.reset(); eventTickets = [{ ...ticket, isVisible: false }];
  const originalAuth = eventMocks["@/context/AuthContext"].useAuth;
  eventMocks["@/context/AuthContext"].useAuth = () => ({ user: { id: "organiser" } });
  eventEnded = true;
  try {
    const option = [...nodes(ticketSheet())].find(node => node.type === "TicketOption");
    assert.equal(option.props.onPublish, undefined);
    assert.equal(option.props.onQuantityChange, undefined);
  } finally {
    eventEnded = false;
    eventMocks["@/context/AuthContext"].useAuth = originalAuth;
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

test("event details keep a single set of essentials and the shared payout reminder opens Wallet directly", () => {
  eventHooks.reset(); routes.length = 0; eventPaid = true;
  walletOnboarding = { showPersistentAlert: true, nextAction: "ADD_SETTLEMENT_ACCOUNT" };
  const originalAuth = eventMocks["@/context/AuthContext"].useAuth;
  eventMocks["@/context/AuthContext"].useAuth = () => ({ user: { id: "organiser" } });
  try {
    const tree = eventHooks.render(EventPage);
    assert.equal(text(tree).includes("Event essentials"), false);
    assert.equal(text(tree).includes("Finish payout setup"), false);
    const reminder = [...nodes(tree)].find(node => node.type === "WalletSetupReminder");
    assert.ok(reminder);
    reminder.props.onPress();
    assert.deepEqual(routes, ["/wallet"]);
  } finally {
    eventPaid = false; walletOnboarding = { showPersistentAlert: false };
    eventMocks["@/context/AuthContext"].useAuth = originalAuth;
  }
});

function checkoutPage() { return eventHooks.render(EventPage); }
function checkoutNode(type, page = checkoutPage()) { return [...nodes(page)].find(n => n.type === type); }
function ticketPayButton(page = checkoutPage()) {
  return [...nodes(checkoutNode("Sheet", page))].find(n => n.type === "ActionButton");
}
async function beginPaidCheckout(quantity = 1) {
  eventHooks.reset(); checkoutCalls.length = 0; routes.length = 0; paymentMessages.length = 0;
  Object.assign(walletOnboarding, { showPersistentAlert: false });
  eventTickets = [{ ...ticket, price: 1000 }]; eventPaid = true; eventEnded = false;
  checkoutFailure = undefined; cancellationFailure = undefined; cancellationWait = undefined;
  checkoutRequest = undefined; cancelRequest = undefined; intentStorage.clear();
  checkoutResult = { data: { transactionId: "pending-ticket", paymentUrl: "https://checkout.paystack.com/test", checkoutDeadlineMs: Date.now() + 300000 } };
  const page = checkoutPage();
  const dismissals = [];
  checkoutNode("Sheet", page).props.ref.current = { dismiss: () => dismissals.push("tickets") };
  checkoutNode("TicketOption", page).props.onQuantityChange(quantity);
  await ticketPayButton().props.onPress();
  assert.equal(checkoutNode("PaymentWebView").props.visible, true);
  return dismissals;
}
test("cancelling Paystack releases the checkout, clears local payment state and allows a ticket retry", async () => {
  const dismissals = await beginPaidCheckout();
  let release;
  cancellationWait = new Promise(resolve => { release = resolve; });
  checkoutNode("PaymentWebView").props.onCancel();
  const pendingPage = checkoutPage();
  assert.equal(checkoutNode("PaymentWebView", pendingPage).props.visible, false);
  assert.equal(checkoutNode("PaymentWebView", pendingPage).props.checkoutDeadlineMs, null);
  assert.equal(checkoutNode("PaymentWebView", pendingPage).props.paymentUrl, "");
  assert.equal(ticketPayButton(pendingPage).props.disabled, true);
  await ticketPayButton(pendingPage).props.onPress();
  assert.equal(checkoutCalls.filter(c => c[0] === "useGetTickets").length, 1);
  assert.deepEqual(checkoutCalls.at(-1), ["cancelEventCheckout", "pending-ticket", "viewer", "event-1"]);
  release(); await new Promise(setImmediate);
  assert.equal(ticketPayButton().props.disabled, false);
  await ticketPayButton().props.onPress();
  assert.equal(checkoutCalls.filter(c => c[0] === "useGetTickets").length, 2);
  assert.deepEqual(routes, []);
  assert.ok(dismissals.length >= 2);
  checkoutResult = undefined; cancellationWait = undefined; eventPaid = false;
});
test("a failed cancellation exposes recovery after dismissing the ticket sheet", async () => {
  const dismissals = await beginPaidCheckout();
  const before = dismissals.length;
  cancellationFailure = new Error("Payment was already processed");
  checkoutNode("PaymentWebView").props.onCancel();
  await new Promise(setImmediate);
  assert.ok(dismissals.length > before);
  assert.deepEqual(routes, ["/transaction/pending-ticket?type=TICKET"]);
  assert.ok(paymentMessages.some(([kind, message]) => kind === "error" && message.includes("Check its payment status")));
  checkoutResult = undefined; cancellationFailure = undefined; eventPaid = false;
});
test("a failed checkout replacement dismisses ticket selection before showing payment recovery", async () => {
  const dismissals = await beginPaidCheckout();
  unfinishedCheckout(); chooseTicket("General", 1);
  const before = dismissals.length;
  cancellationFailure = new Error("The payment has already been processed.");
  await ticketPayButton().props.onPress();
  assert.equal(checkoutCalls.filter(c => c[0] === "useGetTickets").length, 2);
  assert.deepEqual(checkoutCalls.at(-1), ["cancelCheckout", "pending-ticket"]);
  assert.ok(dismissals.length > before);
  assert.equal(checkoutNode("PaymentWebView").props.visible, false);
  assert.deepEqual(routes, ["/transaction/pending-ticket?type=TICKET"]);
  checkoutResult = undefined; cancellationFailure = undefined; checkoutRequest = undefined; cancelRequest = undefined; eventPaid = false;
});

test("checkout failures show the API error and do not reject silently from the pay button", async () => {
  await beginPaidCheckout();
  checkoutFailure = { isAxiosError: true, response: { data: { message: "This ticket has sold out." } } };
  await assert.doesNotReject(ticketPayButton().props.onPress());
  assert.deepEqual(paymentMessages.at(-1), ["error", "This ticket has sold out."]);
  checkoutResult = undefined; checkoutFailure = undefined; eventPaid = false;
});

function unfinishedCheckout() {
  const previous = checkoutCalls.find(c => c[0] === "useGetTickets")[1];
  let active = { id: "pending-ticket", key: previous.idempotencyKey };
  checkoutRequest = async payload => {
    if (active && active.key !== payload.idempotencyKey) {
      throw { isAxiosError: true, response: { status: 409, data: { transactionId: active.id, message: "You already have an active checkout for this event." } } };
    }
    active = { id: "updated-ticket", key: payload.idempotencyKey };
    return { data: { transactionId: active.id, paymentUrl: "https://checkout.paystack.com/updated", checkoutDeadlineMs: Date.now() + 300000 } };
  };
  cancelRequest = async id => { assert.equal(id, active.id); active = null; };
  checkoutNode("PaymentWebView").props.onClose();
}
function chooseTicket(id, change) {
  [...nodes(checkoutPage())].find(n => n.type === "TicketOption" && n.props.title === id).props.onQuantityChange(change);
}
for (const change of ["increase", "decrease", "add ticket type", "switch ticket type"]) {
  test(`revised ticket checkout replaces the held order when users ${change}`, async () => {
    await beginPaidCheckout(change === "decrease" ? 2 : 1);
    unfinishedCheckout();
    eventTickets.push({ ...ticket, id: "ticket-2", type: "VIP", price: 2000 });
    if (change === "increase") chooseTicket("General", 1);
    if (change === "decrease" || change === "switch ticket type") chooseTicket("General", -1);
    if (change === "add ticket type" || change === "switch ticket type") chooseTicket("VIP", 1);
    const before = checkoutCalls.length;
    await ticketPayButton().props.onPress();
    const calls = checkoutCalls.slice(before);
    assert.deepEqual(calls.map(c => c[0]), ["useGetTickets", "cancelCheckout", "useGetTickets"]);
    const initial = checkoutCalls[0][1];
    const revised = calls[0][1];
    assert.notEqual(revised.idempotencyKey, initial.idempotencyKey);
    assert.deepEqual(calls[2][1], revised);
    const expected = change === "increase" ? [["ticket-1", 2]] : change === "decrease" ? [["ticket-1", 1]] : change === "add ticket type" ? [["ticket-1", 1], ["ticket-2", 1]] : [["ticket-2", 1]];
    assert.deepEqual(revised.items.map(i => [i.id, i.quantity]), expected);
    assert.equal(checkoutNode("PaymentWebView").props.visible, true);
    assert.equal(checkoutNode("PaymentWebView").props.paymentUrl, "https://checkout.paystack.com/updated");
    assert.deepEqual(routes, []);
    checkoutRequest = undefined; cancelRequest = undefined; checkoutResult = undefined; eventPaid = false;
  });
}
test("replacement keeps one persisted request key across network retries", async () => {
  await beginPaidCheckout(); unfinishedCheckout(); chooseTicket("General", 1);
  const acceptedRequest = checkoutRequest;
  let responses = 0;
  checkoutRequest = async payload => {
    const response = await acceptedRequest(payload);
    if (responses++ === 0) throw new Error("Network response lost after creation");
    return response;
  };
  await ticketPayButton().props.onPress();
  const revised = checkoutCalls.filter(c => c[0] === "useGetTickets").at(-1)[1];
  await ticketPayButton().props.onPress();
  assert.equal(checkoutCalls.filter(c => c[0] === "useGetTickets").at(-1)[1].idempotencyKey, revised.idempotencyKey);
  assert.equal(checkoutCalls.filter(c => c[0] === "cancelCheckout").length, 1);
  assert.equal(checkoutNode("PaymentWebView").props.paymentUrl, "https://checkout.paystack.com/updated");
  checkoutRequest = undefined; cancelRequest = undefined; checkoutResult = undefined; eventPaid = false;
});
test("repeated pay taps during replacement do not create overlapping updates", async () => {
  await beginPaidCheckout(); unfinishedCheckout(); chooseTicket("General", 1);
  let release;
  cancellationWait = new Promise(resolve => { release = resolve; });
  const first = ticketPayButton().props.onPress();
  await new Promise(setImmediate);
  assert.equal(ticketPayButton().props.disabled, true);
  assert.match(ticketPayButton().props.title, /Updating/);
  await ticketPayButton().props.onPress();
  assert.equal(checkoutCalls.filter(c => c[0] === "cancelCheckout").length, 1);
  release(); await first;
  assert.equal(checkoutCalls.filter(c => c[0] === "useGetTickets").length, 3);
  assert.deepEqual(routes, []);
  checkoutRequest = undefined; cancelRequest = undefined; cancellationWait = undefined; checkoutResult = undefined; eventPaid = false;
});

test("quantity and ticket-type changes after confirmed Paystack cancellation start a fresh order", async () => {
  await beginPaidCheckout();
  const firstKey = checkoutCalls[0][1].idempotencyKey;
  checkoutNode("PaymentWebView").props.onCancel();
  await new Promise(setImmediate);
  eventTickets.push({ ...ticket, id: "ticket-2", type: "VIP", price: 2000 });
  chooseTicket("General", 1); chooseTicket("VIP", 1);
  checkoutResult = { data: { transactionId: "fresh-ticket", paymentUrl: "https://checkout.paystack.com/fresh", checkoutDeadlineMs: Date.now() + 300000 } };
  await ticketPayButton().props.onPress();
  const fresh = checkoutCalls.filter(c => c[0] === "useGetTickets").at(-1)[1];
  assert.notEqual(fresh.idempotencyKey, firstKey);
  assert.deepEqual(fresh.items.map(i => [i.id, i.quantity]), [["ticket-1", 2], ["ticket-2", 1]]);
  assert.equal(checkoutCalls.filter(c => c[0] === "cancelCheckout").length, 0);
  assert.equal(checkoutNode("PaymentWebView").props.paymentUrl, "https://checkout.paystack.com/fresh");
  assert.deepEqual(routes, []);
  checkoutResult = undefined; eventPaid = false;
});
test("a further active-checkout conflict stops after one replacement attempt", async () => {
  await beginPaidCheckout(); unfinishedCheckout(); chooseTicket("General", 1);
  checkoutRequest = async () => {
    throw { isAxiosError: true, response: { status: 409, data: { transactionId: "other-checkout", message: "You already have an active checkout for this event." } } };
  };
  cancelRequest = async () => {};
  const before = checkoutCalls.length;
  await ticketPayButton().props.onPress();
  assert.deepEqual(checkoutCalls.slice(before).map(c => c[0]), ["useGetTickets", "cancelCheckout", "useGetTickets"]);
  assert.match(paymentMessages.at(-1)[1], /active checkout/);
  assert.equal(ticketPayButton().props.disabled, false);
  assert.deepEqual(routes, []);
  checkoutRequest = undefined; cancelRequest = undefined; checkoutResult = undefined; eventPaid = false;
});

test("a revised request clears the previous checkout timer before waiting for the API", async () => {
  await beginPaidCheckout(); unfinishedCheckout(); chooseTicket("General", 1);
  let complete;
  checkoutRequest = () => new Promise(resolve => { complete = resolve; });
  const attempt = ticketPayButton().props.onPress();
  await new Promise(setImmediate);
  const payment = checkoutNode("PaymentWebView");
  assert.equal(payment.props.checkoutDeadlineMs, null);
  assert.equal(payment.props.paymentUrl, "");
  assert.equal(payment.props.visible, false);
  complete({ data: { transactionId: "revised", paymentUrl: "https://checkout.paystack.com/revised", checkoutDeadlineMs: Date.now() + 300000 } });
  await attempt;
  assert.deepEqual(routes, []);
  checkoutRequest = undefined; cancelRequest = undefined; checkoutResult = undefined; eventPaid = false;
});
