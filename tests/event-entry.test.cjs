const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");
const native = {
  View: "View",
  Text: "Text",
  TouchableOpacity: "Button",
  ScrollView: "ScrollView",
};
const { default: EventTypePicker } = loadTypeScript(
  "components/gogo/tasks/eventCreation/EventTypePicker.tsx",
  {
    "@/components/gogo/mascot/GatherGoMascot": { GatherGoMascot: "Gogo" },
    "@expo/vector-icons": { Ionicons: "Icon" },
    "react-native": native,
    twrnc: { default: () => ({}) },
  },
);
function* nodes(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity))
    yield* nodes(child);
}
test("the opening Gogo page offers all four actual participation types", () => {
  const selected = [];
  const screen = EventTypePicker({ onSelect: (type) => selected.push(type) });
  const choices = [...nodes(screen)].filter((node) => node.type === "Button");
  assert.deepEqual(
    choices.map((node) => node.props.accessibilityLabel),
    ["Fundraiser", "Ticket", "Registration", "Volunteer and donation"],
  );
  choices.forEach((node) => node.props.onPress());
  assert.deepEqual(selected, [
    "donation",
    "ticket",
    "registration",
    "volunteer",
  ]);
});
let submit;
let result;
let pricingEffects = [];
let pricingResets = [];
const pricingEmission = { current: null };
const pricing = {
  registrationType: "registration",
  paid: false,
  limited: false,
  registrationFee: 2500,
  registrationAttendees: 20,
  tickets: [],
};
const { default: Pricing } = loadTypeScript(
  "components/eventInfo/Pricing.tsx",
  {
    "@/utils/globalErrorHandler": { showGlobalError() {} },
    "@hookform/resolvers/zod": { zodResolver() {} },
    "react-hook-form": {
      Controller: "Controller",
      useForm: () => ({
        control: {},
        watch: (key) => pricing[key],
        reset: value => { pricingResets.push(value); Object.assign(pricing, value); },
        setValue: (name, value) => { pricing[name] = value; },
        getValues: () => ({ ...pricing }),
        formState: { errors: {} },
        handleSubmit: (callback) => {
          submit = callback;
          return () => callback(pricing);
        },
      }),
    },
    react: { useEffect: effect => pricingEffects.push(effect), useMemo: (factory) => factory(), useRef: () => pricingEmission },
    "react-native": native,
    "lucide-react-native": { PlusCircle: "Icon" },
    twrnc: { default: () => ({}), style: () => ({}) },
    "../CustomSwitcher": { default: "Switch" },
    "../View": { default: "View" },
    "../buttons/CustomBtn1": { default: "Action" },
    "../inputs/CustomInput1": { default: "Input" },
    "./TicketCard": { default: "Ticket" },
  },
);
test("free, unlimited registration commits its actual values so Gogo can advance", () => {
  Pricing({
    createTicket() {},
    tickets: [],
    setTicket() {},
    allowedRegistrationTypes: ["registration"],
    onSave: (value) => {
      result = value;
    },
  });
  submit(pricing);
  assert.equal(result.registrationFee, 0);
  assert.equal(result.registrationAttendees, 100000);
  submit({ ...pricing, paid: true, limited: true });
  assert.equal(result.registrationFee, 2500);
  assert.equal(result.registrationAttendees, 20);
});

test("registration settings update the draft directly without a setup action or resetting unfinished fields", () => {
  Object.assign(pricing, { registrationType: "registration", paid: false, limited: false, registrationFee: undefined, registrationAttendees: undefined, tickets: [] });
  pricingEmission.current = null;
  pricingResets = [];
  const updates = [];
  const onChange = value => updates.push(value);
  const render = initialData => {
    pricingEffects = [];
    return Pricing({ initialData, onChange, tickets: [], setTicket() {}, createTicket() {}, allowedRegistrationTypes: ["registration"] });
  };
  const screen = render({ ...pricing });
  pricingEffects.forEach(effect => effect());
  assert.equal(updates.at(-1).registrationFee, 0);
  assert.equal(updates.at(-1).registrationAttendees, 100000);
  assert.equal([...nodes(screen)].some(node => node.type === "Action"), false);
  const control = (name, initialData = { ...pricing }) => [...nodes(render(initialData))].find(node => node.type === "Controller" && node.props.name === name);
  const field = name => control(name).props.render({ field: { value: pricing[name] } });
  field("paid").props.setIsEnabled(true);
  assert.equal(updates.at(-1).registrationFee, undefined);
  const resetCount = pricingResets.length;
  render({ ...updates.at(-1), paid: false });
  pricingEffects[0]();
  assert.equal(pricingResets.length, resetCount);
  assert.equal(pricing.paid, true);
  [...nodes(field("registrationFee"))].find(node => node.type === "Input").props.onChangeText("2500");
  assert.equal(updates.at(-1).registrationFee, 2500);
  [...nodes(field("registrationFee"))].find(node => node.type === "Input").props.onChangeText("0.");
  assert.equal([...nodes(field("registrationFee"))].find(node => node.type === "Input").props.value, "0.");
  [...nodes(field("registrationFee"))].find(node => node.type === "Input").props.onChangeText("0.50");
  assert.equal(updates.at(-1).registrationFee, 0.5);
  field("limited").props.setIsEnabled(true);
  assert.equal(updates.at(-1).registrationAttendees, undefined);
  [...nodes(field("registrationAttendees"))].find(node => node.type === "Input").props.onChangeText("40");
  assert.equal(updates.at(-1).registrationAttendees, 40);
  field("paid").props.setIsEnabled(false);
  field("limited").props.setIsEnabled(false);
  assert.equal(updates.at(-1).registrationFee, 0);
  assert.equal(updates.at(-1).registrationAttendees, 100000);
  render({ ...pricing, paid: true, registrationFee: 3500 });
  pricingEffects[0]();
  assert.equal(pricing.registrationFee, 3500);
  assert.equal(pricing.paid, true);
});

