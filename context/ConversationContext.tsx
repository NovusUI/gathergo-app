import { useConversations } from "@/hooks/useSocketReactHook";
import type { Message } from "@/types/chat";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useSocket } from "./SocketContext";

type ConversationContextType = {
  conversationTray: any[];
  loadingConversations: boolean;
  updateConversationAfterSend: (
    carpoolId: string,
    message: Pick<Message, "content" | "createdAt">,
  ) => void;
  unreadCount: number;
};

const ConversationContext = createContext<ConversationContextType>({
  conversationTray: [],
  loadingConversations: true,
  updateConversationAfterSend: () => {},
  unreadCount: 0,
});

const sortFn = (a: any, b: any) => {
  const aDate = new Date(a.lastMessageAt || a.carpool?.createdAt || 0).getTime();
  const bDate = new Date(b.lastMessageAt || b.carpool?.createdAt || 0).getTime();
  return bDate - aDate;
};

export const ConversationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data: conversationTray = [], isPending: loadingConversations } = useConversations();
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const requestTray = useCallback(() => {
    socket?.emit("getConversationTray", {});
  }, [socket]);

  const updatePreview = useCallback(
    (
      carpoolId: string,
      patch: { lastMessage?: string; lastMessageAt?: string; unreadCount: number },
    ) => {
      const current = queryClient.getQueryData<any[]>(["conversations"]);
      // Partial socket updates lack the carpool. Fetch the full tray for unknown
      // conversations or incomplete rows left in the persisted client cache.
      if (
        !current ||
        current.some(item => !item.carpool) ||
        !current.some(item => item.carpool.id === carpoolId)
      ) {
        requestTray();
        return;
      }
      queryClient.setQueryData(
        ["conversations"],
        current.map(item =>
          item.carpool.id === carpoolId ? { ...item, ...patch } : item,
        ).sort(sortFn),
      );
    },
    [queryClient, requestTray],
  );

  const updateConversationAfterSend = (
    carpoolId: string,
    message: Pick<Message, "content" | "createdAt">,
  ) => {
    updatePreview(carpoolId, {
      lastMessage: message.content,
      lastMessageAt: message.createdAt,
      unreadCount: 0,
    });
  };

  useEffect(() => {
    if (!socket) return;
    const handleConversationTrayUpdate = (data: any) => {
      // The server emits either a full tray or an update for a single carpool.
      if (Array.isArray(data)) {
        queryClient.setQueryData(["conversations"], [...data].sort(sortFn));
        return;
      }
      updatePreview(data.carpoolId, {
        unreadCount: data.unreadCount,
        ...(data.lastMessage ? {
          lastMessage: data.lastMessage.content,
          lastMessageAt: data.lastMessage.createdAt,
        } : {}),
      });
    };
    const handleUnreadCountUpdate = (data: any) => {
      setUnreadCount(data.totalUnread);
      queryClient.setQueryData(
        ["unreadCounts"],
        (old: Record<string, number> = {}) => ({
          ...old,
          totalUnread: data.totalUnread,
        }),
      );
    };

    socket.on("connect", requestTray);
    socket.on("conversationTrayRefresh", requestTray);
    socket.on("conversationTrayUpdate", handleConversationTrayUpdate);
    socket.on("unreadCountUpdate", handleUnreadCountUpdate);
    if (socket.connected) requestTray();

    return () => {
      socket.off("connect", requestTray);
      socket.off("conversationTrayRefresh", requestTray);
      socket.off("conversationTrayUpdate", handleConversationTrayUpdate);
      socket.off("unreadCountUpdate", handleUnreadCountUpdate);
    };
  }, [socket, queryClient, requestTray, updatePreview]);

  return (
    <ConversationContext.Provider
      value={{ conversationTray, loadingConversations, updateConversationAfterSend, unreadCount }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => useContext(ConversationContext);
