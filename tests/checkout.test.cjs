const assert = require("node:assert/strict");
const { test } = require("node:test");
const { randomUUID } = require("node:crypto");
const { loadTypeScript } = require("./loadTypeScript.cjs");
const storage = new Map();
const {
  checkoutIntentKey,
  clearCheckoutIntent,
  checkoutDeadline,
  remainingCheckoutSeconds,
} = loadTypeScript("utils/checkout.ts", {
  "react-native-get-random-values": {},
  uuid: { v4: randomUUID },
  "./storage": {
    getItem: async (key) => storage.get(key) ?? null,
    saveItem: async (key, value) => {
      storage.set(key, value);
    },
    removeItem: async (key) => {
      storage.delete(key);
    },
  },
});

test("network retries and concurrent taps reuse one persisted checkout key", async () => {
  const keys = await Promise.all(
    Array.from({ length: 20 }, () =>
      checkoutIntentKey("buyer", "event", "one-ticket"),
    ),
  );
  assert.equal(new Set(keys).size, 1);
  assert.equal(
    await checkoutIntentKey("buyer", "event", "one-ticket"),
    keys[0],
  );
});
test("different buyers and changed orders receive different keys", async () => {
  const first = await checkoutIntentKey("buyer", "event2", "one-ticket");
  assert.notEqual(
    await checkoutIntentKey("buyer2", "event2", "one-ticket"),
    first,
  );
  assert.notEqual(
    await checkoutIntentKey("buyer", "event2", "two-tickets"),
    first,
  );
});
test("an explicit new checkout renews the key after terminal status", async () => {
  const first = await checkoutIntentKey("buyer", "event3", "one-ticket");
  await clearCheckoutIntent("buyer", "event3");
  assert.notEqual(
    await checkoutIntentKey("buyer", "event3", "one-ticket"),
    first,
  );
});
test("server clock skew does not change the duration of the hold", () => {
  const deadline = checkoutDeadline(
    "2026-10-17T12:05:00Z",
    "2026-10-17T12:00:00Z",
    1000,
  );
  assert.equal(remainingCheckoutSeconds(deadline, 1000), 300);
  assert.equal(remainingCheckoutSeconds(deadline, 61000), 240);
});
test("reopening cached checkout data and returning from background never restart the timer", () => {
  const deadline = checkoutDeadline(
    "2026-10-17T12:05:00Z",
    "2026-10-17T12:00:00Z",
    1000,
  );
  assert.equal(remainingCheckoutSeconds(deadline, 241000), 60);
  assert.equal(remainingCheckoutSeconds(deadline, 601000), 0);
});
test("free and completed checkouts have no timed hold", () => {
  assert.equal(checkoutDeadline(null, "2026-10-17T12:00:00Z", 1000), null);
});

const requests = [];
let providerResponse;
let providerFailure;
const urls = loadTypeScript("services/urls.ts", { "@/constants/network": { API_BASE_URL: "https://api.checkout.test/api/v1" } });
const api = loadTypeScript("services/serviceFn.ts", {
  "@/utils/checkout": { checkoutDeadline, clearCheckoutIntent },
  "@/api/client": { default: {
    post: async (...args) => { requests.push(args); if (providerFailure) throw providerFailure; return { data: providerResponse }; },
    get: async (...args) => { requests.push(args); return { data: providerResponse }; },
  } },
  "@/api/uploadClient": { uploadClient: {} },
  "./urls": urls,
});
function checkoutResponse() {
  return { status: "success", message: "Checkout ready", data: {
    checkoutStatus: "PENDING", initializationStatus: "READY", reservationStatus: "HELD",
    reservationExpiresAt: "2026-10-17T12:05:00Z", serverTime: "2026-10-17T12:00:00Z", maxTicketsPerCheckout: 4,
    message: "Checkout ready", transactionId: "checkout-1", paymentProvider: "PAYSTACK", paymentUrl: "https://checkout.paystack.com/test", paymentInstructions: null,
    unavailableTickets: [], freeTickets: [], totalAmount: 1000, totalAmountKobo: 100000,
    pricing: { grossAmountKobo: 100000, grossAmountNaira: 1000, chargeAmountKobo: 100000, chargeAmountNaira: 1000, buyerFeeTotalKobo: 0, buyerFeeTotalNaira: 0, buyerProviderFeeKobo: 0, buyerPlatformFeeKobo: 0, providerFeeKobo: 0, platformFeeKobo: 0, creatorPayableKobo: 100000, creatorPayableNaira: 1000 }, riskStatus: "CLEAR", settlementStatus: "READY",
  } };
}
test("ticket requests send the checkout key in the inspected API header and derive a local deadline", async () => {
  providerResponse = checkoutResponse(); requests.length = 0;
  const key = randomUUID(); const before = Date.now();
  const response = await api.getTickets({ idempotencyKey: key, items: [{ id: "ticket-1", ticketName: "General", quantity: 1 }], provider: "PAYSTACK" });
  assert.equal(requests[0][0], urls.EVENT_URL.getTickets);
  assert.equal(requests[0][2].headers["Idempotency-Key"], key);
  assert.equal(requests[0][1].idempotencyKey, undefined);
  assert.ok(response.data.checkoutDeadlineMs >= before + 300000);
  assert.equal(providerResponse.data.checkoutDeadlineMs, undefined);
});
test("registration checkout uses the eventid query and preserves its retry key", async () => {
  providerResponse = checkoutResponse(); requests.length = 0;
  const key = randomUUID();
  await api.registerForEvent({ eventId: "event-1", provider: "PAYSTACK", idempotencyKey: key, platform: "mobile" });
  assert.equal(requests[0][0], urls.EVENT_URL.registerEvent);
  assert.equal(requests[0][2].params.eventid, "event-1");
  assert.equal(requests[0][2].headers["Idempotency-Key"], key);
});
test("cancellation calls the actual endpoint and returns no active deadline", async () => {
  providerResponse = checkoutResponse(); requests.length = 0;
  providerResponse.data.checkoutStatus = "EXPIRED";
  providerResponse.data.reservationStatus = "CANCELLED";
  providerResponse.data.reservationExpiresAt = null;
  const response = await api.cancelCheckout("checkout-1");
  assert.equal(requests[0][0], "https://api.checkout.test/api/v1/transaction-reference/checkout-1/cancel");
  assert.equal(response.data.checkoutDeadlineMs, null);
});
test("status responses derive ticket deadlines and preserve donation responses without a hold", async () => {
  providerResponse = checkoutResponse();
  Object.assign(providerResponse.data, { id: "checkout-1", status: "PENDING", paymentType: "TICKET", amount: 100000, metadata: { type: "TICKET", eventId: "event-1", eventTitle: "Live event" } });
  const response = await api.getTransactionRef({ queryKey: ["transactionRef", "checkout-1"] });
  assert.equal(typeof response.data.checkoutDeadlineMs, "number");
  providerResponse = { status: "success", message: "Request successful", data: { id: "donation-1", status: "PENDING", paymentType: "DONATION", paymentProvider: "PAYSTACK", amount: 100000, metadata: { type: "DONATION", eventId: "event-1", eventTitle: "Live event" } } };
  assert.equal((await api.getTransactionRef({ queryKey: ["transactionRef", "donation-1"] })).data.checkoutDeadlineMs, null);
});


