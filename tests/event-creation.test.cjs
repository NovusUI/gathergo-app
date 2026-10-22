const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");
const { buildEventCreationDraft, applyEventCreationUpdates } = loadTypeScript(
  "utils/eventCreation.ts",
);
const { buildEventDateTimeIso } = loadTypeScript("utils/dateTimeHandler.ts");

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
    startDate: new Date(2035, 1, 3),
    endDate: new Date(2035, 1, 3),
    startTime: "10:00",
    endTime: "12:00",
  };
}

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
  useEffect: (effect) => hooks.effects.push(effect),
};
let form;
let requests;
let pending;
let respond;
const { useGogoEventCreation: runConversationHook } = loadTypeScript(
  "hooks/useGogoEventCreation.ts",
  {
    react,
    "@/services/serviceFn": {
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
  respond = async () => ({
    data: {
      reply: "Where should people meet?",
      choices: ["In person", "Online"],
      section: null,
      updates: { title: "Park gathering" },
    },
  });
}
function renderHook(isDonationEvent = false) {
  hooks.cursor = 0;
  return runConversationHook({
    getValues: () => form,
    setValue: (key, value) => {
      form[key] = value;
    },
    isDonationEvent,
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
      updates: { title: "Stale AI title" },
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
      updates: {},
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
      updates: {},
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
const { default: GogoEventCreator } = loadTypeScript(
  "components/eventInfo/GogoEventCreator.tsx",
  {
    react,
    "react-native": native,
    "@/components/buttons/CustomBtn1": { default: "ActionButton" },
    "@/components/ui/AppLoader": { default: "SmallGogoLoader" },
    "@/components/ui/GatherGoMascot": { GatherGoMascot: "WavingGogo" },
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
    ["eventInfo/GogoEventCreator", "GogoCreator"],
    ["eventInfo/Location", "LocationEditor"],
    ["eventInfo/Pricing", "PricingEditor"],
    ["inputs/CustomInput1", "Input"],
    ["labels/FormLabel", "Label"],
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
const { default: NewEvent } = loadTypeScript("app/(app)/new-event.tsx", {
  ...uiComponents,
  react,
  "react-native": {
    ...native,
    Modal: "Modal",
    KeyboardAvoidingView: "KeyboardAvoidingView",
    Platform: eventPlatform,
  },
  twrnc: { default: () => ({}) },
  "lucide-react-native": { CheckCheck: "Check" },
  "expo-router": { useLocalSearchParams: () => ({}) },
  "@/hooks/useGogoEventCreation": {
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
  "react-hook-form": {
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
      handleSubmit: (submit) => () => submit(form),
    }),
  },
});
function eventScreen() {
  hooks.cursor = 0;
  return NewEvent();
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
  const pricing = [...nodes(eventScreen())].find(
    (node) => node.type === "PricingEditor",
  );
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
  [...nodes(eventScreen())]
    .find((node) => node.type === "PricingEditor")
    .props.onSave({
      registrationType: "registration",
      registrationFee: 1500,
      registrationAttendees: 30,
      tickets: [],
    });
  assert.equal(form.registrationFee, 1500);
  assert.deepEqual(uiCalls, ["cancel", "continue", "cancel", "continue"]);
});
test("closing an editor does not advance; finishing the story editor does", () => {
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
  [...nodes(eventScreen())]
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
    (node) => node.type === "View" && node.props.collapsable === false,
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
    (node) => node.type === "View" && node.props.collapsable === false,
  );
  const input = [...nodes(tree)].find((node) => node.type === "TextInput");
  let focused = false;
  let measured;
  const offsets = [];
  scroll.props.ref.current = { scrollTo: (offset) => offsets.push(offset) };
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
