const assert = require("node:assert/strict");
const { test } = require("node:test");
function loader() {
  delete require.cache[require.resolve("./loadTypeScript.cjs")];
  return require("./loadTypeScript.cjs").loadTypeScript;
}
const flush = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const message = (overrides = {}) => ({
  id: "server-1",
  tempId: "temp-1",
  carpoolId: "room-1",
  senderId: "user-1",
  content: "Hello",
  createdAt: "2026-10-24T12:00:00.000Z",
  sender: { id: "user-1", username: "ada" },
  readBy: [],
  ...overrides,
});
const queued = (overrides = {}) => {
  const { carpoolId, senderId, content, createdAt, sender, tempId } =
    message(overrides);
  return {
    carpoolId,
    senderId,
    content,
    createdAt,
    sender,
    tempId,
    error: null,
    ...overrides,
  };
};
const { uniqueMessages, mergeMessagePages } = loader()("utils/chatMessages.ts");
const data = (...pages) => ({
  pages,
  pageParams: pages.map((_, i) => ({
    before: i ? "2026-10-23" : null,
    beforeId: i ? "older" : null,
  })),
});
test("history, live updates, and repeated receipts produce one confirmed message", () => {
  const pending = message({ id: "temp-1", optimistic: true });
  let cache = data([pending]);
  cache = mergeMessagePages(cache, [message()]);
  cache = mergeMessagePages(cache, [message()]);
  assert.deepEqual(
    cache.pages.flat().map((m) => m.id),
    ["server-1"],
  );
  assert.equal(uniqueMessages([...cache.pages.flat(), pending]).length, 1);
});
test("merging history preserves pending messages without overlapping history and keeps cursors aligned", () => {
  const pending = message({ id: "temp-2", tempId: "temp-2", optimistic: true });
  const old = data([pending], [message({ id: "old", tempId: null })]);
  const merged = mergeMessagePages(old, [message()]);
  assert.equal(
    merged.pages.flat().some((m) => m.id === "temp-2"),
    true,
  );
  assert.deepEqual(merged.pageParams, old.pageParams);
});
test("duplicates across pages are removed without collapsing distinct messages or different senders", () => {
  const first = message(),
    second = message({ id: "server-2", tempId: "temp-2" });
  const cache = mergeMessagePages(data([first], [second, first]), [
    first,
    second,
  ]);
  assert.equal(cache.pages.flat().length, 2);
  assert.equal(cache.pages.length, cache.pageParams.length);
  const other = message({ id: "server-3", senderId: "user-2" });
  assert.equal(uniqueMessages([first, other]).length, 2);
  assert.equal(
    uniqueMessages([first, message({ id: "server-4", carpoolId: "room-2" })])
      .length,
    2,
  );
});
test("old duplicate records for the same send are rendered once and pending errors are replaced by receipts", () => {
  const pending = message({
    id: "temp-1",
    optimistic: true,
    error: "Not allowed",
  });
  assert.deepEqual(
    uniqueMessages([
      pending,
      message(),
      message({ id: "duplicate-server-record" }),
    ]).map((m) => m.id),
    ["server-1"],
  );
});
function queueFixture(storage = {}) {
  const files = storage.files || new Map();
  let fail = false,
    gate;
  const native = {
    getItem: async (key) => files.get(key) ?? null,
    setItem: async (key, value) => {
      if (gate) await gate.promise;
      if (fail) throw Error("disk full");
      files.set(key, value);
    },
  };
  const load = loader();
  const { useMessageQueueStore: store, pendingMessage } = load(
    "store/messageQueue.ts",
    { "@react-native-async-storage/async-storage": { default: native } },
  );
  return {
    store,
    pendingMessage,
    files,
    load,
    setFail: (value) => {
      fail = value;
    },
    setGate: (value) => {
      gate = value;
    },
  };
}
test("new sends enter the queue only after storage succeeds and failures preserve existing messages", async () => {
  const f = queueFixture();
  await f.store.getState().hydrate();
  const gate = deferred();
  f.setGate(gate);
  const adding = f.store.getState().addMessage(queued());
  await flush();
  assert.equal(f.store.getState().queue.length, 0);
  gate.resolve();
  await adding;
  assert.equal(f.store.getState().queue.length, 1);
  f.setFail(true);
  await assert.rejects(
    f.store.getState().addMessage(queued({ tempId: "temp-2" })),
    /disk full/,
  );
  assert.equal(f.store.getState().queue.length, 1);
});
test("restart restores pending content, sender, timestamp, key, and failed state", async () => {
  const first = queueFixture();
  await first.store.getState().addMessage(queued());
  await first.store.getState().failMessage("user-1", "temp-1", "Chat expired");
  const restarted = queueFixture({ files: first.files });
  await restarted.store.getState().hydrate();
  assert.deepEqual(restarted.store.getState().queue, [
    queued({ error: "Chat expired" }),
  ]);
  assert.equal(
    restarted.pendingMessage(restarted.store.getState().queue[0]).optimistic,
    true,
  );
});
test("concurrent queue writes and confirmation retain other pending messages and account ownership", async () => {
  const f = queueFixture();
  await Promise.all([
    f.store.getState().addMessage(queued()),
    f.store.getState().addMessage(queued({ tempId: "temp-2" })),
    f.store.getState().addMessage(queued({ senderId: "user-2" })),
  ]);
  await f.store.getState().confirmMessages([message()]);
  assert.deepEqual(
    f.store.getState().queue.map((m) => [m.senderId, m.tempId]),
    [
      ["user-1", "temp-2"],
      ["user-2", "temp-1"],
    ],
  );
  assert.equal(JSON.parse(f.files.get("chat-outbox-storage")).length, 2);
});
test("invalid local storage is reported and the ownerless legacy queue is preserved without sending it", async () => {
  const files = new Map([
    ["message-queue-storage", "legacy text"],
    ["chat-outbox-storage", "{}"],
  ]);
  const f = queueFixture({ files });
  await assert.rejects(f.store.getState().hydrate());
  assert.equal(f.store.getState().hasHydrated, false);
  assert.equal(files.get("message-queue-storage"), "legacy text");
  files.delete("chat-outbox-storage");
  await f.store.getState().hydrate();
  assert.equal(f.store.getState().queue.length, 0);
});
function deliveryFixture(f, userId = "user-1") {
  const events = new Map(),
    sent = [],
    responses = [],
    timers = new Map();
  let nextTimer = 0,
    foreground,
    received = [];
  const socket = {
    connected: true,
    on: (key, fn) => events.set(key, fn),
    off: (key, fn) => {
      if (events.get(key) === fn) events.delete(key);
    },
    connect() {
      this.connected = true;
      events.get("connect")?.();
    },
    timeout(ms) {
      assert.equal(ms, 15000);
      return this;
    },
    get volatile() {
      return this;
    },
    emitWithAck(event, payload) {
      sent.push([event, payload]);
      const reply = deferred();
      responses.push(reply);
      return reply.promise;
    },
  };
  const { startChatDelivery } = f.load("services/chatDelivery.ts", {
    "@/store/messageQueue": { useMessageQueueStore: f.store },
    "@/utils/globalErrorHandler": { showGlobalError() {} },
    "react-native": {
      AppState: {
        addEventListener: (_event, fn) => {
          foreground = fn;
          return {
            remove() {
              foreground = undefined;
            },
          };
        },
      },
    },
  });
  const oldSet = global.setTimeout,
    oldClear = global.clearTimeout;
  global.setTimeout = (fn, delay) => {
    const id = ++nextTimer;
    timers.set(id, { fn, delay });
    return id;
  };
  global.clearTimeout = (id) => timers.delete(id);
  const stop = startChatDelivery(socket, userId, (m) => received.push(m));
  return {
    socket,
    sent,
    responses,
    received,
    timers,
    emit: (event, value) => events.get(event)?.(value),
    foreground: () => foreground?.("active"),
    tick: () => {
      const [id, timer] = timers.entries().next().value;
      timers.delete(id);
      timer.fn();
    },
    stop,
    restore: () => {
      stop();
      global.setTimeout = oldSet;
      global.clearTimeout = oldClear;
    },
  };
}
test("connected sends are retained until acknowledgment and cache updates without a mounted chat", async () => {
  const f = queueFixture(),
    d = deliveryFixture(f);
  try {
    await f.store.getState().addMessage(queued());
    await flush();
    assert.equal(d.sent.length, 1);
    assert.equal(f.store.getState().queue.length, 1);
    d.responses[0].resolve({ ok: true, message: message() });
    await flush();
    assert.equal(f.store.getState().queue.length, 0);
    assert.deepEqual(
      d.received.map((m) => m.id),
      ["server-1"],
    );
  } finally {
    d.restore();
  }
});
test("a lost receipt retries the same message key and only confirmation clears it", async () => {
  const f = queueFixture(),
    d = deliveryFixture(f);
  try {
    await f.store.getState().addMessage(queued());
    await flush();
    d.responses[0].reject(Error("ack timeout"));
    await flush();
    assert.equal(f.store.getState().queue.length, 1);
    assert.equal(d.timers.size, 1);
    d.tick();
    await flush();
    assert.equal(d.sent.length, 2);
    assert.deepEqual(d.sent[0], d.sent[1]);
    d.responses[1].resolve({ ok: true, message: message() });
    await flush();
    assert.equal(f.store.getState().queue.length, 0);
  } finally {
    d.restore();
  }
});
test("reconnection reads the current queue, and foreground resume works after an offline send", async () => {
  const f = queueFixture(),
    d = deliveryFixture(f);
  try {
    d.socket.connected = false;
    await f.store.getState().addMessage(queued());
    await flush();
    assert.equal(d.sent.length, 0);
    d.foreground();
    await flush();
    assert.equal(d.sent.length, 1);
    d.responses[0].resolve({ ok: true, message: message() });
    await flush();
    assert.equal(f.store.getState().queue.length, 0);
  } finally {
    d.restore();
  }
});
test("permanent rejection stays visible, does not loop, and a manual retry reuses its key", async () => {
  const f = queueFixture(),
    d = deliveryFixture(f);
  try {
    await f.store.getState().addMessage(queued());
    await flush();
    d.responses[0].resolve({
      ok: false,
      error: "Chat expired",
      retryable: false,
    });
    await flush();
    assert.equal(f.store.getState().queue[0].error, "Chat expired");
    d.emit("connect");
    await flush();
    assert.equal(d.sent.length, 1);
    await f.store.getState().retryMessage("user-1", "temp-1");
    await flush();
    assert.equal(d.sent.length, 2);
    assert.deepEqual(d.sent[0], d.sent[1]);
    d.responses[1].resolve({ ok: true, message: message() });
    await flush();
    assert.equal(f.store.getState().queue.length, 0);
  } finally {
    d.restore();
  }
});
test("late acknowledgments after logout cannot update the new account or clear its queue", async () => {
  const f = queueFixture(),
    d = deliveryFixture(f);
  try {
    await f.store.getState().addMessage(queued());
    await f.store
      .getState()
      .addMessage(queued({ senderId: "user-2", tempId: "temp-2" }));
    await flush();
    assert.equal(d.sent.length, 1);
    d.stop();
    d.responses[0].resolve({ ok: true, message: message() });
    await flush();
    assert.equal(d.received.length, 0);
    assert.equal(f.store.getState().queue.length, 2);
  } finally {
    d.restore();
  }
});
test("live confirmation also clears only the matching pending send when its direct acknowledgment is lost", async () => {
  const f = queueFixture(),
    d = deliveryFixture(f);
  try {
    await f.store.getState().addMessage(queued());
    await flush();
    d.emit("newMessage", message());
    await flush();
    assert.equal(f.store.getState().queue.length, 0);
    d.responses[0].reject(Error("ack lost"));
    await flush();
    d.tick();
    await flush();
    assert.equal(d.sent.length, 1);
  } finally {
    d.restore();
  }
});
test("a restarted sender delivers only its own restored queue", async () => {
  const first = queueFixture();
  await first.store.getState().addMessage(queued());
  await first.store
    .getState()
    .addMessage(queued({ senderId: "user-2", tempId: "temp-2" }));
  const f = queueFixture({ files: first.files }),
    d = deliveryFixture(f, "user-2");
  try {
    await flush();
    assert.equal(d.sent.length, 1);
    assert.equal(d.sent[0][1].tempId, "temp-2");
    d.responses[0].resolve({
      ok: true,
      message: message({ senderId: "user-2", tempId: "temp-2" }),
    });
    await flush();
    assert.equal(f.store.getState().queue.length, 1);
    assert.equal(f.store.getState().queue[0].senderId, "user-1");
  } finally {
    d.restore();
  }
});
test("chat history ignores other rooms and restores pending bubbles after reopening", async () => {
  const f = queueFixture();
  await f.store.getState().addMessage(queued());
  let effects = [],
    handler,
    cache,
    options;
  const requests = [];
  const socket = {
    connected: true,
    on: (event, fn) => {
      if (event === "chatHistory") handler = fn;
    },
    off() {},
    emit() {},
  };
  const useQueue = Object.assign((selector) => selector(f.store.getState()), {
    getState: f.store.getState,
  });
  const { useChatMessages: hook } = loader()("hooks/useChatMessages.ts", {
    "@/api/client": {
      default: {
        get: async (url, config) => {
          requests.push([url, config]);
          return { data: { data: [message()] } };
        },
      },
    },
    "@/constants/network": { API_BASE_URL: "https://unused.invalid" },
    "@/context/AuthContext": { useAuth: () => ({ user: { id: "user-1" } }) },
    "@/context/SocketContext": { useSocket: () => ({ socket }) },
    "@/store/messageQueue": {
      useMessageQueueStore: useQueue,
      pendingMessage: f.pendingMessage,
    },
    "@/utils/globalErrorHandler": { showGlobalError() {} },
    "@tanstack/react-query": {
      useQueryClient: () => ({
        setQueryData: (_key, fn) => {
          cache = fn(cache);
        },
      }),
      useInfiniteQuery: (value) => {
        options = value;
        return { data: cache };
      },
    },
    react: { useEffect: (fn) => effects.push(fn) },
  });
  assert.equal(hook("room-1").messages[0].optimistic, true);
  assert.equal(
    options.getNextPageParam(
      [f.pendingMessage(queued())],
      [[f.pendingMessage(queued())]],
    ),
    undefined,
  );
  const older = message({
    id: "older",
    tempId: null,
    createdAt: "2026-10-23T12:00:00.000Z",
  });
  assert.deepEqual(
    options.getNextPageParam([message()], [[older], [message()]]),
    { before: older.createdAt, beforeId: older.id },
  );
  const signal = new AbortController().signal;
  const fetched = await options.queryFn({
    pageParam: { before: older.createdAt, beforeId: older.id },
    signal,
  });
  assert.deepEqual(fetched, [message()]);
  assert.equal(requests[0][1].signal, signal);
  const request = new URL(requests[0][0]);
  assert.equal(request.pathname, "/messages/room-1");
  assert.equal(request.searchParams.get("before"), older.createdAt);
  assert.equal(request.searchParams.get("beforeId"), older.id);
  assert.equal(request.searchParams.get("limit"), "20");
  effects.forEach((fn) => fn());
  handler({
    carpoolId: "room-2",
    messages: [message({ carpoolId: "room-2" })],
  });
  assert.equal(cache, undefined);
  handler({ carpoolId: "room-1", messages: [message()] });
  await flush();
  assert.equal(f.store.getState().queue.length, 0);
  assert.equal(hook("room-1").messages[0].optimistic, undefined);
});
test("failed message UI exposes an accessible retry action, and pending UI does not claim delivery", () => {
  const load = loader();
  const tw = () => ({});
  const { default: Status } = load("components/ui/MessageDeliveryStatus.tsx", {
    "@/hooks/useAppTheme": {
      useAppTheme: () => ({ tw, color: (value) => value }),
    },
    "@expo/vector-icons": { Ionicons: "Icon" },
    "react-native": { Text: "Text", TouchableOpacity: "Button", View: "View" },
  });
  let retries = 0;
  const failed = Status({
    time: "12:00",
    optimistic: true,
    error: "Chat expired",
    onRetry: () => retries++,
  });
  assert.equal(failed.type, "Button");
  assert.equal(failed.props.accessibilityLabel, "Retry sending message");
  failed.props.onPress();
  assert.equal(retries, 1);
  const pending = Status({ time: "12:00", optimistic: true });
  assert.equal(
    pending.props.accessibilityLabel,
    "Message waiting for confirmation",
  );
});
