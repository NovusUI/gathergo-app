const assert = require("node:assert/strict");
const { test } = require("node:test");
const { Buffer } = require("node:buffer");
const { loadTypeScript } = require("./loadTypeScript.cjs");
const values = () => ({
  eventName: "",
  description: "",
  impactTitle: "",
  impactDescription: "",
  isPhysicalEvent: true,
  location: "",
  tags: [],
  links: [],
  repeat: "NONE",
  isRecurring: false,
  registrationType: "registration",
  donationsEnabled: false,
  volunteerRoles: [],
  tickets: [],
  impactSdgGoals: [],
  impactPaths: [],
  impactCommitments: [],
});
const conversation = {
  messages: [
    {
      role: "assistant",
      content: "Where will people meet?",
      choices: [],
      section: "Location",
      suggestedImpactStory: null,
    },
  ],
  addressedSections: ["Links"],
};
const saved = (changes = {}) => ({
  values: { ...values(), eventName: "Park day", ...changes },
  mode: "gogo",
  conversation,
});
const storage = new Map();
let writeGate;
let storageError = false;
const storageAdapter = {
  getItem: async (key) => storage.get(key) ?? null,
  setItem: async (key, value) => {
    if (writeGate) await writeGate;
    if (storageError) throw new Error("storage error");
    storage.set(key, value);
  },
  removeItem: async (key) => {
    if (storageError) throw new Error("storage error");
    storage.delete(key);
  },
};
const draftStorage = loadTypeScript(
  "components/gogo/tasks/eventCreation/draftStorage.ts",
  {
    "@react-native-async-storage/async-storage": { default: storageAdapter },
    "@/utils/storage": {
      getItem: storageAdapter.getItem,
      removeItem: storageAdapter.removeItem,
    },
  },
);

test("selecting a type alone does not create a resumable empty draft", async () => {
  storage.clear();
  const blank = { values: values(), mode: "gogo", conversation };
  assert.equal(draftStorage.hasEventDraftContent(blank), false);
  await draftStorage.saveEventDraft(blank);
  assert.deepEqual(await draftStorage.loadEventDrafts(), []);
});
test("drafts preserve unfinished text, blank link rows, dates, mode and Gogo progress", async () => {
  storage.clear();
  const draft = saved({
    startDate: new Date("2035-02-03T09:00:00Z"),
    endDate: new Date("2035-02-03T11:00:00Z"),
    startTime: "10:00",
    endTime: "12:00",
    description: "",
    links: [""],
  });
  await draftStorage.saveEventDraft(draft);
  const [loaded] = await draftStorage.loadEventDrafts();
  assert.equal(loaded.values.description, "");
  assert.deepEqual(loaded.values.links, [""]);
  assert.ok(loaded.values.startDate instanceof Date);
  assert.equal(
    loaded.values.startDate.toISOString(),
    "2035-02-03T09:00:00.000Z",
  );
  assert.deepEqual(loaded.conversation, conversation);
  assert.equal(loaded.mode, "gogo");
});
test("an existing form-only draft opens with its actual fields in manual mode", async () => {
  storage.clear();
  storage.set(
    "event_form_progress_registration",
    JSON.stringify(saved().values),
  );
  const [loaded] = await draftStorage.loadEventDrafts();
  assert.equal(loaded.values.eventName, "Park day");
  assert.equal(loaded.mode, "manual");
  assert.equal(loaded.conversation, undefined);
  assert.ok(storage.has("event_form_progress_registration"));
  await draftStorage.saveEventDraft(loaded);
  assert.equal(storage.has("event_form_progress_registration"), false);
  assert.equal(
    (await draftStorage.loadEventDrafts())[0].values.eventName,
    "Park day",
  );
});
test("the return choice uses the most recently edited type and discards only that draft", async () => {
  storage.clear();
  await draftStorage.saveEventDraft(
    saved({ registrationType: "ticket", eventName: "Concert" }),
  );
  await draftStorage.saveEventDraft(
    saved({ registrationType: "donation", eventName: "Library appeal" }),
  );
  assert.deepEqual(
    (await draftStorage.loadEventDrafts()).map(
      (draft) => draft.values.eventName,
    ),
    ["Library appeal", "Concert"],
  );
  await draftStorage.discardEventDraft("donation");
  const remaining = await draftStorage.loadEventDrafts();
  assert.deepEqual(
    remaining.map((draft) => draft.values.eventName),
    ["Concert"],
  );
});
test("discard waits for an outstanding save so it cannot recreate the deleted draft", async () => {
  storage.clear();
  let release;
  writeGate = new Promise((resolve) => {
    release = resolve;
  });
  const writing = draftStorage.saveEventDraft(saved());
  const discarding = draftStorage.discardEventDraft("registration");
  release();
  await writing;
  await discarding;
  writeGate = undefined;
  assert.deepEqual(await draftStorage.loadEventDrafts(), []);
});
test("returning waits for the latest write instead of reading a stale draft", async () => {
  storage.clear();
  let release;
  writeGate = new Promise((resolve) => {
    release = resolve;
  });
  const writing = draftStorage.saveEventDraft(
    saved({ eventName: "Latest edit" }),
  );
  let readFinished = false;
  const reading = draftStorage.loadEventDrafts().then((result) => {
    readFinished = true;
    return result;
  });
  await Promise.resolve();
  assert.equal(readFinished, false);
  release();
  await writing;
  writeGate = undefined;
  assert.equal((await reading)[0].values.eventName, "Latest edit");
});
test("storage failures remain visible and a later save can recover", async () => {
  storage.clear();
  storageError = true;
  await assert.rejects(draftStorage.saveEventDraft(saved()), /storage error/);
  storageError = false;
  await draftStorage.saveEventDraft(saved());
  assert.equal(
    (await draftStorage.loadEventDrafts())[0].values.eventName,
    "Park day",
  );
});

