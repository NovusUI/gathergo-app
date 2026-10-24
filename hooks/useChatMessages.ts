import client from "@/api/client";
import { API_BASE_URL } from "@/constants/network";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { pendingMessage, useMessageQueueStore } from "@/store/messageQueue";
import type { Message, MessagesInfiniteData, PageCursor } from "@/types/chat";
import { mergeMessagePages, uniqueMessages } from "@/utils/chatMessages";
import { showGlobalError } from "@/utils/globalErrorHandler";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export type { Message, Sender, PageCursor } from "@/types/chat";

export function useChatMessages(carpoolId: string) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const userId = user?.id;
  const queue = useMessageQueueStore((state) => state.queue);
  const queryClient = useQueryClient();
  const limit = 20;
  const query = useInfiniteQuery<
    Message[],
    Error,
    MessagesInfiniteData,
    ["messages", string],
    PageCursor
  >({
    queryKey: ["messages", carpoolId],
    enabled: false,
    queryFn: async ({ pageParam, signal }) => {
      const params = [`limit=${limit}`];
      if (pageParam.before)
        params.push(`before=${encodeURIComponent(pageParam.before)}`);
      if (pageParam.beforeId)
        params.push(`beforeId=${encodeURIComponent(pageParam.beforeId)}`);
      const response = await client.get<{ data: Message[] }>(
        `${API_BASE_URL}/messages/${carpoolId}?${params.join("&")}`,
        { signal },
      );
      return response.data.data;
    },
    initialPageParam: { before: null, beforeId: null },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length === 0) return undefined;
      const sorted = uniqueMessages(
        allPages.flat().filter((message) => !message.optimistic),
      );
      if (sorted.length === 0) return undefined;
      const oldest = sorted[sorted.length - 1];
      return { before: oldest.createdAt, beforeId: oldest.id };
    },
  });

  useEffect(() => {
    if (!socket || !userId || !carpoolId) return;
    const join = () => socket.emit("join", { carpoolId, limit });
    const history = (data: { carpoolId: string; messages: Message[] }) => {
      if (data.carpoolId !== carpoolId) return;
      queryClient.setQueryData<MessagesInfiniteData>(
        ["messages", carpoolId],
        (old) => mergeMessagePages(old, data.messages),
      );
      void useMessageQueueStore
        .getState()
        .confirmMessages(data.messages)
        .catch((error) => {
          console.error("Could not save chat history receipts", error);
          showGlobalError(
            "Couldn't save message receipts. They will be checked again.",
          );
        });
    };
    socket.on("chatHistory", history);
    socket.on("connect", join);
    if (socket.connected) join();
    return () => {
      socket.off("chatHistory", history);
      socket.off("connect", join);
      if (socket.connected) socket.emit("leave", { carpoolId });
    };
  }, [socket, userId, carpoolId, queryClient]);

  const confirmed = query.data
    ? query.data.pages.flat().filter((message) => !message.optimistic)
    : [];
  const pending = queue
    .filter(
      (message) =>
        message.senderId === userId && message.carpoolId === carpoolId,
    )
    .map(pendingMessage);
  const messages = uniqueMessages([...confirmed, ...pending]);
  return {
    messages,
    loadMore: () => {
      if (!query.isFetchingNextPage && query.hasNextPage)
        void query.fetchNextPage();
    },
    hasMore: query.hasNextPage,
    loadingInitial: !query.data && messages.length === 0,
    loadingMore: query.isFetchingNextPage,
    clearCache: () =>
      queryClient.removeQueries({ queryKey: ["messages", carpoolId] }),
  };
}
