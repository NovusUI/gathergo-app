const assert = require("node:assert/strict");
const { test } = require("node:test");

function fixture() {
  delete require.cache[require.resolve("./loadTypeScript.cjs")];
  const { loadTypeScript } = require("./loadTypeScript.cjs");
  const state = [], effects = [], requests = [], listeners = new Map();
  let cursor = 0;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], (value) => { state[index] = typeof value === "function" ? value(state[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = { current: initial };
      return state[index];
    },
    useCallback: (fn) => fn,
    useMemo: (fn) => fn(),
    useEffect: (fn) => effects.push(fn),
  };
  const socket = {
    connected: true,
    on(event, fn) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(fn);
    },
    off(event, fn) { listeners.get(event)?.delete(fn); },
    emit: (...args) => requests.push(args),
  };
  const dependencies = { react, "@/context/SocketContext": { useSocket: () => ({ socket, isConnected: socket.connected }) } };
  dependencies["@/hooks/useSocketRefresh"] = loadTypeScript("hooks/useSocketRefresh.ts", dependencies);
  return {
    loadTypeScript, react, socket, requests,
    dependencies,
    render(fn) { cursor = 0; return fn(); },
    mountEffects() { return effects.splice(0).map((effect) => effect()); },
    receive(event, data) { for (const fn of listeners.get(event) ?? []) fn(data); },
  };
}

test("notification refresh waits for a tray response and resets on disconnect or error", () => {
  const f = fixture();
  const { useNotifications } = f.loadTypeScript("hooks/useNotifications.ts", {
    ...f.dependencies,
    "@/context/NotificationContext": { useNotification: () => ({
      getNotificationTray: () => f.socket.emit("getNotificationTray", {}),
      loadMoreNotifications() {}, initialLoading: false,
    }) },
    "@tanstack/react-query": { useQuery: ({ queryKey }) => ({ data:
      queryKey[1] === "list" ? { pages: [[]] } : queryKey[1] === "meta" ? { hasMore: false, lastUpdatedAt: 0 } : 0,
    }) },
  });
  let result = f.render(useNotifications);
  const cleanups = f.mountEffects(); f.requests.length = 0;
  for (const event of ["notificationTray", "error", "disconnect"]) {
    result.refresh(); result = f.render(useNotifications);
    assert.equal(result.refreshing, true, event);
    assert.deepEqual(f.requests.at(-1), ["getNotificationTray", {}]);
    f.receive(event); result = f.render(useNotifications);
    assert.equal(result.refreshing, false, event);
  }
  f.socket.connected = false; f.requests.length = 0;
  result = f.render(useNotifications); result.refresh();
  assert.equal(f.render(useNotifications).refreshing, false);
  assert.equal(f.requests.length, 0);
  cleanups.forEach((cleanup) => cleanup?.());
});

test("feed refresh retains content and finishes only for the matching event history", () => {
  const f = fixture();
  const { useEventFeed } = f.loadTypeScript("hooks/useEventFeed.ts", {
    ...f.dependencies, "@/context/AuthContext": { useAuth: () => ({ user: { id: "user" } }) },
  });
  const render = () => f.render(() => useEventFeed("event-1"));
  render(); const cleanups = f.mountEffects();
  const row = { id: "feed-1", isPinned: false, pinOrder: 0, updatedAt: "2026-10-25T08:00:00Z", createdAt: "2026-10-25T08:00:00Z" };
  f.receive("feedHistory", { eventId: "event-1", feeds: [row], hasMore: false });
  let feed = render(); assert.deepEqual(feed.allFeeds, [row]);
  f.requests.length = 0;
  feed.refresh(); feed = render();
  assert.equal(feed.refreshing, true);
  assert.deepEqual(feed.allFeeds, [row], "refresh does not clear the current feed");
  assert.deepEqual(f.requests, [["joinEventFeed", { eventId: "event-1", limit: 20 }]]);
  f.receive("feedHistory", { eventId: "other-event", feeds: [], hasMore: false });
  assert.equal(render().refreshing, true);
  const updated = { ...row, title: "Updated" };
  f.receive("feedHistory", { eventId: "event-1", feeds: [updated], hasMore: false });
  feed = render(); assert.equal(feed.refreshing, false); assert.deepEqual(feed.allFeeds, [updated]);
  feed.refresh(); f.receive("disconnect"); assert.equal(render().refreshing, false);
  cleanups.forEach((cleanup) => cleanup?.());
});

test("chat refresh stays active until its socket response, error or disconnect", () => {
  const f = fixture();
  const { default: Screen } = f.loadTypeScript("app/(app)/(tabs)/conversations.tsx", {
    ...f.dependencies,
    "@/hooks/useAppTheme": { useAppTheme: () => ({ tw: () => ({}), color: (value) => value }) },
    "@/components/ui/GogoRefreshScrollView": { default: "RefreshScroll" },
    "@/components/ConversationView": { default: "Conversation" },
    "@/utils/navigation": { useLockedRouter: () => ({ push() {} }) },
    "../../../hooks/useSocketReactHook": { useConversations: () => ({ data: [] }) },
    "expo-router": { useFocusEffect() {} },
    "lucide-react-native": { MessageCircle: "Icon", UserRound: "Icon" },
    "react-native": { Text: "Text", View: "View" },
  });
  function find(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "RefreshScroll") return node;
    for (const child of [node.props?.children].flat(Infinity)) {
      const result = find(child); if (result) return result;
    }
  }
  const render = () => find(f.render(Screen));
  render(); const cleanups = f.mountEffects();
  for (const event of ["conversationTrayUpdate", "error", "disconnect"]) {
    render().props.onRefresh(); assert.equal(render().props.refreshing, true);
    f.receive(event); assert.equal(render().props.refreshing, false);
  }
  cleanups.forEach((cleanup) => cleanup?.());
});
