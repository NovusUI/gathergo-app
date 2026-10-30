const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");

let values = [], effects = [], cursor = 0;
const hooks = {
  useState(initial) {
    const index = cursor++;
    if (!(index in values)) values[index] = initial;
    return [values[index], next => { values[index] = typeof next === "function" ? next(values[index]) : next; }];
  },
  useRef: initial => ({ current: initial }),
  useMemo: factory => factory(),
  useCallback: callback => callback,
  useEffect: effect => effects.push(effect),
};
const calls = [];
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
let transaction, eventDetails, queryError, cancelFailure, refetchFailure;
const tw = () => ({});
let reducedMotion = false, focused = true;
const { default: ShareCarToEventCard } = loadTypeScript("components/carpool/ShareCarToEventCard.tsx", {
  "@/components/gogo/mascot/GogoOnboardingCarpoolArtwork": { GogoOnboardingCarpoolArtwork: "CarpoolArtwork" },
  "@/hooks/useReducedMotionPreference": { useReducedMotionPreference: () => reducedMotion },
  "@react-navigation/native": { useIsFocused: () => focused },
  "lucide-react-native": { ArrowUpRight: "Arrow" },
  "react-native": { Text: "Text", TouchableOpacity: "Button", View: "View" },
  twrnc: { default: tw, style: tw },
});
const { PaymentTransaction: Transaction } = loadTypeScript("app/(app)/transaction/[transactionId].tsx", {
  "@/components/foodBank/MealPassReceipt": { default: "MealReceipt" },
  "@/components/foodBank/MealPassAccess": { default: "MealPassAccess" },
  "@/components/ui/CheckoutCountdown": { CheckoutCountdown: "Countdown" },
  "@/hooks/useCheckoutCountdown": { useCheckoutCountdown: () => 300 },
  "@/utils/checkout": { clearCheckoutIntent: async (...args) => {
    calls.push(["clearCheckoutIntent", ...args]);
    await checkoutUtils.clearCheckoutIntent(...args);
  } },
  "@/services/serviceFn": { cancelEventCheckout: async (...args) => {
    calls.push(["cancel", ...args]);
    if (cancelFailure) throw cancelFailure;
  } },
  "@/components/PaystackWebViewWrapper": { PaystackWebViewWrapper: "Payment" },
  "@/components/CustomeTopBarNav": { default: "TopBar" },
  "@/components/QRCodeGen": { default: "QR" },
  "@/components/View": { default: "Content" },
  "@/components/buttons/CustomBtn1": { default: "ActionButton" },
  "@/components/carpool/ShareCarToEventCard": { default: ShareCarToEventCard },
  "@/components/ui/EventDetails": { EventDetails: "Details" },
  "@/components/gogo/mascot/MascotMoment": { MascotMoment: "Gogo" },
  "@/context/AuthContext": { useAuth: () => ({ user: { id: "buyer" } }) },
  "@/services/queries": {
    useTransactionRef: () => ({
      data: transaction, isPending: false, isError: queryError,
      refetch: async () => {
        calls.push(["refetch"]);
        if (refetchFailure) { queryError = true; return; }
        if (!cancelFailure) transaction.data.status = "EXPIRED";
      },
    }),
    useEventDetails: () => ({ data: eventDetails }),
    useTicketOrRegByTransactionRef: () => ({}),
  },
  "@/utils/dateTimeHandler": { formatEventDateTime: () => "Tomorrow" },
  "@/utils/globalErrorHandler": { showGlobalError: message => calls.push(["error", message]) },
  "@/utils/navigation": { useLockedRouter: () => ({
    push: href => calls.push(["push", href]),
    replace: href => calls.push(["replace", href]),
  }), safeGoBack() {} },
  "@/utils/utils": { numberWithCommas: String },
  "@gorhom/bottom-sheet": { default: "Sheet", BottomSheetModal: "Sheet", BottomSheetBackdrop: "Backdrop", BottomSheetScrollView: "SheetScroll" },
  "expo-router": { useLocalSearchParams: () => ({ transactionId: "transaction-1", type: "TICKET" }) },
  "lucide-react-native": { Calendar: "Calendar", CarFront: "Car", Flame: "Flame" },
  react: hooks,
  "react-native": { Image: "Image", ScrollView: "Scroll", Text: "Text", TouchableOpacity: "Button", View: "View" },
  "react-native-svg": { default: "Svg", Line: "Line" },
  twrnc: { default: tw, style: tw },
});
function* nodes(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  if (node.type === ShareCarToEventCard) {
    yield* nodes(ShareCarToEventCard(node.props));
    return;
  }
  for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child);
}
function render() { cursor = 0; effects = []; return Transaction(); }
async function runEffects() {
  const cleanups = effects.map(effect => effect());
  await new Promise(setImmediate);
  cleanups.forEach(cleanup => { if (typeof cleanup === "function") cleanup(); });
}
function button(label, page = render()) {
  return [...nodes(page)].find(n => n.type === "Button" && [...nodes(n)].some(child => child.props?.children === label));
}
function reset() {
  values = []; calls.length = 0; intentStorage.clear(); eventDetails = undefined; queryError = false; cancelFailure = undefined; refetchFailure = false;
  transaction = { data: { status: "PENDING", paymentProvider: "PAYSTACK", amount: 100000,
    paymentUrl: "https://checkout.paystack.com/test", checkoutDeadlineMs: Date.now() + 300000,
    metadata: { type: "TICKET", eventId: "event-1", eventTitle: "Community day" } } };
}
test("cancelling resumed Paystack payment releases the server hold and disables resume", async () => {
  reset();
  button("Resume payment").props.onPress();
  const payment = [...nodes(render())].find(n => n.type === "Payment");
  assert.equal(payment.props.visible, true);
  payment.props.onCancel();
  await new Promise(setImmediate);
  assert.deepEqual(calls, [["cancel", "transaction-1", "buyer", "event-1"], ["refetch"]]);
  assert.equal(button("Resume payment"), undefined);
  assert.ok(button("Start a new checkout"));
});
test("the explicit cancel action uses the same release and retry-key cleanup", async () => {
  reset();
  await button("Cancel checkout and release spaces").props.onPress();
  assert.deepEqual(calls[0], ["cancel", "transaction-1", "buyer", "event-1"]);
  assert.equal(button("Resume payment"), undefined);
});
test("a cancellation failure remains visible and checks the actual payment status", async () => {
  reset(); cancelFailure = new Error("Network unavailable");
  await button("Cancel checkout and release spaces").props.onPress();
  assert.ok(calls.some(([kind, message]) => kind === "error" && message.includes("Could not cancel")));
  assert.deepEqual(calls.at(-1), ["refetch"]);
  assert.ok(button("Resume payment"));
});
test("a failed status refresh cannot resume a cancelled checkout from stale cached data", async () => {
  reset(); refetchFailure = true;
  await button("Cancel checkout and release spaces").props.onPress();
  assert.equal(button("Resume payment"), undefined);
  assert.ok(button("Check payment status"));
});

