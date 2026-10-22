const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");

const state = {};
const { default: ImpactSelector } = loadTypeScript(
  "components/gogo/tasks/impactSuggestions/ImpactSelector.tsx",
  {
    "@/components/ui/AppLoader": { default: "Spinner" },
    "@/components/gogo/tasks/impactSuggestions/useImpactSuggestions": {
      useImpactSuggestions: (payload, options) => {
        state.payload = payload;
        state.options = options;
        return {
          data: state.data,
          isFetching: state.fetching,
          isError: state.error,
          refetch: () => {
            state.retries += 1;
          },
        };
      },
    },
    "@/utils/useDebounce": {
      useDebounce: (payload) => state.previousDraft ?? payload,
    },
    react: { useMemo: (create) => create() },
    "react-native": {
      Text: "Text",
      TouchableOpacity: "Button",
      View: "View",
    },
    twrnc: { default: () => ({}), style: () => ({}) },
    "@/components/inputs/CustomTextArea": { default: "TextArea" },
  },
);

const aiGoal = {
  id: "sdg_15",
  number: 15,
  title: "Life on Land",
  shortTitle: "Land",
  color: "#56C02B",
  confidence: "high",
  source: "ai",
};
const emptyMap = { sdgGoals: [], impactPaths: [], commitments: [] };
const draft = {
  eventTitle: "Gather in the park",
  eventDescription: "A morning with neighbours.",
  impactDescription: "Volunteers will plant 100 trees.",
  registrationType: "registration",
};
function reset() {
  Object.assign(state, {
    data: undefined,
    fetching: false,
    error: false,
    previousDraft: undefined,
    retries: 0,
    changes: [],
  });
}
function render(overrides = {}) {
  return ImpactSelector({
    ...draft,
    selectedMap: emptyMap,
    onImpactDescriptionChange() {},
    onImpactMapChange: (map) => {
      state.changes.push(map);
    },
    ...overrides,
  });
}
function* nodes(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity))
    yield* nodes(child);
}
function group(screen, title) {
  return [...nodes(screen)].find((node) => node.props?.title === title);
}
function retryButton(screen) {
  return [...nodes(screen)].find((node) => node.type === "Button");
}

test("AI results are offered without automatically changing the organiser's map", () => {
  reset();
  state.data = { data: { ...emptyMap, sdgGoals: [aiGoal], source: "ai" } };
  const screen = render();
  assert.equal(state.options.enabled, true);
  assert.deepEqual(group(screen, "Global goals").props.suggestions, [aiGoal]);
  assert.deepEqual(state.changes, []);
});

test("loading AI suggestions never substitutes keyword matches", () => {
  reset();
  state.fetching = true;
  const screen = render();
  assert.deepEqual(group(screen, "Global goals").props.suggestions, []);
  assert.deepEqual(group(screen, "Commitments").props.suggestions, []);
  assert.ok([...nodes(screen)].some((node) => node.type === "Spinner"));
});

test("an empty AI map stays empty even when the draft contains familiar keywords", () => {
  reset();
  state.data = { data: { ...emptyMap, source: "ai" } };
  const screen = render();
  for (const title of ["Global goals", "Impact paths", "Commitments"]) {
    assert.deepEqual(group(screen, title).props.suggestions, []);
  }
});

test("AI failures retain saved selections and offer a working retry action", () => {
  reset();
  state.error = true;
  const selectedMap = { ...emptyMap, sdgGoals: [aiGoal] };
  const screen = render({ selectedMap });
  const goals = group(screen, "Global goals");
  assert.deepEqual(goals.props.suggestions, []);
  assert.deepEqual(goals.props.selected, [aiGoal]);
  assert.deepEqual(state.changes, []);
  retryButton(screen).props.onPress();
  assert.equal(state.retries, 1);
});

test("a blank impact story does not request or display AI suggestions", () => {
  reset();
  state.data = { data: { ...emptyMap, sdgGoals: [aiGoal], source: "ai" } };
  const screen = render({ impactDescription: "  " });
  assert.equal(state.options.enabled, false);
  assert.deepEqual(group(screen, "Global goals").props.suggestions, []);
});

test("editing the draft hides results from the previous text until the new draft is ready", () => {
  reset();
  state.previousDraft = {
    title: "An old draft",
    impactDescription: "A tree planting morning.",
  };
  state.data = { data: { ...emptyMap, sdgGoals: [aiGoal], source: "ai" } };
  const screen = render({
    impactDescription: "We changed this into a music evening.",
  });
  assert.equal(state.options.enabled, false);
  assert.deepEqual(group(screen, "Global goals").props.suggestions, []);
});

test("an organiser can explicitly select and remove an AI suggestion", () => {
  reset();
  state.data = { data: { ...emptyMap, sdgGoals: [aiGoal], source: "ai" } };
  const goals = group(render(), "Global goals");
  const choices = goals.type(goals.props);
  const add = [...nodes(choices)].find((node) => node.type === "Button");
  add.props.onPress();
  assert.deepEqual(state.changes, [{ ...emptyMap, sdgGoals: [aiGoal] }]);
  const selectedGoals = group(
    render({ selectedMap: state.changes[0] }),
    "Global goals",
  );
  const selectedChoices = selectedGoals.type(selectedGoals.props);
  const remove = [...nodes(selectedChoices)].find(
    (node) => node.type === "Button",
  );
  remove.props.onPress();
  assert.deepEqual(state.changes[1], emptyMap);
});