test("manual ticket setup has no confirmation action and retains ticket creation and removal", () => {
  Object.assign(pricing, { registrationType: "ticket", tickets: [] });
  let created = 0;
  const tickets = [{ id: "ticket-1", type: "Entry", price: 1000 }];
  let changed;
  const screen = Pricing({ initialData: { ...pricing }, tickets, createTicket: () => { created += 1; }, setTicket: value => { changed = value; }, allowedRegistrationTypes: ["ticket"] });
  assert.equal([...nodes(screen)].some(node => node.type === "Action"), false);
  [...nodes(screen)].find(node => node.type === "Button").props.onPress();
  assert.equal(created, 1);
  [...nodes(screen)].find(node => node.type === "Ticket").props.onDelete();
  assert.deepEqual(changed, []);
});

const { default: Location } = loadTypeScript(
  "components/eventInfo/Location.tsx",
  {
    "react-native": native,
    twrnc: { default: () => ({}), style: () => ({}) },
    "../View": { default: "View" },
    "../buttons/CustomBtn1": { default: "Action" },
    "../inputs/CustomInput1": { default: "Input" },
  },
);
test("the manual location input updates its parent draft with no extra action", () => {
  const draft = { location: "Park", isPhysicalEvent: true };
  const render = () => Location({
    value: draft.location,
    isPhysicalEvent: draft.isPhysicalEvent,
    onChange: (value) => Object.assign(draft, value),
  });
  const input = [...nodes(render())].find(node => node.type === "Input");
  input.props.onChangeText("Community garden");
  assert.equal(draft.location, "Community garden");
  assert.equal([...nodes(render())].some(node => node.type === "Action"), false);
  draft.location = "Venue updated by Gogo";
  assert.equal([...nodes(render())].find(node => node.type === "Input").props.value, "Venue updated by Gogo");
});
test("switching event format immediately updates the draft and clears an online event's venue", () => {
  const draft = { location: "Park", isPhysicalEvent: true };
  const render = () => Location({
    value: draft.location,
    isPhysicalEvent: draft.isPhysicalEvent,
    onChange: (value) => Object.assign(draft, value),
  });
  [...nodes(render())].filter(node => node.type === "Button")[1].props.onPress();
  assert.deepEqual(draft, { location: "", isPhysicalEvent: false });
  assert.equal([...nodes(render())].some(node => node.type === "Input"), false);
  [...nodes(render())].filter(node => node.type === "Button")[0].props.onPress();
  assert.equal(draft.isPhysicalEvent, true);
  assert.ok([...nodes(render())].some(node => node.type === "Input"));
});
test("Gogo's location Continue advances only when pressed and still requires a physical venue", () => {
  let continued = 0;
  const draft = { location: "", isPhysicalEvent: true };
  const render = () => Location({
    value: draft.location,
    isPhysicalEvent: draft.isPhysicalEvent,
    onChange: (value) => Object.assign(draft, value),
    onSave: () => { continued += 1; },
    submitLabel: "Continue",
  });
  const action = () => [...nodes(render())].find(node => node.type === "Action");
  assert.equal(action().props.disabled, true);
  [...nodes(render())].find(node => node.type === "Input").props.onChangeText("Park");
  assert.equal(continued, 0);
  assert.equal(action().props.disabled, false);
  assert.equal(action().props.title, "Continue");
  action().props.onPress();
  assert.equal(continued, 1);
});
test("physical-only volunteering has a venue input without online choices", () => {
  const changes = [];
  const screen = Location({ value: "Park", isPhysicalEvent: true, physicalOnly: true, onChange: value => changes.push(value) });
  assert.equal([...nodes(screen)].some(node => node.type === "Button"), false);
  [...nodes(screen)].find(node => node.type === "Input").props.onChangeText("Garden");
  assert.deepEqual(changes, [{ location: "Garden", isPhysicalEvent: true }]);
});