test("closing a donation payment does not call the ticket cancellation API", async () => {
  reset(); transaction.data.metadata.type = "DONATION";
  assert.equal(button("Cancel checkout and release spaces"), undefined);
  button("Resume payment").props.onPress();
  [...nodes(render())].find(n => n.type === "Payment").props.onCancel();
  await new Promise(setImmediate);
  assert.deepEqual(calls, []);
  assert.equal([...nodes(render())].find(n => n.type === "Payment").props.visible, false);
});

test("successful checkout for a physical event opens its carpool creation sheet", async () => {
  for (const type of ["TICKET", "REGISTRATION", "DONATION"]) {
    reset();
    transaction.data.status = "SUCCESS";
    transaction.data.metadata.type = type;
    eventDetails = { data: { isPhysicalEvent: true } };
    assert.equal(button("Start a new checkout"), undefined);
    await button("Share your car to event?").props.onPress();
    assert.deepEqual(calls, [["push", {
      pathname: "/new-carpool",
      params: { eventId: "event-1", autoOpenEventPicker: "1" },
    }]]);
  }
});

test("successful checkout for a virtual event keeps the new checkout action", async () => {
  reset();
  transaction.data.status = "SUCCESS";
  eventDetails = { data: { isPhysicalEvent: false } };
  assert.equal(button("Share your car to event?"), undefined);
  await button("Buy more tickets").props.onPress();
  assert.deepEqual(calls, [["clearCheckoutIntent", "buyer", "event-1"], ["replace", "/event/event-1"]]);
});

