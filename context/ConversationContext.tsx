// contexts/ConversationContext.tsx
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "./SocketContext";

type ConversationContextType = {
  conversationTray: any[];
  loadingConversations: boolean;
  updateConversationAfterSend: (carpoolId: string, message: any) => void;
  unreadCount: number;
};

const ConversationContext = createContext<ConversationContextType>({
  conversationTray: [],
  loadingConversations: true,
  updateConversationAfterSend: () => {},
  unreadCount: 0,
});

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

export const ConversationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [conversationTray, setConversationTray] = useState<any[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const updateConversationAfterSend = (carpoolId: string, message: any) => {
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

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log("✅ Socket connected, loading notifications");
      socket.emit("getConversationTray", {});
    };

    // Handle conversation tray updates
    const handleConversationTrayUpdate = (data: any) => {
      console.log("conversation tray update", data);

      // Full tray array
      if (Array.isArray(data)) {
        setConversationTray(data);
        setLoadingConversations(false);
        queryClient.setQueryData(["conversations"], () => data.sort(sortFn));
        return;
      }

      // Partial update
      const { carpoolId } = data;

      queryClient.setQueryData(["conversations"], (old: any[] = []) => {
        const existingMap = new Map(old.map((c) => [c.carpool.id, c]));
        const existing = existingMap.get(carpoolId);

        // Only unread count changed
        if (data.unreadCount !== undefined && !data.lastMessage) {
          if (!existing) return old;
          existingMap.set(carpoolId, {
            ...existing,
            unreadCount: data.unreadCount,
          });
          return Array.from(existingMap.values()).sort(sortFn);
        }

        // New last message
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

      // Update local state
      setConversationTray((old: any[]) => {
        const map = new Map(old.map((c) => [c.carpool.id, c]));
        const existing = map.get(carpoolId);

        if (data.unreadCount !== undefined && !data.lastMessage) {
          if (!existing) return old;
          map.set(carpoolId, { ...existing, unreadCount: data.unreadCount });
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
    };

    // Handle unread counts
    const handleUnreadCountUpdate = (data: any) => {
      console.log("unread counts", data);
      setUnreadCount(data.totalUnread);
      queryClient.setQueryData(
        ["unreadCounts"],
        (old: Record<string, number> = {}) => ({
          ...old,
          totalUnread: data.totalUnread,
        })
      );
    };

    socket.on("connect", handleConnect);
    socket.on("conversationTrayUpdate", handleConversationTrayUpdate);
    socket.on("unreadCountUpdate", handleUnreadCountUpdate);

    return () => {
      socket.off("conversationTrayUpdate", handleConversationTrayUpdate);
      socket.off("unreadCountUpdate", handleUnreadCountUpdate);
    };
  }, [socket, queryClient]);

  return (
    <ConversationContext.Provider
      value={{
        conversationTray,
        loadingConversations,
        updateConversationAfterSend,
        unreadCount,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => useContext(ConversationContext);
