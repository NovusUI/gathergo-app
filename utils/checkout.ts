import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { getItem, removeItem, saveItem } from "./storage";

const pending = new Map<string, Promise<string>>();
const storageKey = (userId: string, eventId: string) =>
  `checkout.${userId}.${eventId}`;

export function checkoutIntentKey(
  userId: string,
  eventId: string,
  intent: string,
): Promise<string> {
  const key = storageKey(userId, eventId);
  const existing = pending.get(key);
  if (existing)
    return existing.then(() => checkoutIntentKey(userId, eventId, intent));
  const operation = (async () => {
    const stored = await getItem(key);
    if (stored) {
      // This is locally persisted app data; malformed storage remains visible as an error.
      const saved: { intent: string; key: string } = JSON.parse(stored);
      if (saved.intent === intent) return saved.key;
    }
    const idempotencyKey = uuidv4();
    await saveItem(key, JSON.stringify({ intent, key: idempotencyKey }));
    return idempotencyKey;
  })();
  pending.set(key, operation);
  return operation.finally(() => {
    pending.delete(key);
  });
}

export const clearCheckoutIntent = (userId: string, eventId: string) =>
  removeItem(storageKey(userId, eventId));

export function checkoutDeadline(
  expiresAt: string | null,
  serverTime: string,
  receivedAt = Date.now(),
): number | null {
  return expiresAt === null
    ? null
    : receivedAt + Date.parse(expiresAt) - Date.parse(serverTime);
}

export function remainingCheckoutSeconds(
  deadlineMs: number,
  now = Date.now(),
): number {
  return Math.max(0, Math.ceil((deadlineMs - now) / 1000));
}
