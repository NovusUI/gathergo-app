import type { Message } from "@/types/chat";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { z } from "zod";

export type QueuedMessage = Pick<
  Message,
  "carpoolId" | "senderId" | "sender" | "content" | "createdAt"
> & {
  tempId: string;
  error: string | null;
};

const queueSchema = z.array(
  z.object({
    carpoolId: z.string(),
    senderId: z.string(),
    sender: z.object({ id: z.string(), username: z.string().nullable() }),
    content: z.string(),
    createdAt: z.string(),
    tempId: z.string(),
    error: z.string().nullable(),
  }),
) satisfies z.ZodType<QueuedMessage[]>;

// The old global queue did not record its sender. Retain that storage untouched:
// it cannot safely be replayed under whichever account next opens the app.
const storageKey = "chat-outbox-storage";
let hydration: Promise<void> | undefined;
let pendingWrite = Promise.resolve();
function serializeWrite(action: () => Promise<void>) {
  const operation = pendingWrite.then(action);
  pendingWrite = operation.catch(() => {});
  return operation;
}

interface MessageQueueState {
  queue: QueuedMessage[];
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  addMessage: (message: QueuedMessage) => Promise<void>;
  confirmMessages: (messages: Message[]) => Promise<void>;
  failMessage: (
    senderId: string,
    tempId: string,
    error: string,
  ) => Promise<void>;
  retryMessage: (senderId: string, tempId: string) => Promise<void>;
}

export const useMessageQueueStore = create<MessageQueueState>()((set, get) => {
  const changeQueue = async (
    update: (queue: QueuedMessage[]) => QueuedMessage[],
  ) => {
    await get().hydrate();
    await serializeWrite(async () => {
      const previous = get().queue;
      const queue = update(previous);
      if (queue === previous) return;
      // Publish to the sender only after durable storage succeeds.
      await AsyncStorage.setItem(storageKey, JSON.stringify(queue));
      set({ queue });
    });
  };
  return {
    queue: [],
    hasHydrated: false,
    hydrate: () => {
      if (!hydration) {
        hydration = (async () => {
          const saved = await AsyncStorage.getItem(storageKey);
          const queue =
            saved === null ? [] : queueSchema.parse(JSON.parse(saved));
          set({ queue, hasHydrated: true });
        })().catch((error) => {
          hydration = undefined;
          throw error;
        });
      }
      return hydration;
    },
    addMessage: (message) =>
      changeQueue((queue) => {
        if (
          queue.some(
            (item) =>
              item.senderId === message.senderId &&
              item.tempId === message.tempId,
          )
        )
          return queue;
        return [...queue, message];
      }),
    confirmMessages: (messages) =>
      changeQueue((queue) => {
        const remaining = queue.filter(
          (item) =>
            !messages.some(
              (message) =>
                message.senderId === item.senderId &&
                message.carpoolId === item.carpoolId &&
                message.tempId === item.tempId,
            ),
        );
        return remaining.length === queue.length ? queue : remaining;
      }),
    failMessage: (senderId, tempId, error) =>
      changeQueue((queue) =>
        queue.map((item) =>
          item.senderId === senderId && item.tempId === tempId
            ? { ...item, error }
            : item,
        ),
      ),
    retryMessage: (senderId, tempId) =>
      changeQueue((queue) =>
        queue.map((item) =>
          item.senderId === senderId && item.tempId === tempId
            ? { ...item, error: null }
            : item,
        ),
      ),
  };
});

export function pendingMessage(message: QueuedMessage): Message {
  return { ...message, id: message.tempId, readBy: [], optimistic: true };
}
