// src/store/messageQueue.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface QueuedMessage {
  carpoolId: string;
  content: any;
  tempId: string;
}

interface MessageQueueState {
  queue: QueuedMessage[];
  addMessage: (msg: QueuedMessage) => Promise<void>;
  removeMessage: (index: number) => Promise<void>;
  clearQueue: () => Promise<void>;
  setQueue: (queue: QueuedMessage[]) => void;
}

export const useMessageQueueStore = create<MessageQueueState>()(
  persist(
    (set, get) => ({
      queue: [],

      addMessage: async (msg) => {
        const newQueue = [...get().queue, msg];
        set({ queue: newQueue });
      },

      removeMessage: async (index) => {
        const newQueue = get().queue.filter((_, i) => i !== index);
        set({ queue: newQueue });
      },

      clearQueue: async () => {
        set({ queue: [] });
      },

      setQueue: (queue) => set({ queue }),
    }),
    {
      name: "message-queue-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