test("cancelling a checkout clears its saved retry key only after the API confirms release", async () => {
  const original = await checkoutIntentKey("cancel-buyer", "cancel-event", "one-ticket");
  providerResponse = checkoutResponse();
  providerResponse.data.checkoutStatus = "EXPIRED";
  providerResponse.data.reservationStatus = "CANCELLED";
  providerResponse.data.reservationExpiresAt = null;
  providerFailure = new Error("Network unavailable");
  await assert.rejects(api.cancelEventCheckout("checkout-1", "cancel-buyer", "cancel-event"), /Network unavailable/);
  assert.equal(await checkoutIntentKey("cancel-buyer", "cancel-event", "one-ticket"), original);
  providerFailure = undefined;
  await api.cancelEventCheckout("checkout-1", "cancel-buyer", "cancel-event");
  assert.notEqual(await checkoutIntentKey("cancel-buyer", "cancel-event", "one-ticket"), original);
});

const wrapperHooks = {
  useRef: initial => ({ current: initial }),
  useEffect: callback => callback(),
};
const { PaystackWebViewWrapper } = loadTypeScript("components/PaystackWebViewWrapper.tsx", {
  "@/components/ui/AppLoader": { default: "Loader" },
  "@/components/ui/CheckoutCountdown": { CheckoutCountdown: "Countdown" },
  "@/components/ui/AppToast": { default: "Toast" },
  "@expo/vector-icons": { Ionicons: "Icon" },
  react: wrapperHooks,
  "react-native": { Modal: "Modal", View: "View", Text: "Text", TouchableOpacity: "Button" },
  "react-native-webview": { default: "WebView" },
  twrnc: { default: () => ({}) },
});
function* paymentNodes(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity)) yield* paymentNodes(child);
}
function paymentWrapper() {
  const calls = [];
  const tree = PaystackWebViewWrapper({
    visible: true, paymentUrl: "https://checkout.paystack.com/test", type: "TICKET",
    onClose: () => calls.push("close"), onCancel: () => calls.push("cancel"),
    onSuccess: ref => calls.push(["success", ref]), onError: () => calls.push("error"),
  });
  return { calls, tree, web: [...paymentNodes(tree)].find(n => n.type === "WebView"), close: [...paymentNodes(tree)].find(n => n.props?.accessibilityLabel === "Cancel payment") };
}
test("Paystack close button and Android back each cancel and close exactly once", () => {
  for (const action of ["close", "back"]) {
    const { calls, tree, web, close } = paymentWrapper();
    assert.ok(close);
    if (action === "close") close.props.onPress();
    else tree.props.onRequestClose();
    web.props.onNavigationStateChange({ url: "https://example.test/cancel", title: "Cancelled" });
    assert.deepEqual(calls, ["cancel", "close"]);
  }
});
test("Paystack gateway cancellation reaches the same cancellation path once", () => {
  const { calls, web } = paymentWrapper();
  web.props.onNavigationStateChange({ url: "https://example.test/cancel", title: "Cancelled" });
  web.props.onNavigationStateChange({ url: "https://example.test/cancel", title: "Cancelled" });
  assert.deepEqual(calls, ["cancel", "close"]);
});
test("success and errors close checkout without triggering cancellation afterwards", () => {
  for (const outcome of ["success", "error"]) {
    const { calls, tree, web } = paymentWrapper();
    web.props.onNavigationStateChange({ url: outcome === "success" ? "https://example.test/callback?reference=paid-reference" : "https://example.test/error", title: outcome });
    tree.props.onRequestClose();
    assert.deepEqual(calls, [outcome === "success" ? ["success", "paid-reference"] : "error", "close"]);
  }
});
