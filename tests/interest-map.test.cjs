const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");
function* nodes(node) { if (!node || typeof node !== "object") return; yield node; for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child); }
function text(node) { return [...nodes(node)].flatMap(child => [child.props?.children].flat(Infinity).filter(value => typeof value === "string")).join(" "); }
const state = { values: [], cursor: 0, effects: [], saved: [], examples: [], error: false, requested: null };
const topics = [
  { id: "Nature", label: "Environment", accent: "#60D394" },
  { id: "Education", label: "Education", accent: "#31C6F6" },
  { id: "Health", label: "Health", accent: "#0FF1CF" },
];
const profile = { interests: [], helpModes: [], city: null, learningEnabled: false, weights: [] };
const example = index => ({ id: `00000000-0000-4000-8000-00000000000${index}`, title: `Community event ${index}`, description: "Meet people nearby", location: "Lagos", thumbnailUrl: null, startDate: "2035-02-03T09:00:00Z", registrationType: "volunteer", topics: ["Nature"] });
const { GogoInterestSetup } = loadTypeScript("components/gogo/tasks/interestMap/GogoInterestSetup.tsx", {
  "@/components/gogo/mascot/GatherGoMascot": { GatherGoMascot: "Gogo" },
  "@/components/buttons/CustomBtn1": { default: "Action" },
  "@/components/inputs/CustomInput1": { default: "Input" },
  "@/components/ui/AppLoader": { default: "Loader" },
  "./InterestMap": { InterestMap: "Map" },
  "@/utils/dateTimeHandler": { formatShortDate: () => "3 Feb" },
  "@/services/queries": { useInterestExamples: (request, enabled) => { state.requested = { request, enabled }; return { isPending: false, isError: state.error, data: state.error ? undefined : { data: state.examples }, refetch() {} }; } },
  "expo-image": { Image: "Image" },
  react: {
    useState: initial => { const index = state.cursor++; if (!(index in state.values)) state.values[index] = initial; return [state.values[index], next => { state.values[index] = typeof next === "function" ? next(state.values[index]) : next; }]; },
    useEffect: effect => state.effects.push(effect),
  },
  "react-native": { View: "View", Text: "Text", ScrollView: "ScrollView", TouchableOpacity: "Button", KeyboardAvoidingView: "KeyboardSafe", Platform: { OS: "ios" }, useWindowDimensions: () => ({ height: 844 }) },
  twrnc: { default: () => ({}) },
});
function reset() { Object.assign(state, { values: [], cursor: 0, effects: [], saved: [], examples: [example(1), example(2), example(3)], error: false }); }
function render(overrides = {}) { state.cursor = 0; state.effects = []; return GogoInterestSetup({ catalog: { topics, helpModes: ["attend", "volunteer", "donate", "carpool"] }, profile, firstTime: true, pending: false, onSave: data => state.saved.push(data), onCancel() {}, ...overrides }); }
function press(label) { const node = [...nodes(render())].find(node => node.props?.title === label || node.props?.accessibilityLabel === label || (node.type === "Button" && text(node).trim() === label)); assert.ok(node, label); (node.props.onPress)(); }
function taste() { press("Continue"); press("Continue"); press("Continue"); }
test("Gogo builds a map from taps, real event likes and an optional city", () => {
  reset(); press("Environment");
  assert.deepEqual([...nodes(render())].find(node => node.type === "Map").props.topics, [topics[0]]);
  press("Continue"); press("Attend"); press("Volunteer"); press("Continue");
  const city = [...nodes(render())].find(node => node.type === "Input"); city.props.onChangeText(" Lagos "); press("Continue");
  assert.deepEqual(state.requested, { request: { interests: ["Nature"], city: "Lagos" }, enabled: false });
  render(); assert.equal(state.requested.enabled, true);
  press("Like this event"); press("Skip this event"); press("Like this event");
  assert.match(text(render()), /Your map is taking shape/);
  press("Find my events");
  assert.deepEqual(state.saved[0], { interests: ["Nature"], helpModes: ["attend", "volunteer"], city: "Lagos", learningEnabled: true, likedEventIds: [example(1).id, example(3).id] });
});
test("step two lets Carpool be selected, deselected and saved alongside all other options", () => {
  reset(); press("Continue");
  assert.match(text(render()), /2 of 4/);
  press("Carpool");
  const selected = [...nodes(render())].find(node => node.type === "Button" && text(node).trim() === "Carpool  ✓");
  assert.equal(selected.props.accessibilityState.selected, true);
  press("Carpool  ✓");
  const unselected = [...nodes(render())].find(node => node.type === "Button" && text(node).trim() === "Carpool");
  assert.equal(unselected.props.accessibilityState.selected, false);
  for (const mode of ["Attend", "Volunteer", "Donate", "Carpool"]) press(mode);
  press("Continue"); press("Continue"); press("Skip examples"); press("Find my events");
  assert.deepEqual(state.saved[0].helpModes, ["attend", "volunteer", "donate", "carpool"]);
});
test("Skip setup remains available on every question and produces an empty map", () => {
  for (let step = 0; step < 5; step++) {
    reset(); press("Environment");
    for (let index = 0; index < step; index++) press(index === 3 ? "Skip examples" : "Continue");
    press("Skip setup");
    assert.deepEqual(state.saved[0], { interests: [], helpModes: [], city: "", likedEventIds: [], learningEnabled: false });
  }
});
test("skipping questions clears that answer and does not treat event skips as dislikes", () => {
  reset(); press("Environment"); press("Skip this question"); press("Skip this question"); press("Skip this question");
  press("Skip this event"); press("Skip this event"); press("Skip this event"); press("Find my events");
  assert.deepEqual(state.saved[0].interests, []); assert.deepEqual(state.saved[0].likedEventIds, []); assert.equal(state.saved[0].learningEnabled, false);
});
test("sparse or unavailable event examples can be skipped without made-up cards", () => {
  reset(); state.examples = []; taste(); render(); state.effects.forEach(effect => effect());
  assert.match(text(render()), /Your map is taking shape/);
  reset(); state.error = true; taste(); assert.match(text(render()), /couldn’t load event examples/); press("Skip examples"); assert.match(text(render()), /Your map is taking shape/);
});
test("reviewing the examples again does not submit duplicated likes", () => {
  reset(); taste(); press("Like this event"); press("Like this event"); press("Like this event");
  press("Previous question"); press("Like this event"); press("Find my events");
  assert.equal(state.saved[0].likedEventIds.length, 3); assert.equal(new Set(state.saved[0].likedEventIds).size, 3);
});
test("city entry and the footer stay within the keyboard-avoiding layout", () => {
  reset(); press("Continue"); press("Continue");
  const page = render(); assert.equal(page.type, "KeyboardSafe"); assert.equal(page.props.behavior, "padding");
  assert.ok([...nodes(page)].some(node => node.type === "Input")); assert.ok([...nodes(page)].some(node => node.props?.title === "Continue"));
});

