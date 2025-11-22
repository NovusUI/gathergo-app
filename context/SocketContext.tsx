// contexts/SocketContext.tsx
import { useAuthStore } from "@/store/auth";
import { useMessageQueueStore } from "@/store/messageQueue";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Socket, io } from "socket.io-client";
import { useAuth } from "./AuthContext";

type SocketContextType = {
  socket: Socket | null;
  unreadCount: number;
  conversationTray: any[];
  loadingConversations: boolean;
  updateConversationAfterSend: (carpoolId: string, message: any) => void;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  unreadCount: 0,
  conversationTray: [],
  loadingConversations: true,
  updateConversationAfterSend: () => {},
  isConnected: false,
});
const applyTrayUpdateAfterSend = (
  carpoolId: string,
  message: any,
  queryClient: any,
  setConversationTray: any
) => {
  // Update React Query cache
  queryClient.setQueryData(["conversations"], (old: any[] = []) => {
    const map = new Map(old.map((c) => [c.carpool.id, c]));
    const existing = map.get(carpoolId);
    if (!existing) return old;

    const updated = {
      ...existing,
      lastMessage: message.content,
      lastMessageAt: message.createdAt,
      unreadCount: 0,
    };

    map.set(carpoolId, updated);
    return Array.from(map.values()).sort(sortFn);
  });

  // Update local state
  setConversationTray((old: any[]) => {
    const map = new Map(old.map((c) => [c.carpool.id, c]));
    const existing = map.get(carpoolId);
    if (!existing) return old;

    const updated = {
      ...existing,
      lastMessage: message.content,
      lastMessageAt: message.createdAt,
      unreadCount: 0,
    };

    map.set(carpoolId, updated);
    return Array.from(map.values()).sort(sortFn);
  });
};

// --- Sort helper ---
const sortFn = (a: any, b: any) => {
  const aDate = new Date(
    a.lastMessageAt || a.carpool?.createdAt || 0
  ).getTime();
  const bDate = new Date(
    b.lastMessageAt || b.carpool?.createdAt || 0
  ).getTime();
  return bDate - aDate;
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversationTray, setConversationTray] = useState<any[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);

  const { queue, clearQueue, setQueue } = useMessageQueueStore();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();
  const userId = user?.id;
  const { refreshToken } = useAuthStore();

  const updateConversationAfterSend = useCallback(
    (carpoolId: string, message: any) => {
      applyTrayUpdateAfterSend(
        carpoolId,
        message,
        queryClient,
        setConversationTray
      );
    },
    [queryClient]
  );

  useEffect(() => {
    console.log(userId, refreshToken);
    if (userId && refreshToken) {
      console.log(userId, "this is userId");
      if (socketRef.current) return;

      const newSocket = io("http://10.114.200.150:4000", {
        transports: ["websocket"],
        auth: { userId: user?.id, token: refreshToken },
        // Enhanced reconnection settings
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        // Force new connection to ensure clean state
        forceNew: true,
        // Upgrade ASAP from HTTP long-polling to WebSocket
        upgrade: true,
      });
      socketRef.current = newSocket;
      setSocket(newSocket);

      newSocket.on("connect", async () => {
        console.log("✅ Connected to socket server");

        // --- Initial tray when app opens
        newSocket.emit("getConversationTray", { userId }, (tray: any[]) => {
          //queryClient.setQueryData(["conversations"], tray);
        });

        // --- Initial unread counts
        newSocket.emit(
          "getUnreadCount",
          { userId },
          (counts: Record<string, number>) => {
            //queryClient.setQueryData(["unreadCounts"], counts);
          }
        );

        console.log(queue.length, "rthjj");
        if (queue.length > 0) {
          for (const { carpoolId, content, tempId } of queue) {
            newSocket.emit("sendMessage", { carpoolId, content, tempId });
          }
          await clearQueue();
        }
      });
      // --- Handle new / updated conversations
      newSocket.on("conversationTrayUpdate", (data: any) => {
        console.log("conversation tray update", data);

        //
        // ✅ Case 1: Full tray array
        //
        if (Array.isArray(data)) {
          setConversationTray(data);
          setLoadingConversations(false);

          queryClient.setQueryData(["conversations"], () => {
            return data.sort((a, b) => {
              const aDate = new Date(
                a.lastMessageAt || a.carpool?.createdAt || 0
              ).getTime();
              const bDate = new Date(
                b.lastMessageAt || b.carpool?.createdAt || 0
              ).getTime();
              return bDate - aDate;
            });
          });

          return;
        }

        //
        // ✅ From here on, the payload is NOT an array.
        // It may be:
        //   { carpoolId, unreadCount }
        //   { carpoolId, lastMessage, unreadCount }
        //

        const { carpoolId } = data;

        queryClient.setQueryData(["conversations"], (old: any[] = []) => {
          const existingMap = new Map(old.map((c) => [c.carpool.id, c]));

          const existing = existingMap.get(carpoolId);

          //
          // ✅ Case 2: Only unread count changed
          //
          if (data.unreadCount !== undefined && !data.lastMessage) {
            if (!existing) return old;

            existingMap.set(carpoolId, {
              ...existing,
              unreadCount: data.unreadCount,
            });

            return Array.from(existingMap.values()).sort(sortFn);
          }

          //
          // ✅ Case 3: A new last message arrived
          //
          if (data.lastMessage) {
            const updated = {
              ...existing,
              lastMessage: data.lastMessage.content,
              lastMessageAt: data.lastMessage.createdAt,
              unreadCount: data.unreadCount ?? existing?.unreadCount ?? 0,
            };

            existingMap.set(carpoolId, updated);

            return Array.from(existingMap.values()).sort(sortFn);
          }

          return old;
        });

        //
        // ✅ Also reflect into local state tray
        //
        setConversationTray((old: any[]) => {
          const map = new Map(old.map((c) => [c.carpool.id, c]));
          const existing = map.get(carpoolId);

          if (data.unreadCount !== undefined && !data.lastMessage) {
            if (!existing) return old;

            map.set(carpoolId, {
              ...existing,
              unreadCount: data.unreadCount,
            });

            return Array.from(map.values()).sort(sortFn);
          }

          if (data.lastMessage) {
            const updated = {
              ...existing,
              lastMessage: data.lastMessage.content,
              lastMessageAt: data.lastMessage.createdAt,
              unreadCount: data.unreadCount ?? existing?.unreadCount ?? 0,
            };

            map.set(carpoolId, updated);
            return Array.from(map.values()).sort(sortFn);
          }

          return old;
        });
      });

      // --- Handle unread counts
      newSocket.on("unreadCountUpdate", (data) => {
        console.log("unread counts", data);
        setUnreadCount(data.totalUnread);

        queryClient.setQueryData(
          ["unreadCounts"],
          (old: Record<string, number> = {}) => ({
            ...old,
            totalUnread: data.totalUnread,
          })
        );
      });

      newSocket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket connect error:", err.message);
      });

      return () => {
        newSocket.disconnect();
        socketRef.current = null;
      };
    }
  }, [userId, refreshToken]);

  useEffect(() => {
    if (socket?.connected) {
      console.log("connection solid");
    } else {
      console.log("connection unsolid");
    }
  }, [socket?.connected, userId, refreshToken]);

  useEffect(() => {
    if (!userId) {
      queryClient.removeQueries();
      setConversationTray([]);
      setUnreadCount(0);
      setLoadingConversations(true);
    }
  }, [userId]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        unreadCount,
        conversationTray,
        loadingConversations,
        updateConversationAfterSend,
        isConnected: socket?.connected || false,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
