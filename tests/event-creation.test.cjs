const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");
const { buildEventCreationDraft, applyEventCreationUpdates } = loadTypeScript(
  "components/gogo/tasks/eventCreation/draft.ts",
);
const { buildEventDateTimeIso } = loadTypeScript("utils/dateTimeHandler.ts");
const { eventSchema } = loadTypeScript("schemas/event.ts");

function draft() {
  return {
    eventName: "Park day",
    description: "A morning in the park.",
    impactTitle: "",
    impactDescription: "",
    tags: [],
    links: [],
    isPhysicalEvent: true,
    location: "Lagos park",
    registrationType: "registration",
    registrationFee: 0,
    registrationAttendees: 25,
    donationsEnabled: false,
    volunteerRoles: [],
    tickets: [],
    repeat: "NONE",
    isRecurring: false,
    impactSdgGoals: [], impactPaths: [], impactCommitments: [],
    startDate: new Date(2035, 1, 3),
    endDate: new Date(2035, 1, 3),
    startTime: "10:00",
    endTime: "12:00",
  };
}

test("event submission trims a location entered directly in the draft", () => {
  assert.equal(eventSchema.parse({ ...draft(), location: "  Community garden  " }).location, "Community garden");
});
test("registration cannot publish with a cleared price or capacity after removing Apply setup", () => {
  for (const field of ["registrationFee", "registrationAttendees"]) {
    const result = eventSchema.safeParse({ ...draft(), [field]: undefined });
    assert.equal(result.success, false);
    assert.ok(result.error.issues.some(issue => issue.path[0] === field));
  }
});

test("ticket events still require a ticket when publishing without Apply setup", () => {
  const result = eventSchema.safeParse({ ...draft(), registrationType: "ticket", tickets: [] });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some(issue => issue.path[0] === "tickets"));
});
test("an unlimited ticket retains its numeric quantity through setup and publication validation", () => {
  const parsed = eventSchema.parse({ ...draft(), registrationType: "ticket", tickets: [{
    id: "00000000-0000-4000-8000-000000000001", type: "Entry", description: "Event admission", paid: false, limited: false, quantity: 1000000, price: 0,
  }] });
  assert.equal(parsed.tickets[0].quantity, 1000000);
});
test("Gogo receives the same normalized links as event publication without changing editable input", () => {
  const values = { ...draft(), links: ["  www.example.com/park  ", "chat.whatsapp.com/invite", "https://meet.google.com/abc", "  ", ""] };
  const original = [...values.links];
  const context = buildEventCreationDraft(values);
  assert.deepEqual(context.links, ["https://www.example.com/park", "https://chat.whatsapp.com/invite", "https://meet.google.com/abc"]);
  assert.deepEqual(context.links, eventSchema.parse(values).links);
  assert.deepEqual(values.links, original);
});

test("normalizing Gogo links does not silently discard invalid addresses", () => {
  const values = { ...draft(), links: ["not a valid link"] };
  assert.deepEqual(buildEventCreationDraft(values).links, ["https://not a valid link"]);
  const parsed = eventSchema.safeParse(values);
  assert.equal(parsed.success, false);
  assert.ok(parsed.error.issues.some(issue => issue.path[0] === "links"));
});

test("Gogo receives the current draft and role counts without uploading private image data", () => {
  const values = {
    ...draft(),
    eventName: "  Park day  ",
    impactDescription: "  ",
    imgUrl: "file:///private/photo.jpg",
    registrationFee: 1500,
    donationTarget: 1000000,
    tickets: [{}],
    volunteerRoles: [{}],
  };
  const context = buildEventCreationDraft(values);
  assert.equal(context.title, "Park day");
  assert.equal(context.impactDescription, undefined);
  assert.equal(context.registrationFee, 1500);
  assert.equal(context.donationTarget, 1000000);
  assert.equal(context.ticketCount, 1);
  assert.equal(context.volunteerRoleCount, 1);
  assert.equal(
    context.startDate,
    buildEventDateTimeIso(values.startDate, values.startTime),
  );
  assert.equal(context.imgUrl, undefined);
  assert.equal(context.tickets, undefined);
  assert.equal(context.volunteerRoles, undefined);
});
for (const [name, selections, expected] of [
  ["a global goal", { impactSdgGoals: [{ id: "sdg_15" }] }, true],
  ["an impact path", { impactPaths: [{ id: "nature" }] }, true],
  ["a commitment alone", { impactCommitments: [{ id: "plant_trees" }] }, false],
  ["no impact selections", {}, false],
]) {
  test(`Gogo distinguishes ${name} when deciding whether to skip interests`, () => {
    const context = buildEventCreationDraft({ ...draft(), ...selections });
    assert.equal(context.hasImpactGoalOrPath, expected);
  });
}
test("a partial reply preserves untouched manual edits and existing impact selections", () => {
  const form = { ...draft(), impactSdgGoals: [{ id: "sdg_15" }] };
  const calls = [];
  applyEventCreationUpdates(
    (key, value, options) => {
      calls.push(options);
      form[key] = value;
    },
    { title: "Neighbourhood park day", registrationFee: 2000 },
  );
  assert.equal(form.eventName, "Neighbourhood park day");
  assert.equal(form.description, "A morning in the park.");
  assert.equal(form.location, "Lagos park");
  assert.deepEqual(form.impactSdgGoals, [{ id: "sdg_15" }]);
  assert.equal(form.registrationFee, 2000);
  assert.ok(
    calls.every((options) => options.shouldDirty && options.shouldValidate),
  );
});
test("AI datetime updates round-trip through the same local date and time fields as the manual picker", () => {
  const form = draft();
  const iso = "2035-02-03T10:00:00+01:00";
  applyEventCreationUpdates(
    (key, value) => {
      form[key] = value;
    },
    { startDate: iso },
  );
  assert.equal(
    buildEventDateTimeIso(form.startDate, form.startTime),
    new Date(iso).toISOString(),
  );
});

