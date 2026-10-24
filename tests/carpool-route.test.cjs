const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");
const { carpoolSchema } = loadTypeScript("schemas/carpool.ts");
let form;
const native = Object.fromEntries(["View", "Text", "Switch", "TouchableOpacity", "TextInput", "ScrollView", "Modal", "Pressable", "KeyboardAvoidingView"].map(name => [name, name]));
native.StyleSheet = { create: styles => styles };
native.Platform = { OS: "ios" };
const tw = { default: () => ({}) };
const { default: RouteFields } = loadTypeScript("components/carpool/CarpoolRouteFields.tsx", {
  "@/components/inputs/CustomInput1": { default: "Input" },
  "@expo/vector-icons": { Ionicons: "Icon" },
  "react-hook-form": { Controller: "Controller", useWatch: ({ name }) => form[name] },
  "react-native": native, twrnc: tw,
});
function* nodes(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  if (node.type === "List") {
    for (const item of node.props.data) yield* nodes(node.props.renderItem({ item }));
  }
  if (node.type === "Controller") {
    yield* nodes(node.props.render({ field: { value: form[node.props.name], onChange: value => { form[node.props.name] = value; } }, fieldState: {} }));
    return;
  }
  for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child);
}
function text(node) {
  return [...nodes(node)].flatMap(n => [n.props?.children].flat(Infinity).filter(x => typeof x === "string")).join(" ");
}
const defaults = () => ({ isToEvent: true, poolLocation: "Yaba bus stop", poolDestination: "Ikeja", useCurrentLocation: false, departureTime: "09:00", availableSeats: 3, notes: "" });
function route() { return RouteFields({ control: {}, setValue: (name, value) => { form[name] = value; }, eventLocation: "Freedom Park" }); }
test("the route preview swaps venue and editable endpoint with the selected direction", () => {
  form = defaults();
  let tree = route();
  let all = [...nodes(tree)];
  assert.match(text(tree), /Destination · Event venue/);
  assert.equal(all.find(node => node.type === "Input").props.value, "Yaba bus stop");
  assert.ok(all.findIndex(node => node.type === "Input") < all.findIndex(node => node.type === "Text" && node.props.children === "Freedom Park"));
  form.useCurrentLocation = true;
  all.find(node => node.props?.accessibilityRole === "radio" && text(node) === "From the event").props.onPress();
  tree = route(); all = [...nodes(tree)];
  assert.equal(form.useCurrentLocation, false);
  assert.match(text(tree), /Pickup · Event venue/);
  assert.equal(all.find(node => node.type === "Input").props.value, "Ikeja");
  assert.ok(all.findIndex(node => node.type === "Text" && node.props.children === "Freedom Park") < all.findIndex(node => node.type === "Input"));
  assert.equal(all.some(node => node.type === "Switch"), false);
  all.find(node => node.props?.accessibilityRole === "radio" && text(node) === "To the event").props.onPress();
  assert.equal([...nodes(route())].find(node => node.type === "Input").props.value, "Yaba bus stop");
});
test("each trip requires only its editable endpoint and rejects whitespace", () => {
  for (const isToEvent of [true, false]) {
    const values = { ...defaults(), isToEvent, poolLocation: isToEvent ? "   " : "", poolDestination: isToEvent ? "" : "   " };
    const invalid = carpoolSchema.safeParse(values);
    assert.equal(invalid.success, false);
    assert.ok(invalid.error.issues.some(issue => issue.path[0] === (isToEvent ? "poolLocation" : "poolDestination")));
    values[isToEvent ? "poolLocation" : "poolDestination"] = "  Yaba  ";
    const valid = carpoolSchema.parse(values);
    assert.equal(valid[isToEvent ? "poolLocation" : "poolDestination"], "Yaba");
  }
});

