const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");

let values = [], cursor = 0;
const hooks = {
  useState(initial) {
    const index = cursor++;
    if (!(index in values)) values[index] = initial;
    return [values[index], next => { values[index] = typeof next === "function" ? next(values[index]) : next; }];
  },
  useRef: initial => ({ current: initial }),
  useMemo: factory => factory(),
  useCallback: callback => callback,
  useEffect() {},
};
const calls = [];
let transaction, queryError, cancelFailure, refetchFailure;
const tw = () => ({});
const { default: Transaction } = loadTypeScript("app/(app)/transaction/[transactionId].tsx", {
  "@/components/ui/CheckoutCountdown": { CheckoutCountdown: "Countdown" },
  "@/hooks/useCheckoutCountdown": { useCheckoutCountdown: () => 300 },
  "@/utils/checkout": { clearCheckoutIntent() {} },
  "@/services/serviceFn": { cancelEventCheckout: async (...args) => {
    calls.push(["cancel", ...args]);
    if (cancelFailure) throw cancelFailure;
  } },
  "@/components/PaystackWebViewWrapper": { PaystackWebViewWrapper: "Payment" },
  "@/components/CustomeTopBarNav": { default: "TopBar" },
  "@/components/QRCodeGen": { default: "QR" },
  "@/components/View": { default: "Content" },
  "@/components/buttons/CustomBtn1": { default: "ActionButton" },
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
    useEventDetails: () => ({}),
    useTicketOrRegByTransactionRef: () => ({}),
  },
  "@/utils/dateTimeHandler": { formatEventDateTime: () => "Tomorrow" },
  "@/utils/globalErrorHandler": { showGlobalError: message => calls.push(["error", message]) },
  "@/utils/navigation": { useLockedRouter: () => ({}), safeGoBack() {} },
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
  for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child);
}
function render() { cursor = 0; return Transaction(); }
function button(label, page = render()) {
  return [...nodes(page)].find(n => n.type === "Button" && [...nodes(n)].some(child => child.props?.children === label));
}
function reset() {
  values = []; calls.length = 0; queryError = false; cancelFailure = undefined; refetchFailure = false;
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
