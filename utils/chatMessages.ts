import type { Message, MessagesInfiniteData } from "@/types/chat";

const clientKey = (message: Message) =>
  message.tempId === null
    ? null
    : JSON.stringify([message.senderId, message.carpoolId, message.tempId]);

export function uniqueMessages(messages: Message[]): Message[] {
  const ids = new Set<string>();
  const keys = new Set<string>();
  const unique: Message[] = [];
  // A server receipt always wins over its local pending copy.
  for (const message of [
    ...messages.filter((m) => !m.optimistic),
    ...messages.filter((m) => m.optimistic),
  ]) {
    const key = clientKey(message);
    if (ids.has(message.id) || (key !== null && keys.has(key))) continue;
    ids.add(message.id);
    if (key !== null) keys.add(key);
    unique.push(message);
  }
  return unique.sort(
    (a, b) =>
      b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
  );
}

export function mergeMessagePages(
  old: MessagesInfiniteData | undefined,
  incoming: Message[],
): MessagesInfiniteData {
  if (!old || old.pages.length === 0) {
    return {
      pages: [uniqueMessages(incoming)],
      pageParams: [{ before: null, beforeId: null }],
    };
  }
  const pages = [[...incoming, ...old.pages[0]], ...old.pages.slice(1)];
  const winners = new Set(uniqueMessages(pages.flat()));
  const seen = new Set<string>();
  const merged = pages.map((page) =>
    page
      .filter((message) => {
        if (!winners.has(message) || seen.has(message.id)) return false;
        seen.add(message.id);
        return true;
      })
      .sort(
        (a, b) =>
          b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
      ),
  );
  const retained = merged
    .map((page, index) => ({ page, param: old.pageParams[index] }))
    .filter(({ page }, index) => index === 0 || page.length > 0);
  return {
    ...old,
    pages: retained.map(({ page }) => page),
    pageParams: retained.map(({ param }) => param),
  };
}
