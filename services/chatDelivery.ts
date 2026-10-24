import { useMessageQueueStore } from "@/store/messageQueue";
import type {
  Message,
  SendMessagePayload,
  SendMessageResult,
} from "@/types/chat";
import { showGlobalError } from "@/utils/globalErrorHandler";
import { AppState } from "react-native";
import type { Socket } from "socket.io-client";

const acknowledgmentTimeout = 15000;

export function startChatDelivery(
  socket: Socket,
  userId: string,
  receive: (message: Message) => void,
) {
  let stopped = false;
  let running = false;
  let retryDelay = 1000;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const store = useMessageQueueStore;

  const confirm = async (message: Message) => {
    receive(message);
    await store.getState().confirmMessages([message]);
  };
  const scheduleRetry = () => {
    if (stopped || timer) return;
    timer = setTimeout(() => {
      timer = undefined;
      void flush();
    }, retryDelay);
    retryDelay = Math.min(retryDelay * 2, 30000);
  };
  const flush = async () => {
    if (
      stopped ||
      running ||
      timer ||
      !socket.connected ||
      !store.getState().hasHydrated
    )
      return;
    running = true;
    try {
      while (!stopped && socket.connected) {
        const item = store
          .getState()
          .queue.find(
            (message) => message.senderId === userId && message.error === null,
          );
        if (!item) break;
        const payload: SendMessagePayload = {
          carpoolId: item.carpoolId,
          content: item.content,
          tempId: item.tempId,
        };
        const result: SendMessageResult = await socket
          .timeout(acknowledgmentTimeout)
          .volatile.emitWithAck("sendMessage", payload);
        if (stopped) break;
        if (result.ok) {
          await confirm(result.message);
          retryDelay = 1000;
        } else if (result.retryable) {
          scheduleRetry();
          break;
        } else {
          await store.getState().failMessage(userId, item.tempId, result.error);
        }
      }
    } catch (error) {
      if (!stopped) console.warn("Message delivery awaiting retry", error);
      // Timeouts mean the receipt is unknown. Keep the same durable key for retry.
      if (!stopped) scheduleRetry();
    } finally {
      running = false;
    }
  };
  const wake = () => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
    retryDelay = 1000;
    void flush();
  };
  const onMessage = (message: Message) => {
    void confirm(message).catch((error) => {
      console.error("Could not persist chat receipt", error);
      showGlobalError(
        "Couldn't save the message receipt. It will be checked again.",
      );
    });
  };
  const unsubscribe = store.subscribe(() => {
    void flush();
  });
  socket.on("connect", wake);
  socket.on("newMessage", onMessage);
  const appState = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      if (!socket.connected) socket.connect();
      wake();
    }
  });
  void store
    .getState()
    .hydrate()
    .then(wake)
    .catch((error) => {
      console.error("Could not restore pending chat messages", error);
      showGlobalError(
        "Couldn't restore pending messages. Please reopen the app to try again.",
      );
    });

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    unsubscribe();
    appState.remove();
    socket.off("connect", wake);
    socket.off("newMessage", onMessage);
  };
}