const hooks = { values: [], cursor: 0, effects: [] };
const react = {
  useState(initial) {
    const index = hooks.cursor++;
    if (!(index in hooks.values)) hooks.values[index] = initial;
    return [
      hooks.values[index],
      (next) => {
        hooks.values[index] =
          typeof next === "function" ? next(hooks.values[index]) : next;
      },
    ];
  },
  useRef(initial) {
    const [ref] = react.useState({ current: initial });
    return ref;
  },
  useCallback: (callback) => callback,
  useMemo: (factory) => factory(),
  useEffect: (effect) => hooks.effects.push(effect),
};
let form;
let requests;
let pending;
let respond;
const { useGogoEventCreation: runConversationHook } = loadTypeScript(
  "components/gogo/tasks/eventCreation/useGogoEventCreation.ts",
  {
    react,
    "@/components/gogo/services/api": {
      getEventCreationReply: async (payload, signal) => {
        requests.push({ payload, signal });
        return respond();
      },
    },
    "@tanstack/react-query": {
      useMutation: ({ mutationFn }) => ({
        isPending: pending,
        mutateAsync: async (args) => {
          pending = true;
          try {
            return await mutationFn(args);
          } finally {
            pending = false;
          }
        },
        reset: () => {
          pending = false;
        },
      }),
    },
  },
);
function reset() {
  hooks.values = [];
  hooks.cursor = 0;
  hooks.effects = [];
  form = draft();
  requests = [];
  pending = false;
  keyboardMetrics = undefined;
  keyboardListeners.clear();
  respond = async () => ({
    data: {
      reply: "Where should people meet?",
      choices: ["In person", "Online"],
      section: null,
      suggestedImpactStory: null, updates: { title: "Park gathering" },
    },
  });
}
function renderHook(isDonationEvent = false, initialState) {
  hooks.cursor = 0;
  return runConversationHook({
    getValues: () => form,
    setValue: (key, value) => {
      form[key] = value;
    },
    isDonationEvent,
    initialState,
  });
}
test("a real reply updates the shared form and offers the server's quick choices", async () => {
  reset();
  await renderHook().send("A gathering in the park");
  const state = renderHook();
  assert.equal(form.eventName, "Park gathering");
  assert.equal(requests[0].payload.draft.title, "Park day");
  assert.deepEqual(state.messages.at(-1).choices, ["In person", "Online"]);
  assert.equal(state.error, null);
});
test("switching to manual or opening an editor cancels the reply before it can overwrite edits", async () => {
  reset();
  let resolve;
  respond = () =>
    new Promise((done) => {
      resolve = done;
    });
  const request = renderHook().send("Make it a park gathering");
  renderHook().cancel();
  form.eventName = "My manual title";
  resolve({
    data: {
      reply: "Done",
      choices: [],
      section: null,
      suggestedImpactStory: null, updates: { title: "Stale AI title" },
    },
  });
  await request;
  assert.equal(form.eventName, "My manual title");
  assert.equal(requests[0].signal.aborted, true);
  assert.equal(renderHook().messages.length, 2);
});
test("real failures leave the draft intact and retry does not duplicate the user's message", async () => {
  reset();
  respond = async () => {
    throw new Error("network failed");
  };
  await renderHook().send("Help with my event");
  assert.equal(form.eventName, "Park day");
  assert.match(renderHook().error, /manual form/);
  respond = async () => ({
    data: {
      reply: "Shall we set a date?",
      choices: [],
      section: null,
      suggestedImpactStory: null, updates: {},
    },
  });
  await renderHook().retry();
  assert.equal(
    renderHook().messages.filter((message) => message.role === "user").length,
    1,
  );
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[0].payload.messages, requests[1].payload.messages);
});
test("only one reply can run at a time and requests include current manual changes", async () => {
  reset();
  let resolve;
  respond = () =>
    new Promise((done) => {
      resolve = done;
    });
  const state = renderHook();
  const first = state.send("First");
  await state.send("Duplicate");
  assert.equal(requests.length, 1);
  resolve({
    data: {
      reply: "Ready for details",
      choices: [],
      section: null,
      suggestedImpactStory: null, updates: {},
    },
  });
  await first;
  form.location = "A newly entered venue";
  respond = async () => ({
    data: { reply: "Thanks", choices: [], section: null, updates: {} },
  });
  await renderHook().send("What's next?");
  assert.equal(requests[1].payload.draft.location, "A newly entered venue");
});
test("fundraiser conversations retain the fundraiser entry type", async () => {
  reset();
  form.registrationType = "donation";
  await renderHook(true).send("Support the local school");
  assert.equal(requests[0].payload.eventType, "donation");
  assert.equal(requests[0].payload.draft.registrationType, "donation");
});
test("continuing from links and retrying sends normalized links to Gogo", async () => {
  reset();
  form.links = ["  www.example.com/event  ", ""];
  respond = async () => { throw new Error("offline"); };
  await renderHook().continueFromDraft("Links");
  assert.deepEqual(requests[0].payload.draft.links, ["https://www.example.com/event"]);
  respond = async () => ({ data: { reply: "Ready to review your event?", choices: [], section: "Review", completedSection: null, suggestedImpactStory: null, updates: {} } });
  await renderHook().retry();
  assert.deepEqual(requests[1].payload.draft.links, ["https://www.example.com/event"]);
  assert.equal(renderHook().messages.at(-1).section, "Review");
  assert.equal(renderHook().error, null);
  assert.deepEqual(form.links, ["  www.example.com/event  ", ""]);
});

test("validation error arrays are shown as usable text", async () => {
  reset();
  respond = async () => {
    throw {
      isAxiosError: true,
      response: { data: { message: ["Check the draft", "Please try again"] } },
    };
  };
  await renderHook().send("Help");
  assert.equal(renderHook().error, "Check the draft\nPlease try again");
});