test("a completed ticket purchase offers a new checkout alongside the carpool invitation", async () => {
  reset();
  transaction.data.status = "SUCCESS";
  eventDetails = { data: { isPhysicalEvent: true } };
  assert.ok(button("Share your car to event?"));
  await button("Buy more tickets").props.onPress();
  assert.deepEqual(calls, [["clearCheckoutIntent", "buyer", "event-1"], ["replace", "/event/event-1"]]);
});

test("server-confirmed ticket completion retires the saved key before buying the same selection again", async () => {
  for (const amount of [0, 100000]) {
    reset();
    const intent = JSON.stringify({ type: "TICKET", provider: "PAYSTACK", items: [{ id: "ticket-1", quantity: 1 }] });
    const previous = await checkoutUtils.checkoutIntentKey("buyer", "event-1", intent);
    transaction.data.status = "SUCCESS";
    transaction.data.amount = amount;
    render(); await runEffects();
    const next = await checkoutUtils.checkoutIntentKey("buyer", "event-1", intent);
    assert.notEqual(next, previous);
    assert.equal(await checkoutUtils.checkoutIntentKey("buyer", "event-1", intent), next);
    assert.equal(calls.some(([kind]) => kind === "replace" || kind === "push"), false);
  }
});

test("unfinished ticket payments and completed registrations preserve their checkout retry key", async () => {
  for (const [type, status] of [["TICKET", "PENDING"], ["TICKET", "AWAITING_TRANSFER"], ["TICKET", "PROCESSING"], ["REGISTRATION", "SUCCESS"]]) {
    reset();
    const previous = await checkoutUtils.checkoutIntentKey("buyer", "event-1", type);
    transaction.data.metadata.type = type;
    transaction.data.status = status;
    render(); await runEffects();
    assert.equal(await checkoutUtils.checkoutIntentKey("buyer", "event-1", type), previous);
    assert.equal(calls.some(([kind]) => kind === "clearCheckoutIntent"), false);
  }
});

test("completed registration and donation keep the carpool invitation without the ticket purchase action", () => {
  for (const type of ["REGISTRATION", "DONATION"]) {
    reset();
    transaction.data.status = "SUCCESS";
    transaction.data.metadata.type = type;
    eventDetails = { data: { isPhysicalEvent: true } };
    assert.ok(button("Share your car to event?"));
    assert.equal(button("Buy more tickets"), undefined);
    assert.equal(button("Start a new checkout"), undefined);
  }
});

test("carpool creation is unavailable until checkout succeeds and event details are loaded", () => {
  reset();
  transaction.data.status = "SUCCESS";
  assert.equal(button("Share your car to event?"), undefined);
  for (const status of ["PENDING", "AWAITING_TRANSFER", "PROCESSING", "EXPIRED", "FAILED", "REFUND_REQUIRED", "REFUNDED"]) {
    transaction.data.status = status;
    eventDetails = { data: { isPhysicalEvent: true } };
    assert.equal(button("Share your car to event?"), undefined);
    if (["EXPIRED", "FAILED", "REFUND_REQUIRED", "REFUNDED"].includes(status)) {
      assert.ok(button("Start a new checkout"));
    }
  }
});

test("the carpool invitation animates Gogo only while focused with motion enabled", () => {
  reset(); transaction.data.status = "SUCCESS";
  eventDetails = { data: { isPhysicalEvent: true } };
  try {
    for (const [isFocused, reduceMotion, animated] of [[true, false, true], [true, true, false], [false, false, false]]) {
      focused = isFocused; reducedMotion = reduceMotion;
      const tree = render();
      const artwork = [...nodes(tree)].find(node => node.type === "CarpoolArtwork");
      assert.equal(artwork.props.animated, animated);
      assert.equal(button("Share your car to event?", tree).props.accessibilityHint, "Opens the carpool creation sheet for this event");
    }
  } finally { focused = true; reducedMotion = false; }
});