const hooks = { values: [], cursor: 0 };
const react = {
  useState(initial) { const i = hooks.cursor++; if (!(i in hooks.values)) hooks.values[i] = initial; return [hooks.values[i], value => { hooks.values[i] = typeof value === "function" ? value(hooks.values[i]) : value; }]; },
  useRef(initial) { const [ref] = react.useState({ current: initial }); return ref; },
  useMemo: fn => fn(), useCallback: fn => fn, useEffect() {},
};
const event = { id: "11111111-1111-4111-8111-111111111111", title: "Park morning", location: "Freedom Park", isPhysicalEvent: true, startDate: "2035-02-03T09:00:00Z", endDate: "2035-02-03T11:00:00Z" };
let published, locationRequests, errors;
const components = Object.fromEntries([
  ["buttons/SheetCloseButton", "Close"], ["CustomEventInfoSelector", "TimePicker"], ["CustomeTopBarNav", "Nav"], ["View", "Content"], ["buttons/CustomBtn1", "Button"], ["inputs/CustomInput1", "Input"], ["ui/AppLoader", "Loader"], ["ui/EventCard", "EventCard"], ["ui/ImpactPageLoader", "PageLoader"], ["carpool/CarpoolRouteFields", "RouteFields"],
].map(([path, component]) => ["@/components/" + path, { default: component }]));
const { default: NewCarpool } = loadTypeScript("app/(app)/new-carpool.tsx", {
  "react-native-safe-area-context": { SafeAreaView: "SafeArea" },
  ...components, react, "react-native": native, twrnc: tw,
  "@/context/AuthContext": { useAuth: () => ({ user: { id: "driver" } }) },
  "@/hooks/useLocationManager": { useLocationManager: () => ({ coords: { lat: 6.5, lng: 3.3 }, requestLocation: async () => { locationRequests++; return { lat: 6.5, lng: 3.3 }; } }) },
  "@/services/mutations": { useCreateCarpool: () => ({ mutateAsync: async payload => { published = payload; }, isPending: false }) },
  "@/services/queries": { useEventDetails: () => ({}), useForYouEvents: () => ({ data: { data: [event] }, isPending: false }), useGetSearchResult: () => ({ isPending: false }) },
  "@/utils/dateTimeHandler": { isEventPastEnd: () => false, extractTime: () => "09:00" },
  "@/utils/globalErrorHandler": { showGlobalError: message => errors.push(message), showGlobalSuccess() {} },
  "@/utils/navigation": { useLockedRouter: () => ({ replace() {} }) },
  "@hookform/resolvers/zod": { zodResolver: () => () => {} },
  "expo-router": { useLocalSearchParams: () => ({}) },
  "lucide-react-native": { SearchIcon: "Icon" },
  "react-native-gesture-handler": { FlatList: "List" },
  "react-native-modal-datetime-picker": { default: "DatePicker" },
  "react-hook-form": { Controller: "Controller", useForm: () => ({ control: {}, watch: name => form[name], setValue: (name, value) => { form[name] = value; }, reset() {}, formState: { errors: {} }, handleSubmit: submit => async () => submit(carpoolSchema.parse(form)) }) },
});
function screen() { hooks.cursor = 0; return NewCarpool(); }
function open() {
  hooks.values = []; hooks.cursor = 0; form = defaults(); published = undefined; errors = []; locationRequests = 0;
  [...nodes(screen())].find(node => node.type === "EventCard").props.onPress();
  return screen();
}
async function create() { await [...nodes(screen())].find(node => node.type === "Button" && node.props.title === "Create Carpool").props.onPress(); }
test("outbound creation sends pickup then event venue in the creation request", async () => {
  const tree = open();
  assert.equal(text(tree).includes("Make the ride plan easy to trust"), false);
  assert.equal([...nodes(tree)].find(node => node.type === "RouteFields").props.eventLocation, "Freedom Park");
  await create();
  assert.equal(published.origin, "Yaba bus stop");
  assert.equal(published.destination, "Freedom Park");
  assert.equal(published.eventId, event.id);
  assert.equal(published.isToEvent, undefined);
  assert.equal(locationRequests, 0);
});
test("return creation sends event venue then destination without attaching outbound pickup coordinates", async () => {
  open(); form.isToEvent = false; form.useCurrentLocation = true;
  await create();
  assert.equal(published.origin, "Freedom Park");
  assert.equal(published.destination, "Ikeja");
  assert.equal(published.eventId, event.id);
  assert.equal(published.startPoint, undefined);
  assert.equal(locationRequests, 0);
});
test("current-location pickup coordinates are attached only for an outbound ride", async () => {
  open(); form.useCurrentLocation = true;
  await create();
  assert.deepEqual(published.startPoint, { lat: 6.5, lng: 3.3 });
});