const native = Object.fromEntries(
  ["ScrollView", "Text", "TextInput", "TouchableOpacity", "View"].map(
    (name) => [name, name],
  ),
);
let keyboardMetrics;
const keyboardListeners = new Map();
native.Keyboard = {
  metrics: () => keyboardMetrics,
  addListener: (name, listener) => {
    keyboardListeners.set(name, listener);
    return { remove: () => keyboardListeners.delete(name) };
  },
};
const { default: GogoEventCreator } = loadTypeScript(
  "components/gogo/tasks/eventCreation/GogoEventCreator.tsx",
  {
    react,
    "react-native": native,
    "@/components/buttons/CustomBtn1": { default: "ActionButton" },
    "@/components/ui/AppLoader": { default: "SmallGogoLoader" },
    "@/components/gogo/mascot/GatherGoMascot": { GatherGoMascot: "WavingGogo" },
    "lucide-react-native": { ArrowUp: "Arrow", ArrowUpRight: "Arrow" },
    twrnc: { default: () => ({}) },
  },
);
function* nodes(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity))
    yield* nodes(child);
}
function text(node) {
  return [...nodes(node)]
    .flatMap((n) =>
      [n.props?.children].flat(Infinity).filter((v) => typeof v === "string"),
    )
    .join(" ");
}
function screen(overrides = {}) {
  hooks.cursor = 0;
  return GogoEventCreator({
    conversation: {
      messages: [
        {
          role: "assistant",
          content: "How will people attend?",
          choices: ["In person", "Online"],
          section: null,
        },
      ],
      send: (value) => requests.push(value),
      isPending: false,
      error: null,
    },
    onOpenSection: (section) => requests.push(section),
    onReview: () => requests.push("review"),
    isDonationEvent: false,
    draftTitle: "",
    impactStory: "",
    renderInlineSection: () => null,
    ...overrides,
  });
}
test("Gogo shows only the current question and its choices", () => {
  reset();
  form.eventName = "";
  const tree = screen({
    conversation: {
      messages: [
        {
          role: "assistant",
          content: "An earlier question",
          choices: ["Old choice"],
          section: null,
        },
        { role: "user", content: "An earlier answer" },
        {
          role: "assistant",
          content: "How will people attend?",
          choices: ["In person", "Online"],
          section: null,
        },
      ],
      send: (value) => requests.push(value),
      isPending: false,
      error: null,
    },
  });
  assert.ok(text(tree).includes("How will people attend?"));
  assert.equal(text(tree).includes("An earlier question"), false);
  assert.equal(text(tree).includes("An earlier answer"), false);
  assert.equal(text(tree).includes("Old choice"), false);
  assert.equal(
    [...nodes(tree)].some((node) => node.props?.horizontal),
    false,
  );
  const choice = [...nodes(tree)].find(
    (node) => node.type === "TouchableOpacity" && text(node) === "In person",
  );
  choice.props.onPress();
  assert.deepEqual(requests, ["In person"]);
  assert.equal(
    [...nodes(tree)].some((node) => node.type === "TextInput"),
    false,
  );
});
test("the one relevant editor opens directly beneath Gogo's question", () => {
  reset();
  form.eventName = "";
  const props = {
    conversation: {
      messages: [
        {
          role: "assistant",
          content: "When should people meet?",
          choices: [],
          section: "Date and Time",
        },
      ],
      send: (value) => requests.push(value),
      isPending: false,
      error: null,
    },
  };
  const tree = screen(props);
  const actions = [...nodes(tree)].filter(
    (node) => node.type === "ActionButton",
  );
  assert.deepEqual(
    actions.map((node) => node.props.title),
    ["Choose date & time"],
  );
  actions[0].props.onPress();
  assert.deepEqual(requests, ["Date and Time"]);
  assert.equal(
    [...nodes(tree)].some((node) => node.type === "TextInput"),
    false,
  );
  [...nodes(tree)]
    .find(
      (node) =>
        node.type === "TouchableOpacity" &&
        text(node) === "Answer in my own words",
    )
    .props.onPress();
  const customAnswer = screen(props);
  assert.ok([...nodes(customAnswer)].some((node) => node.type === "TextInput"));
  assert.deepEqual(
    [...nodes(customAnswer)]
      .filter((node) => node.type === "ActionButton")
      .map((node) => node.props.title),
    ["Continue"],
  );
  [...nodes(customAnswer)]
    .find(
      (node) =>
        node.type === "TouchableOpacity" &&
        text(node) === "Use suggested options",
    )
    .props.onPress();
  assert.equal(
    [...nodes(screen(props))].some((node) => node.type === "TextInput"),
    false,
  );
});
test("a typed answer continues naturally without a persistent chat toolbar", () => {
  reset();
  form.eventName = "";
  const props = {
    conversation: {
      messages: [
        {
          role: "assistant",
          content: "What’s your idea?",
          choices: [],
          section: null,
        },
      ],
      send: (value) => requests.push(value),
      isPending: false,
      error: null,
    },
  };
  [...nodes(screen(props))]
    .find((node) => node.type === "TextInput")
    .props.onChangeText("A live music evening");
  const action = [...nodes(screen(props))].find(
    (node) => node.type === "ActionButton",
  );
  assert.equal(action.props.title, "Continue");
  assert.equal(action.props.disabled, false);
  action.props.onPress();
  assert.deepEqual(requests, ["A live music evening"]);
  const waiting = screen({
    conversation: { ...props.conversation, isPending: true },
  });
  assert.equal(
    [...nodes(waiting)].filter((node) => node.type === "SmallGogoLoader")
      .length,
    1,
  );
  assert.equal(
    [...nodes(waiting)].some(
      (node) =>
        node.type === "TextInput" ||
        node.type === "ActionButton" ||
        node.type === "WavingGogo",
    ),
    false,
  );
});
test("Gogo’s review prompt opens the manual form without publishing", () => {
  reset();
  const tree = screen({
    conversation: {
      messages: [
        {
          role: "assistant",
          content: "Ready to review your event?",
          choices: [],
          section: "Review",
        },
      ],
      isPending: false,
      error: null,
    },
  });
  const actions = [...nodes(tree)].filter(
    (node) => node.type === "ActionButton",
  );
  assert.deepEqual(
    actions.map((node) => node.props.title),
    ["Review event"],
  );
  actions[0].props.onPress();
  assert.deepEqual(requests, ["review"]);
  assert.equal(
    [...nodes(tree)].some((node) => node.type === "TextInput"),
    false,
  );
});
test("provider failures show a single retry action without pretending the draft changed", () => {
  reset();
  const before = { ...form };
  const tree = screen({
    conversation: {
      messages: [
        {
          role: "assistant",
          content: "What’s your idea?",
          choices: [],
          section: null,
        },
      ],
      isPending: false,
      error: "Gogo is unavailable right now.",
      retry: () => requests.push("retry"),
    },
  });
  const actions = [...nodes(tree)].filter(
    (node) => node.type === "ActionButton",
  );
  assert.deepEqual(
    actions.map((node) => node.props.title),
    ["Try again"],
  );
  actions[0].props.onPress();
  assert.deepEqual(requests, ["retry"]);
  assert.deepEqual(form, before);
});

