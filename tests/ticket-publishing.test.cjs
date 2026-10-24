const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTypeScript } = require("./loadTypeScript.cjs");

function* nodes(node) {
  if (!node || typeof node !== "object") return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child);
}
const { default: TicketCard } = loadTypeScript("components/eventInfo/TicketCard.tsx", {
  "@/hooks/usePressGuard": { usePressGuard: (callback) => callback },
  "@/utils/globalErrorHandler": { showGlobalWarning() {} },
  "@/utils/utils": { numberWithCommas: String },
  "lucide-react-native": { ChevronRight: "Chevron", Edit3: "Edit", Trash: "Trash" },
  react: { useState: (initial) => [initial, () => {}] },
  "react-native": { Text: "Text", View: "View", TouchableOpacity: "Button" },
  twrnc: { default: () => ({}) },
});
const props = { title: "General", price: 1500, description: "Admission", isVisible: false };
const publishButton = (tree) => [...nodes(tree)].find(node => node.props?.accessibilityLabel === "Publish General ticket");
test("hidden ticket cards expose an accessible publish action only when supplied by the organiser view", () => {
  let calls = 0;
  const tree = TicketCard({ ...props, onPublish: () => { calls++; } });
  const button = publishButton(tree);
  assert.ok(button);
  assert.equal(button.props.disabled, false);
  button.props.onPress();
  assert.equal(calls, 1);
  assert.equal(publishButton(TicketCard(props)), undefined);
  assert.equal(publishButton(TicketCard({ ...props, isVisible: true, onPublish() {} })), undefined);
});
test("publishing cards announce busy state and disable repeated presses", () => {
  const button = publishButton(TicketCard({ ...props, onPublish() {}, isPublishing: true }));
  assert.equal(button.props.disabled, true);
  assert.deepEqual(button.props.accessibilityState, { disabled: true, busy: true });
  assert.equal(publishButton(TicketCard({ ...props, onPublish() {}, publishDisabled: true })).props.disabled, true);
});

const requests = [];
let failure;
const response = { status: "success", message: "Request successful", data: {
  id: "ticket-1", type: "General", description: "Admission", price: 1500,
  quantity: 50, sold: 4, perks: [], isVisible: true, updatedPrice: null,
} };
const urls = loadTypeScript("services/urls.ts", { "@/constants/network": { API_BASE_URL: "https://api.gathergo.test/api/v1" } });
const api = loadTypeScript("services/serviceFn.ts", {
  "@/api/client": { default: { patch: async (...args) => {
    requests.push(args);
    if (failure) throw failure;
    return { data: response };
  } } },
  "@/api/uploadClient": { uploadClient: {} },
  "@/utils/checkout": { checkoutDeadline: () => null },
  "./urls": urls,
});
test("ticket publication uses the inspected partial-update API without sending pricing or stock", async () => {
  assert.strictEqual(await api.publishEventTicket("ticket-1"), response);
  assert.deepEqual(requests.at(-1), ["https://api.gathergo.test/api/v1/event-tickets/ticket-1", { isVisible: true }]);
  failure = new Error("Not allowed to update this ticket");
  await assert.rejects(api.publishEventTicket("ticket-1"), error => error === failure);
  failure = undefined;
});

const refreshed = [];
let mutation;
const queryKeys = loadTypeScript("services/queryKeys.ts");
const { usePublishEventTicket } = loadTypeScript("services/mutations.ts", {
  "@/context/AuthContext": { useAuth: () => ({}) },
  "@/utils/globalErrorHandler": { showGlobalError() {} },
  "@/utils/storage": { saveItem() {} },
  "./serviceFn": api,
  "./queryKeys": queryKeys,
  "@tanstack/react-query": {
    useQueryClient: () => ({ invalidateQueries: async ({ queryKey }) => { refreshed.push(queryKey); } }),
    useMutation: config => { mutation = config; return config; },
  },
});
test("publishing refreshes event details and event lists before reporting success", async () => {
  let refreshCount = 0;
  usePublishEventTicket("event-1", { onSuccess: () => { refreshCount = refreshed.length; } });
  assert.strictEqual(mutation.mutationFn, api.publishEventTicket);
  await mutation.onSuccess(response, "ticket-1");
  assert.ok(refreshed.some(key => JSON.stringify(key) === JSON.stringify([queryKeys.QUERY_KEYS.eventDetails, "event-1"])));
  assert.ok(refreshed.some(key => JSON.stringify(key) === JSON.stringify([queryKeys.QUERY_KEYS.foryouEvents])));
  assert.ok(refreshed.some(key => JSON.stringify(key) === JSON.stringify([queryKeys.QUERY_KEYS.getEventDashboard, "event-1"])));
  assert.equal(refreshCount, refreshed.length);
});