let runtime;
const equalDeps = (a, b) =>
  a &&
  a.length === b.length &&
  a.every((value, index) => Object.is(value, b[index]));
const hooks = {
  useState(initial) {
    const index = runtime.cursor++;
    if (!(index in runtime.values)) runtime.values[index] = initial;
    return [
      runtime.values[index],
      (value) => {
        runtime.values[index] =
          typeof value === "function" ? value(runtime.values[index]) : value;
      },
    ];
  },
  useRef(initial) {
    return hooks.useState({ current: initial })[0];
  },
  useCallback(callback, deps) {
    const index = runtime.cursor++;
    if (!equalDeps(runtime.values[index]?.deps, deps))
      runtime.values[index] = { callback, deps };
    return runtime.values[index].callback;
  },
  useEffect(callback, deps) {
    const index = runtime.cursor++;
    const previous = runtime.effects.get(index);
    if (!equalDeps(previous?.deps, deps))
      runtime.pending.push(() => {
        previous?.cleanup?.();
        runtime.effects.set(index, { deps, cleanup: callback() });
      });
  },
};
const warnings = [];
const { useEventDraftPersistence: runEventDraftPersistence } = loadTypeScript(
  "components/gogo/tasks/eventCreation/useEventDraftPersistence.ts",
  {
    react: hooks,
    "expo-router": {
      useFocusEffect: (callback) =>
        hooks.useEffect(
          () => (runtime.focused ? callback() : undefined),
          [callback, runtime.focused],
        ),
    },
    "@/utils/globalErrorHandler": {
      showGlobalError: (message) => warnings.push(message),
    },
    "@/components/gogo/tasks/eventCreation/draftStorage": draftStorage,
  },
);
let form;
let listeners;
let left;
const watch = (callback) => {
  listeners.add(callback);
  return { unsubscribe: () => listeners.delete(callback) };
};
const getDraft = () => ({ values: form, mode: "gogo", conversation });
const onLeave = () => {
  left += 1;
};
function resetPersistence() {
  runtime = {
    cursor: 0,
    values: [],
    effects: new Map(),
    pending: [],
    focused: true,
  };
  form = values();
  listeners = new Set();
  left = 0;
  warnings.length = 0;
  storage.clear();
}
function renderPersistence() {
  runtime.cursor = 0;
  const result = runEventDraftPersistence({ watch, getDraft, onLeave });
  for (const effect of runtime.pending.splice(0)) effect();
  return result;
}
test("leaving immediately flushes the last edit and cancels the active Gogo reply", async () => {
  resetPersistence();
  renderPersistence();
  form.eventName = "Last-second edit";
  listeners.forEach((listener) => listener());
  runtime.focused = false;
  renderPersistence();
  assert.equal(left, 1);
  assert.equal(listeners.size, 0);
  assert.equal(
    (await draftStorage.loadEventDrafts())[0].values.eventName,
    "Last-second edit",
  );
});
test("a published draft is cleared and neither a pending timer nor leaving can save it again", async () => {
  resetPersistence();
  form.eventName = "Published event";
  const result = renderPersistence();
  await result.flush();
  listeners.forEach((listener) => listener());
  await result.clear();
  listeners.forEach((listener) => listener());
  runtime.focused = false;
  renderPersistence();
  assert.deepEqual(await draftStorage.loadEventDrafts(), []);
  assert.deepEqual(warnings, []);
});

const { default: EventDraftPrompt } = loadTypeScript(
  "components/gogo/tasks/eventCreation/EventDraftPrompt.tsx",
  {
    "@/components/buttons/CustomBtn1": { default: "Action" },
    "@/components/gogo/mascot/MascotMoment": { MascotMoment: "Gogo" },
    "react-native": {
      ScrollView: "ScrollView",
      Text: "Text",
      TouchableOpacity: "Button",
      View: "View",
    },
    twrnc: { default: () => ({}) },
  },
);
function* nodes(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity))
    yield* nodes(child);
}
test("the Gogo return screen exposes real continue and discard choices and blocks repeats while discarding", () => {
  const actions = [];
  const props = {
    title: "Park day",
    busy: false,
    onContinue: () => actions.push("continue"),
    onDiscard: () => actions.push("discard"),
  };
  const tree = EventDraftPrompt(props);
  assert.match(
    [...nodes(tree)].find((node) => node.type === "Gogo").props.message,
    /Park day/,
  );
  [...nodes(tree)].find((node) => node.type === "Action").props.onPress();
  [...nodes(tree)].find((node) => node.type === "Button").props.onPress();
  assert.deepEqual(actions, ["continue", "discard"]);
  const busy = EventDraftPrompt({ ...props, busy: true });
  assert.ok(
    [...nodes(busy)]
      .filter((node) => ["Action", "Button"].includes(node.type))
      .every((node) => node.props.disabled),
  );
});

test("a draft larger than SecureStore's limit retains its complete Gogo context", async () => {
  storage.clear();
  const draft = saved();
  draft.conversation = {
    messages: [
      { role: "assistant", content: "Tell me more. ".repeat(50), choices: [], section: null, suggestedImpactStory: null },
      { role: "user", content: "A community event with neighbours. ".repeat(50) },
    ],
    addressedSections: ["Links"],
  };
  assert.ok(Buffer.byteLength(JSON.stringify(draft)) > 2048);
  await draftStorage.saveEventDraft(draft);
  assert.deepEqual((await draftStorage.loadEventDrafts())[0].conversation, draft.conversation);
});