let published;
let savedDrafts = [];
let discardFailure = false;
let draftLoad;
const discardedTypes = [];
const focusCallbacks = [];
const uiCalls = [];
const uiComponents = Object.fromEntries(
  [
    ["buttons/SheetCloseButton", "CloseButton"],
    ["CustomeTopBarNav", "TopBar"],
    ["EventImagePicket", "CoverPicker"],
    ["View", "CustomView"],
    ["buttons/CustomBtn1", "PublishButton"],
    ["eventInfo/CreateTicket", "TicketEditor"],
    ["eventInfo/DateAndTime", "DatePicker"],
    ["eventInfo/EventLinks", "LinksEditor"],
    ["eventInfo/EventStoryFields", "StoryEditor"],
    ["eventInfo/VolunteerSetupFields", "VolunteerEditor"],
    ["eventInfo/EventFundraisingFields", "FundraisingEditor"],
    ["eventInfo/Location", "LocationEditor"],
    ["eventInfo/Pricing", "PricingEditor"],
    ["inputs/CustomInput1", "Input"],
    ["labels/FormLabel", "Label"],
    ["gogo/tasks/eventCreation/EventTypePicker", "EventTypePicker"],
    ["gogo/tasks/eventCreation/EventDraftPrompt", "DraftPrompt"],
    ["ui/ImpactPageLoader", "PageLoader"],
  ].map(([path, component]) => [
    `@/components/${path}`,
    { default: component },
  ]),
);
const eventPlatform = { OS: "ios" };
const uiConversation = {
  cancel: () => uiCalls.push("cancel"),
  continueFromDraft: () => uiCalls.push("continue"),
  messages: [],
  send() {},
};
const uiFormHooks = {
  Controller: "Controller",
  useForm: () => ({
    control: {},
    formState: { errors: {} },
    watch: (name) => (name ? form[name] : form),
    getValues: () => form,
    setValue: (key, value) => {
      form[key] = value;
    },
    clearErrors() {},
    reset() {},
    trigger: async () => true,
    handleSubmit: (submit) => () => submit(form),
  }),
};
const { default: NewEvent } = loadTypeScript("app/(app)/new-event.tsx", {
  ...uiComponents,
  "@/components/gogo/tasks/eventCreation/GogoEventCreator": { default: "GogoCreator" },
  react,
  "react-native": {
    ...native,
    Modal: "Modal",
    KeyboardAvoidingView: "KeyboardAvoidingView",
    Platform: eventPlatform,
  },
  twrnc: { default: () => ({}) },
  "lucide-react-native": { CheckCheck: "Check" },
  "expo-router": { useFocusEffect: callback => focusCallbacks.push(callback) },
  "@/components/gogo/mascot/MascotMoment": { MascotMoment: "GogoMoment" },
  "@/components/gogo/tasks/eventCreation/draftStorage": {
    loadEventDrafts: () => draftLoad ? draftLoad() : Promise.resolve(savedDrafts),
    discardEventDraft: async type => { if (discardFailure) throw new Error("storage error"); discardedTypes.push(type); },
  },
  "@/components/gogo/tasks/eventCreation/useEventDraftPersistence": {
    useEventDraftPersistence: () => ({ flush: async () => {}, clear: async () => {} }),
  },
  "@/components/gogo/tasks/eventCreation/useGogoEventCreation": {
    useGogoEventCreation: () => uiConversation,
  },
  "@/utils/navigation": {
    useLockedRouter: () => ({ replace: (route) => uiCalls.push(route) }),
  },
  "@/utils/globalErrorHandler": {
    showGlobalError: (value) => uiCalls.push(value),
    showGlobalSuccess() {},
  },
  "@/utils/storage": {
    getItem: async () => null,
    removeItem: async () => {},
    saveItem: async () => {},
  },
  "@/utils/utils": {
    convertUndefinedToNull: (value) => value,
    objectToFormData: (value) => value,
  },
  "@/services/mutations": {
    useCreateEvent: () => ({
      isPending: false,
      mutateAsync: async (payload) => {
        published = payload;
      },
    }),
  },
  "@hookform/resolvers/zod": { zodResolver: () => () => {} },
  "react-hook-form": uiFormHooks,
});
function eventScreen() {
  if (!hooks.values[0]) hooks.values[0] = { kind: "picker" };
  hooks.cursor = 0;
  let tree = NewEvent();
  if (typeof tree.type !== "function") {
    [...nodes(tree)].find(node => node.type === "EventTypePicker").props.onSelect(form.registrationType);
    hooks.cursor = 0;
    tree = NewEvent();
  }
  return tree.type(tree.props);
}
function manualForm() {
  [...nodes(eventScreen())]
    .find(
      (node) =>
        node.props?.accessibilityRole === "button" &&
        text(node) === "Use manual form",
    )
    .props.onPress();
  return eventScreen();
}
test("the creation page keeps a single shared draft across Gogo and manual modes", () => {
  reset();
  uiCalls.length = 0;
  published = undefined;
  assert.ok(
    [...nodes(eventScreen())].some((node) => node.type === "GogoCreator"),
  );
  form.eventName = "Gogo's proposed name";
  let tree = manualForm();
  const field = [...nodes(tree)].find(
    (node) => node.type === "Controller" && node.props.name === "eventName",
  );
  assert.equal(
    [
      ...nodes(
        field.props.render({ field: { value: form.eventName, onChange() {} } }),
      ),
    ].find((node) => node.type === "Input").props.value,
    "Gogo's proposed name",
  );
  form.eventName = "An organiser's manual edit";
  [...nodes(tree)]
    .find(
      (node) =>
        node.props?.accessibilityRole === "button" &&
        text(node) === "Let Gogo guide me",
    )
    .props.onPress();
  tree = eventScreen();
  assert.ok([...nodes(tree)].some((node) => node.type === "GogoCreator"));
  assert.equal(form.eventName, "An organiser's manual edit");
  assert.deepEqual(uiCalls, ["cancel", "continue"]);
  assert.equal(published, undefined);
});
test("date and pricing shortcuts read the latest shared draft and cancel pending replies", () => {
  reset();
  uiCalls.length = 0;
  const open = [...nodes(eventScreen())].find(
    (node) => node.type === "GogoCreator",
  ).props.onOpenSection;
  form.startDate = new Date(2035, 4, 5);
  form.startTime = "15:30";
  open("Date and Time");
  let picker = [...nodes(eventScreen())].find(
    (node) => node.type === "DatePicker",
  );
  assert.equal(picker.props.initialData.startTime, "15:30");
  assert.equal(
    picker.props.initialData.startDate.getTime(),
    form.startDate.getTime(),
  );
  form.registrationFee = 2500;
  open("Pricing");
  const creator = [...nodes(eventScreen())].find(node => node.type === "GogoCreator");
  const pricing = creator.props.renderInlineSection("Pricing");
  assert.equal(pricing.props.initialData.registrationFee, 2500);
  assert.equal(pricing.props.initialData.paid, true);
  assert.deepEqual(uiCalls, ["cancel", "cancel"]);
});
test("publishing remains an explicit action in the manual review form", async () => {
  reset();
  published = undefined;
  const tree = manualForm();
  assert.equal(published, undefined);
  await [...nodes(tree)]
    .find((node) => node.type === "PublishButton")
    .props.onPress();
  assert.equal(published.title, form.eventName);
  assert.equal(
    published.startDate,
    buildEventDateTimeIso(form.startDate, form.startTime),
  );
  assert.equal(published.registrationType, "registration");
});
test("invalid dates open the existing date editor instead of sending a create request", async () => {
  reset();
  published = undefined;
  form.endTime = "09:00";
  const tree = manualForm();
  await [...nodes(tree)]
    .find((node) => node.type === "PublishButton")
    .props.onPress();
  assert.equal(published, undefined);
  assert.ok(
    [...nodes(eventScreen())].some((node) => node.type === "DatePicker"),
  );
});