const calls = []; let failure;
const envelope = { status: "success", message: "Request successful", data: profile };
const urls = loadTypeScript("services/urls.ts", { "@/constants/network": { API_BASE_URL: "https://api.gathergo.test/api/v1" } });
const send = async (method, ...args) => { calls.push([method, ...args]); if (failure) throw failure; return { data: envelope }; };
const api = loadTypeScript("services/serviceFn.ts", {
  "@/api/client": { default: { get: (...args) => send("GET", ...args), patch: (...args) => send("PATCH", ...args), post: (...args) => send("POST", ...args), delete: (...args) => send("DELETE", ...args) } },
  "@/api/uploadClient": { uploadClient: {} }, "@/utils/checkout": { checkoutDeadline() {} }, "./urls": urls,
});
test("map requests use the actual API paths and bodies without inventing persistence", async () => {
  const payload = { interests: ["Nature"], helpModes: ["volunteer"], city: "Lagos", learningEnabled: true, likedEventIds: [] };
  assert.strictEqual(await api.updatePreference(payload), envelope); assert.deepEqual(calls.at(-1), ["PATCH", "/preferences", payload]);
  await api.getInterestExamples({ interests: ["Nature"], city: "Lagos" }); assert.deepEqual(calls.at(-1), ["GET", "/preferences/examples", { params: { interests: "Nature", city: "Lagos" } }]);
  await api.resetInterestLearning(); assert.deepEqual(calls.at(-1), ["POST", "/preferences/reset-learning"]);
  await api.deleteInterestMap(); assert.deepEqual(calls.at(-1), ["DELETE", "/preferences"]);
  await api.recordEventInterest({ eventId: example(1).id, kind: "VIEW" }); assert.deepEqual(calls.at(-1), ["POST", "/preferences/signals", { eventId: example(1).id, kind: "VIEW" }]);
  failure = new Error("offline"); await assert.rejects(api.updatePreference(payload), error => error === failure); failure = undefined;
});
const cache = []; let mutation;
const queryKeys = loadTypeScript("services/queryKeys.ts");
const hooks = loadTypeScript("services/mutations.ts", {
  "@/context/AuthContext": { useAuth: () => ({ user: { id: "user-1" } }) }, "@/utils/globalErrorHandler": { showGlobalError() {} }, "@/utils/storage": { saveItem() {} },
  "./serviceFn": api, "./queryKeys": queryKeys,
  "@tanstack/react-query": { useQueryClient: () => ({ setQueryData: (key, data) => cache.push(["set", key, data]), invalidateQueries: async ({ queryKey }) => cache.push(["refresh", queryKey]) }), useMutation: config => { mutation = config; return config; } },
});
test("map changes replace cached profile data and refresh the feed before leaving setup", async () => {
  let called = false;
  hooks.useSavePreferences({ onSuccess: () => { called = true; assert.ok(cache.some(item => item[0] === "refresh" && JSON.stringify(item[1]) === JSON.stringify([queryKeys.QUERY_KEYS.foryouEvents]))); } });
  await mutation.onSuccess(envelope, {});
  assert.equal(called, true); assert.deepEqual(cache[0], ["set", [...queryKeys.QUERY_KEYS.interestProfile, "user-1"], envelope]);
});

const { getApiErrorMessage } = loadTypeScript("utils/apiError.ts");
test("server map errors retain their actionable reason while network errors get readable copy", () => {
  assert.equal(getApiErrorMessage({ isAxiosError: true, response: { data: { message: "Refresh your event examples." } } }, "Try again"), "Refresh your event examples.");
  assert.equal(getApiErrorMessage(new Error("offline"), "Try again"), "Try again");
});

let account = { id: "first-user" }; let query;
const preferenceQueries = loadTypeScript("services/queries.ts", {
  "@/context/AuthContext": { useAuth: () => ({ user: account }) },
  "./serviceFn": api, "./queryKeys": queryKeys,
  "@tanstack/react-query": { useQuery: options => { query = options; return options; }, useInfiniteQuery: options => options },
});
test("a personal map is cached separately for each signed-in account", () => {
  preferenceQueries.useInterestProfile();
  assert.deepEqual(query.queryKey, [...queryKeys.QUERY_KEYS.interestProfile, "first-user"]);
  account = { id: "second-user" }; preferenceQueries.useInterestProfile();
  assert.deepEqual(query.queryKey, [...queryKeys.QUERY_KEYS.interestProfile, "second-user"]);
  account = null; preferenceQueries.useInterestProfile(); assert.equal(query.enabled, false);
});