test("partially discussed dates survive opening the date picker without inventing an end time", () => {
  reset();
  form.endDate = undefined;
  form.endTime = undefined;
  [...nodes(eventScreen())]
    .find((node) => node.type === "GogoCreator")
    .props.onOpenSection("Date and Time");
  const initial = [...nodes(eventScreen())].find(
    (node) => node.type === "DatePicker",
  ).props.initialData;
  assert.equal(initial.startTime, "10:00");
  assert.equal(initial.endDate, undefined);
  assert.equal(initial.endTime, undefined);
});
test("publishing converts local wall times to UTC in Lagos and across daylight saving changes", () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = "Africa/Lagos";
    assert.equal(
      buildEventDateTimeIso(new Date(2035, 1, 3), "10:00"),
      "2035-02-03T09:00:00.000Z",
    );
    process.env.TZ = "America/New_York";
    assert.equal(
      buildEventDateTimeIso(new Date(2035, 0, 3), "10:00"),
      "2035-01-03T15:00:00.000Z",
    );
    assert.equal(
      buildEventDateTimeIso(new Date(2035, 6, 3), "23:59", {
        endOfMinute: true,
      }),
      "2035-07-04T03:59:59.000Z",
    );
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test("finishing a date or pricing editor advances Gogo using the actual updated draft", () => {
  reset();
  uiCalls.length = 0;
  const open = [...nodes(eventScreen())].find(
    (node) => node.type === "GogoCreator",
  ).props.onOpenSection;
  open("Date and Time");
  const dates = { ...form, startTime: "15:00", endTime: "17:00" };
  [...nodes(eventScreen())]
    .find((node) => node.type === "DatePicker")
    .props.onSave(dates);
  assert.equal(form.startTime, "15:00");
  assert.equal(
    [...nodes(eventScreen())].find((node) => node.type === "Modal").props
      .visible,
    false,
  );
  open("Pricing");
  [...nodes(eventScreen())].find(node => node.type === "GogoCreator")
    .props.renderInlineSection("Pricing").props.onSave({
      registrationType: "registration",
      registrationFee: 1500,
      registrationAttendees: 30,
      tickets: [],
    });
  assert.equal(form.registrationFee, 1500);
  assert.deepEqual(uiCalls, ["cancel", "continue", "cancel", "continue"]);
});
test("closing an editor does not advance; finishing the story editor does", async () => {
  reset();
  uiCalls.length = 0;
  const open = [...nodes(eventScreen())].find(
    (node) => node.type === "GogoCreator",
  ).props.onOpenSection;
  open("Story");
  [...nodes(eventScreen())]
    .find(
      (node) =>
        node.type === "CloseButton" &&
        node.props.accessibilityLabel === "Close event section",
    )
    .props.onPress();
  assert.deepEqual(uiCalls, ["cancel"]);
  open("Story");
  await [...nodes(eventScreen())]
    .find(
      (node) =>
        node.type === "PublishButton" &&
        node.props.title === "Continue with Gogo",
    )
    .props.onPress();
  assert.deepEqual(uiCalls, ["cancel", "cancel", "continue"]);
});
test("continuing after an editor sends its current values without creating an event", async () => {
  reset();
  form.location = "A venue just chosen in the editor";
  await renderHook().continueFromDraft();
  assert.equal(
    requests[0].payload.draft.location,
    "A venue just chosen in the editor",
  );
  assert.equal(requests[0].payload.messages.at(-1).role, "user");
  assert.match(
    requests[0].payload.messages.at(-1).content,
    /updated the draft/,
  );
});

test("the focused Gogo answer stays in view when the keyboard shrinks the viewport", () => {
  reset();
  const tree = screen({
    conversation: {
      messages: [
        {
          role: "assistant",
          content: "What’s your idea?",
          choices: [],
          section: null,
        },
      ],
      isPending: false,
      error: null,
    },
  });
  const scroll = [...nodes(tree)].find((node) => node.type === "ScrollView");
  const content = [...nodes(tree)].find(
    (node) => node.type === "View" && Array.isArray(node.props.style),
  );
  const input = [...nodes(tree)].find((node) => node.type === "TextInput");
  const host = {};
  let viewportHeight = 640;
  let contentHeight = 640;
  let inputTop = 380;
  let scrollOffset = 0;
  const nativeInput = {
    isFocused: () => true,
    measureLayout: (ancestor, measured) => {
      assert.equal(ancestor, host);
      measured(0, inputTop, 280, 100);
    },
  };
  tree.props.ref.current = {
    measureInWindow: (measured) => measured(0, 100, 320, viewportHeight),
  };
  scroll.props.ref.current = {
    scrollTo: ({ y }) => {
      scrollOffset = Math.min(y, Math.max(0, contentHeight - viewportHeight));
    },
  };
  content.props.ref.current = host;
  input.props.ref.current = nativeInput;
  input.props.onFocus();
  assert.equal(scrollOffset, 0);
  viewportHeight = 260;
  contentHeight = 600;
  inputTop = 320;
  scroll.props.onLayout();
  assert.ok(inputTop - scrollOffset >= 0);
  assert.ok(inputTop - scrollOffset + 100 <= viewportHeight);
  inputTop = 400;
  contentHeight = 700;
  scroll.props.onContentSizeChange(320, contentHeight);
  assert.ok(inputTop - scrollOffset + 100 <= viewportHeight);
});
test("keyboard layout changes do not move a blurred or unmounted Gogo input", () => {
  reset();
  const tree = screen({
    conversation: {
      messages: [
        {
          role: "assistant",
          content: "What’s your idea?",
          choices: [],
          section: null,
        },
      ],
      isPending: false,
      error: null,
    },
  });
  const scroll = [...nodes(tree)].find((node) => node.type === "ScrollView");
  const content = [...nodes(tree)].find(
    (node) => node.type === "View" && Array.isArray(node.props.style),
  );
  const input = [...nodes(tree)].find((node) => node.type === "TextInput");
  let focused = false;
  let measured;
  const offsets = [];
  tree.props.ref.current = {
    measureInWindow: (measured) => measured(0, 100, 320, 600),
  };
  scroll.props.ref.current = {
    scrollTo: (offset) => offsets.push(offset),
  };
  content.props.ref.current = {};
  input.props.ref.current = {
    isFocused: () => focused,
    measureLayout: (_ancestor, callback) => {
      measured = callback;
    },
  };
  scroll.props.onLayout();
  assert.equal(measured, undefined);
  focused = true;
  input.props.onFocus();
  focused = false;
  measured(0, 300, 280, 100);
  assert.deepEqual(offsets, []);
  focused = true;
  input.props.onFocus();
  input.props.ref.current = null;
  measured(0, 300, 280, 100);
  assert.deepEqual(offsets, []);
});

function keyboardAnswer() {
  const options = {
    conversation: {
      messages: [
        {
          role: "assistant",
          content: "What’s your idea?",
          choices: [],
          section: null,
        },
      ],
      isPending: false,
      error: null,
    },
  };
  const render = () => screen(options);
  const tree = render();
  const scroll = [...nodes(tree)].find((node) => node.type === "ScrollView");
  const input = [...nodes(tree)].find((node) => node.type === "TextInput");
  const content = [...nodes(tree)].find(
    (node) => node.type === "View" && Array.isArray(node.props.style),
  );
  const frame = {
    top: 100,
    height: 600,
    contentHeight: 600,
    inputTop: 440,
    offset: 0,
  };
  tree.props.ref.current = {
    measureInWindow: (measured) => measured(0, frame.top, 320, frame.height),
  };
  scroll.props.ref.current = {
    scrollTo: ({ y }) => {
      const padding = [...nodes(render())].find(
        (node) => node.type === "ScrollView",
      ).props.contentContainerStyle.paddingBottom;
      frame.offset = Math.min(
        y,
        Math.max(0, frame.contentHeight + padding - frame.height),
      );
    },
  };
  content.props.ref.current = {};
  input.props.ref.current = {
    isFocused: () => true,
    measureLayout: (_ancestor, measured) => {
      const height = [...nodes(render())]
        .find((node) => node.type === "TextInput")
        .props.style.at(-1).minHeight;
      measured(0, frame.inputTop, 280, height);
    },
  };
  const cleanup = hooks.effects[0]();
  const keyboard = (name, top) => {
    keyboardMetrics = name === "keyboardDidHide" ? undefined : { screenY: top };
    keyboardListeners.get(name)({ endCoordinates: keyboardMetrics });
  };
  const assertVisible = () => {
    const style = [...nodes(render())]
      .find((node) => node.type === "TextInput")
      .props.style.at(-1);
    const visibleHeight = Math.min(
      frame.height,
      (keyboardMetrics?.screenY ?? frame.top + frame.height) - frame.top,
    );
    assert.ok(frame.inputTop - frame.offset >= 0);
    assert.ok(frame.inputTop - frame.offset + style.minHeight <= visibleHeight);
  };
  return {
    render,
    get scroll() {
      return [...nodes(render())].find((node) => node.type === "ScrollView");
    },
    viewport: tree,
    input,
    content,
    frame,
    cleanup,
    keyboard,
    assertVisible,
  };
}

test("Gogo reserves actual keyboard overlap even when the window does not resize, without doubling resized insets", () => {
  reset();
  const ui = keyboardAnswer();
  ui.input.props.onFocus();
  ui.keyboard("keyboardDidShow", 420);
  assert.equal(ui.scroll.props.contentContainerStyle.paddingBottom, 280);
  ui.scroll.props.onContentSizeChange(320, 880);
  ui.assertVisible();
  ui.keyboard("keyboardDidChangeFrame", 360);
  assert.equal(ui.scroll.props.contentContainerStyle.paddingBottom, 340);
  ui.assertVisible();
  ui.frame.height = 260;
  ui.frame.inputTop = 300;
  ui.scroll.props.onLayout();
  assert.equal(ui.scroll.props.contentContainerStyle.paddingBottom, 0);
  ui.assertVisible();
  ui.keyboard("keyboardDidHide");
  assert.equal(ui.scroll.props.contentContainerStyle.paddingBottom, 0);
  assert.equal(
    [...nodes(ui.render())]
      .find((node) => node.type === "TextInput")
      .props.style.at(-1).maxHeight,
    160,
  );
  ui.cleanup();
  assert.equal(keyboardListeners.size, 0);
});

test("the whole multiline Gogo field fits a compact keyboard viewport and repositions as text and layout change", () => {
  reset();
  const ui = keyboardAnswer();
  keyboardMetrics = { screenY: 200 };
  ui.input.props.onFocus();
  const input = [...nodes(ui.render())].find(
    (node) => node.type === "TextInput",
  );
  assert.deepEqual(input.props.style.at(-1), { minHeight: 68, maxHeight: 68 });
  ui.assertVisible();
  ui.frame.inputTop = 480;
  input.props.onContentSizeChange();
  ui.assertVisible();
  ui.frame.inputTop = 360;
  ui.content.props.onLayout();
  ui.assertVisible();
  ui.frame.inputTop = 410;
  input.props.onLayout();
  ui.assertVisible();
  ui.cleanup();
});

test("an outstanding viewport measurement cannot scroll or change an unmounted Gogo input", () => {
  reset();
  const ui = keyboardAnswer();
  let finishMeasurement;
  ui.viewport.props.ref.current.measureInWindow = (callback) => {
    finishMeasurement = callback;
  };
  ui.input.props.onFocus();
  ui.input.props.ref.current = null;
  finishMeasurement(0, 100, 320, 100);
  assert.equal(ui.frame.offset, 0);
  assert.equal(ui.scroll.props.contentContainerStyle.paddingBottom, 0);
  ui.cleanup();
});
test("event creation enables native keyboard avoidance on Android and iOS", () => {
  reset();
  try {
    eventPlatform.OS = "android";
    assert.equal(eventScreen().props.behavior, "height");
    eventPlatform.OS = "ios";
    assert.equal(eventScreen().props.behavior, "padding");
  } finally {
    eventPlatform.OS = "ios";
  }
});


test("a single opening reply applies suggested copy and all extracted event details", async () => {
  reset();
  respond = async () => ({ data: { reply: "How about Park morning?", choices: [], section: "Impact story", completedSection: null,
    suggestedImpactStory: null, updates: { title: "Park morning", description: "Meet neighbours for a morning in the park.",
      startDate: "2035-02-03T10:00:00+01:00", endDate: "2035-02-03T12:00:00+01:00",
      isPhysicalEvent: true, location: "Freedom Park", registrationType: "registration", registrationFee: 1500, registrationAttendees: 25 } } });
  await renderHook().send("A park morning at Freedom Park on 3 February 2035, 10am to noon, ₦1,500 for 25 people");
  assert.equal(form.eventName, "Park morning");
  assert.equal(form.description, "Meet neighbours for a morning in the park.");
  assert.equal(form.location, "Freedom Park");
  assert.equal(form.registrationFee, 1500);
  assert.equal(buildEventDateTimeIso(form.startDate, form.startTime), "2035-02-03T09:00:00.000Z");
  assert.deepEqual(requests[0].payload.addressedSections, []);
});
test("optional skips and retries retain the skip without duplicating it", async () => {
  reset();
  respond = async () => ({ data: { reply: "Want an impact story?", choices: [], section: "Impact story", completedSection: null, suggestedImpactStory: null, updates: {} } });
  await renderHook().send("Next");
  assert.equal(renderHook().optionalSection, "Impact story");
  respond = async () => { throw new Error("offline"); };
  await renderHook().skipSection();
  assert.deepEqual(requests.at(-1).payload.addressedSections, ["Impact story"]);
  respond = async () => ({ data: { reply: "Any useful links?", choices: [], section: "Links", completedSection: null, updates: {} } });
  await renderHook().retry();
  assert.deepEqual(requests.at(-1).payload.addressedSections, ["Impact story"]);
  assert.equal(renderHook().optionalSection, "Links");
  await renderHook().continueFromDraft("Links");
  assert.deepEqual(requests.at(-1).payload.addressedSections, ["Impact story", "Links"]);
});
test("a natural-language skip is retained from the validated model reply", async () => {
  reset();
  respond = async () => ({ data: { reply: "Any links?", choices: [], section: "Links", completedSection: "Impact story", suggestedImpactStory: null, updates: {} } });
  await renderHook().send("No thanks, skip that story");
  await renderHook().send("Tell me about links");
  assert.deepEqual(requests[1].payload.addressedSections, ["Impact story"]);
});
test("volunteer-only requirements cannot be skipped from the guided screen", async () => {
  reset(); form.registrationType = "volunteer";
  respond = async () => ({ data: { reply: "Add roles", choices: [], section: "Volunteering", completedSection: null, updates: {} } });
  await renderHook().send("Next");
  assert.equal(renderHook().optionalSection, undefined);
  await renderHook().skipSection();
  assert.equal(requests.length, 1);
});
test("optional invitations show a working skip action alongside the current editor", () => {
  reset();
  const tree = screen({ conversation: { messages: [{ role: "assistant", content: "Choose a few interests", choices: [], section: "Interests" }],
    isPending: false, error: null, optionalSection: "Interests", skipSection: () => requests.push("skip"), send() {} } });
  assert.match(text(tree), /Skip for now/);
  assert.ok([...nodes(tree)].some(node => node.props?.title === "Choose event interests"));
  [...nodes(tree)].find(node => node.type === "TouchableOpacity" && text(node) === "Skip for now").props.onPress();
  assert.deepEqual(requests, ["skip"]);
});
test("optional steps open only their own existing form editor", () => {
  for (const section of ["Impact story", "Impact map", "Interests"]) {
    reset();
    [...nodes(eventScreen())].find(node => node.type === "GogoCreator").props.onOpenSection(section);
    const editor = [...nodes(eventScreen())].find(node => node.type === "StoryEditor");
    assert.equal(editor.props.section, section);
  }
});

test("the first page selects participation before mounting the shared creation form", () => {
  for (const type of ["donation", "ticket", "registration", "volunteer"]) {
    reset(); hooks.cursor = 0; hooks.values[0] = { kind: "picker" };
    let entry = NewEvent();
    assert.equal([...nodes(entry)].some(node => node.type === "GogoCreator"), false);
    [...nodes(entry)].find(node => node.type === "EventTypePicker").props.onSelect(type);
    hooks.cursor = 0; entry = NewEvent();
    assert.equal(entry.props.participationType, type);
  }
});
test("location and participation editors stay inline beneath Gogo without opening a modal", async () => {
  reset(); uiCalls.length = 0;
  const creator = [...nodes(eventScreen())].find(node => node.type === "GogoCreator");
  const controller = creator.props.renderInlineSection("Location");
  const location = [...nodes(controller.props.render({ field: { value: form.location, onChange: value => { form.location = value; } } }))].find(node => node.type === "LocationEditor");
  location.props.onChange({ location: "A new venue", isPhysicalEvent: true });
  assert.deepEqual(uiCalls, []);
  location.props.onSave();
  await Promise.resolve();
  assert.equal(form.location, "A new venue");
  assert.ok([...nodes(eventScreen())].filter(node => node.type === "Modal").every(node => node.props.visible === false));
  const pricing = creator.props.renderInlineSection("Pricing");
  assert.deepEqual(pricing.props.allowedRegistrationTypes, ["registration"]);
  assert.deepEqual(uiCalls, ["continue"]);
});
test("manual location changes update the shared draft without an Apply location action", () => {
  reset(); uiCalls.length = 0;
  const tree = manualForm();
  const controller = [...nodes(tree)].find(node => node.type === "Controller" && node.props.name === "location");
  const location = [...nodes(controller.props.render({ field: { value: form.location, onChange: value => { form.location = value; } } }))].find(node => node.type === "LocationEditor");
  assert.equal(location.props.onSave, undefined);
  location.props.onChange({ location: "Community garden", isPhysicalEvent: true });
  assert.equal(form.location, "Community garden");
  location.props.onChange({ location: "", isPhysicalEvent: false });
  assert.equal(form.location, "");
  assert.equal(form.isPhysicalEvent, false);
  assert.equal(uiCalls.includes("continue"), false);
});
test("manual registration and ticket setup update the shared draft without advancing Gogo", () => {
  for (const registrationType of ["registration", "ticket"]) {
    reset(); form.registrationType = registrationType; uiCalls.length = 0;
    const pricing = [...nodes(manualForm())].find(node => node.type === "PricingEditor");
    assert.equal(pricing.props.onSave, undefined);
    pricing.props.onChange({ registrationType, paid: true, registrationFee: 1500, limited: true, registrationAttendees: 30, tickets: [] });
    assert.equal(form.registrationFee, 1500);
    assert.equal(form.registrationAttendees, 30);
    assert.equal(uiCalls.includes("continue"), false);
  }
});
const { default: EditEvent } = loadTypeScript("app/(app)/event/edit/[id].tsx", {
  ...uiComponents,
  react,
  "react-native": { ...native, Modal: "Modal", KeyboardAvoidingView: "KeyboardAvoidingView", Platform: eventPlatform },
  twrnc: { default: () => ({}) },
  "expo-router": { useLocalSearchParams: () => ({ id: "event" }) },
  "@/utils/navigation": { useLockedRouter: () => ({ replace() {} }) },
  "@/utils/globalErrorHandler": { showGlobalError() {}, showGlobalSuccess() {}, showGlobalWarning() {} },
  "@/utils/utils": { objectToFormData: value => value },
  "@/services/queries": { useEventDetails: () => ({ data: { data: {
    ...form, id: "event", title: form.eventName, startDate: form.startDate.toISOString(), endDate: form.endDate.toISOString(),
  } }, isPending: false, isError: false }) },
  "@/services/mutations": { useUpdateEvent: () => ({ mutateAsync: async () => uiCalls.push("update event"), isPending: false }) },
  "@hookform/resolvers/zod": { zodResolver: () => () => {} },
  "react-hook-form": uiFormHooks,
});
test("the event-edit sheet cancels staged location edits and commits them only on confirmation", () => {
  reset(); uiCalls.length = 0;
  const originalLocation = form.location;
  const render = () => { hooks.cursor = 0; return EditEvent(); };
  const open = () => [...nodes(render())].find(node => node.type === "TouchableOpacity" &&
    [...nodes(node)].some(child => child.type === "Text" && child.props.children === "Location")).props.onPress();
  const editor = () => {
    const controller = [...nodes(render())].find(node => node.type === "Controller" && node.props.name === "location");
    return [...nodes(controller.props.render({ field: { value: form.location, onChange: value => { form.location = value; } } }))].find(node => node.type === "LocationEditor");
  };
  open();
  editor().props.onChange({ location: "Cancelled venue", isPhysicalEvent: true });
  assert.equal(form.location, originalLocation);
  [...nodes(render())].find(node => node.type === "Modal" && node.props.visible).props.onRequestClose();
  open();
  assert.equal(editor().props.value, originalLocation);
  editor().props.onChange({ location: "Confirmed venue", isPhysicalEvent: true });
  editor().props.onSave();
  assert.equal(form.location, "Confirmed venue");
  assert.equal([...nodes(render())].some(node => node.type === "Modal" && node.props.visible), false);
  assert.equal(uiCalls.includes("update event"), false);
});
test("the fundraising goal is a direct form input with naira-to-kobo conversion", () => {
  reset(); form.registrationType = "donation"; form.donationTarget = undefined;
  const creator = [...nodes(eventScreen())].find(node => node.type === "GogoCreator");
  const inline = creator.props.renderInlineSection("Pricing");
  assert.equal([...nodes(inline)].some(node => node.type === "PricingEditor"), false);
  const field = [...nodes(inline)].find(node => node.type === "Controller");
  const input = field.props.render({ field: { value: undefined, onChange: value => { form.donationTarget = value; } }, fieldState: {} });
  input.props.onChangeText("10000");
  assert.equal(form.donationTarget, 1000000);
  assert.ok([...nodes(eventScreen())].filter(node => node.type === "Modal").every(node => node.props.visible === false));
});
test("an impact-story proposal stays out of the event until accepted", async () => {
  reset(); form.impactDescription = "";
  respond = async () => ({ data: { reply: "How does this sound?", choices: [], section: "Impact story", completedSection: null, suggestedImpactStory: "Restore our neighbourhood park together.", updates: {} } });
  await renderHook().send("Help with our story");
  assert.equal(form.impactDescription, "");
  assert.equal(renderHook().suggestedImpactStory, "Restore our neighbourhood park together.");
  respond = async () => ({ data: { reply: "Let’s explore ideas.", choices: [], section: "Impact map", completedSection: null, suggestedImpactStory: null, updates: {} } });
  await renderHook().acceptImpactStory();
  assert.equal(form.impactDescription, "Restore our neighbourhood park together.");
  assert.equal(requests.at(-1).payload.draft.impactDescription, form.impactDescription);
  assert.deepEqual(requests.at(-1).payload.addressedSections, ["Impact story"]);
});
test("skipping a proposed impact story leaves the event story empty", async () => {
  reset(); form.impactDescription = "";
  respond = async () => ({ data: { reply: "How does this sound?", choices: [], section: "Impact story", completedSection: null, suggestedImpactStory: "Restore our park together.", updates: {} } });
  await renderHook().send("Next");
  respond = async () => ({ data: { reply: "Any links?", choices: [], section: "Links", completedSection: null, suggestedImpactStory: null, updates: {} } });
  await renderHook().skipSection();
  assert.equal(form.impactDescription, "");
  assert.equal(renderHook().suggestedImpactStory, null);
});
test("Gogo shows the proposed impact story with acceptance and an optional manual edit", () => {
  reset();
  const tree = screen({ draftTitle: "Park day", conversation: {
    messages: [{ role: "assistant", content: "How does this sound?", choices: [], section: "Impact story" }],
    isPending: false, error: null, suggestedImpactStory: "Restore our park together.",
    acceptImpactStory: () => requests.push("accept"), optionalSection: "Impact story", skipSection() {}, send() {},
  } });
  assert.match(text(tree), /Restore our park together/);
  [...nodes(tree)].find(node => node.props.title === "Use this story").props.onPress();
  assert.deepEqual(requests, ["accept"]);
  [...nodes(tree)].find(node => node.type === "TouchableOpacity" && text(node) === "Edit story manually").props.onPress();
  assert.deepEqual(requests, ["accept", "Impact story"]);
  [...nodes(tree)].find(node => node.props.accessibilityLabel === "Edit event name").props.onPress();
  assert.equal(requests.at(-1), "Story");
});
test("Gogo renders a location editor inline rather than a sheet-opening button", () => {
  reset();
  const tree = screen({ renderInlineSection: () => ({ type: "InlineLocation", props: {} }), conversation: {
    messages: [{ role: "assistant", content: "Where will people meet?", choices: [], section: "Location" }],
    isPending: false, error: null, send() {},
  } });
  assert.ok([...nodes(tree)].some(node => node.type === "InlineLocation"));
  assert.equal([...nodes(tree)].some(node => node.props.title === "Choose a location"), false);
});

test("a proposed story stays in Gogo's conversational context for revisions", async () => {
  reset();
  respond = async () => ({ data: { reply: "How does this sound?", choices: [], section: "Impact story", completedSection: null, suggestedImpactStory: "Restore our park together.", updates: {} } });
  await renderHook().send("Suggest a story");
  await renderHook().send("Make that more inviting");
  assert.match(requests.at(-1).payload.messages.find(message => message.role === "assistant" && message.content.includes("Suggested impact story")).content, /Restore our park together/);
  assert.equal(form.impactDescription, "");
});

function creationRoot() { hooks.cursor = 0; return NewEvent(); }
async function focusCreationRoot() {
  creationRoot();
  const leave = focusCallbacks.at(-1)();
  await new Promise(resolve => setImmediate(resolve));
  return { tree: creationRoot(), leave };
}
function savedCreationDraft() { return { values: draft(), mode: "gogo", conversation: { messages: [{ role: "assistant", content: "Where will people meet?", choices: [], section: "Location", suggestedImpactStory: null }], addressedSections: [] } }; }
test("returning to creation offers the saved draft before restoring any fields", async () => {
  reset(); savedDrafts = [savedCreationDraft()];
  const { tree } = await focusCreationRoot();
  assert.equal([...nodes(tree)].some(node => node.type === "EventTypePicker" || node.type === "GogoCreator"), false);
  const prompt = [...nodes(tree)].find(node => node.type === "DraftPrompt");
  assert.equal(prompt.props.title, "Park day");
  prompt.props.onContinue();
  const resumed = creationRoot();
  assert.equal(resumed.props.participationType, "registration");
  assert.strictEqual(resumed.props.initialDraft, savedDrafts[0]);
  savedDrafts = [];
});
test("the return prompt appears again when the same creation route regains focus", async () => {
  reset(); savedDrafts = [savedCreationDraft()];
  let { tree } = await focusCreationRoot();
  [...nodes(tree)].find(node => node.type === "DraftPrompt").props.onContinue();
  assert.equal(creationRoot().props.initialDraft.values.eventName, "Park day");
  tree = (await focusCreationRoot()).tree;
  assert.ok([...nodes(tree)].some(node => node.type === "DraftPrompt"));
  savedDrafts = [];
});
test("discarding a draft returns to type selection and never restores the old form", async () => {
  reset(); savedDrafts = [savedCreationDraft()]; discardedTypes.length = 0;
  const { tree } = await focusCreationRoot();
  [...nodes(tree)].find(node => node.type === "DraftPrompt").props.onDiscard();
  await new Promise(resolve => setImmediate(resolve));
  let next = creationRoot();
  assert.deepEqual(discardedTypes, ["registration"]);
  [...nodes(next)].find(node => node.type === "EventTypePicker").props.onSelect("registration");
  next = creationRoot();
  assert.equal(next.props.initialDraft, null);
  savedDrafts = [];
});
test("a failed discard keeps the return choice visible and reports the real failure", async () => {
  reset(); savedDrafts = [savedCreationDraft()]; discardFailure = true; uiCalls.length = 0;
  const { tree } = await focusCreationRoot();
  [...nodes(tree)].find(node => node.type === "DraftPrompt").props.onDiscard();
  await new Promise(resolve => setImmediate(resolve));
  assert.ok([...nodes(creationRoot())].some(node => node.type === "DraftPrompt"));
  assert.match(uiCalls.at(-1), /Couldn’t discard/);
  discardFailure = false; savedDrafts = [];
});
test("an unread draft stays behind the page loader and a stale read cannot reopen it after leaving", async () => {
  reset(); let resolve; draftLoad = () => new Promise(done => { resolve = done; });
  creationRoot(); const leave = focusCallbacks.at(-1)();
  assert.ok([...nodes(creationRoot())].some(node => node.type === "PageLoader"));
  leave(); resolve([savedCreationDraft()]);
  await new Promise(done => setImmediate(done));
  assert.equal([...nodes(creationRoot())].some(node => node.type === "DraftPrompt"), false);
  draftLoad = undefined;
});
test("Gogo resumes its saved question, proposal and skipped sections without an extra model request", async () => {
  reset();
  const state = { messages: [{ role: "assistant", content: "How does this sound?", choices: [], section: "Impact story", suggestedImpactStory: "Restore our park together." }], addressedSections: ["Links"] };
  const restored = renderHook(false, state);
  assert.equal(restored.messages.at(-1).content, "How does this sound?");
  assert.equal(restored.suggestedImpactStory, "Restore our park together.");
  assert.deepEqual(restored.getDraftState().addressedSections, ["Links"]);
  assert.deepEqual(requests, []);
});
test("an interrupted Gogo reply resumes with a real retry instead of losing the last answer", async () => {
  reset();
  const state = { messages: [{ role: "assistant", content: "What’s your idea?", choices: [], section: null, suggestedImpactStory: null }, { role: "user", content: "Plant trees at the park" }], addressedSections: [] };
  const restored = renderHook(false, state);
  assert.match(restored.error, /interrupted/);
  await restored.retry();
  assert.equal(requests[0].payload.messages.at(-1).content, "Plant trees at the park");
  assert.equal(renderHook(false, state).messages.at(-1).role, "assistant");
});
