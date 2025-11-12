// hooks/useChatMessages.ts

import client from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useRef } from "react";

export interface Sender {
  id: string;
  username: string;
}

export interface Message {
  id: string;
  content: string;
  carpoolId: string;
  senderId: string;
  createdAt: string;
  sender: Sender;
  readBy: { id: string }[];
  optimistic?: boolean;
}

export interface PageCursor {
  before: string | null;
  beforeId: string | null;
}

type MessagesInfiniteData = InfiniteData<Message[], PageCursor>;

// hooks/useChatMessages.ts - Updated version

export function useChatMessages(carpoolId: string) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const userId = user?.id;

  const queryClient = useQueryClient();
  const limit = 20;

  // Use a more robust listener tracking
  const listenersRef = useRef<{ [key: string]: boolean }>({});

  const clearCache = () => {
    queryClient.removeQueries({
      queryKey: ["messages", carpoolId],
    });
  };

  const query = useInfiniteQuery<
    Message[],
    Error,
    InfiniteData<Message[]>,
    ["messages", string],
    PageCursor
  >({
    queryKey: ["messages", carpoolId],
    enabled: false,
    queryFn: async ({ pageParam, signal }) => {
      const before = pageParam?.before;
      const beforeId = pageParam?.beforeId;
      const qs: string[] = [];

      if (before) qs.push(`before=${before}`);
      if (beforeId) qs.push(`beforeId=${beforeId}`);
      qs.push(`limit=${limit}`);

      const url = `http://192.168.15.150:4000/api/v1/messages/${carpoolId}?${qs.join(
        "&"
      )}`;

      const res = await client.get(url, { signal });
      if (!res.status) throw new Error("Failed to fetch messages");
      return res.data.data as Promise<Message[]>;
    },

    initialPageParam: { before: null, beforeId: null },
    //staleTime: 1000,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length === 0) return undefined;

      const oldest = lastPage[lastPage.length - 1];
      return {
        before: oldest.createdAt,
        beforeId: oldest.id,
      };
    },
  });

  // Flatten messages for UI - sort by createdAt ascending for inverted FlatList
  const messages =
    query.data?.pages
      ?.flat()
      ?.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ) || [];

  useEffect(() => {
    if (!socket || !userId) return;

    const listenerKey = `chat-${carpoolId}`;

    // Prevent duplicate listeners
    if (listenersRef.current[listenerKey]) {
      return;
    }

    listenersRef.current[listenerKey] = true;

    // Join chat room
    socket.emit("join", { carpoolId, limit });

    // Handle initial chat history
    const handleChatHistory = ({
      messages: incoming,
    }: {
      messages: Message[];
    }) => {
      queryClient.setQueryData<MessagesInfiniteData>(
        ["messages", carpoolId],
        (old) => {
          if (!old) {
            return {
              pageParams: [{ before: null, beforeId: null }],
              pages: [incoming],
            };
          }

          const mergedPages = mergeLatestPage(old.pages, incoming);

          return {
            ...old,
            pages: mergedPages,
          };
        }
      );
    };

    // Handle new messages with proper deduplication
    const handleNewMessage = (msg: Message) => {
      if (msg.carpoolId !== carpoolId) return;

      console.log("handle new message", msg);
      queryClient.setQueryData<MessagesInfiniteData>(
        ["messages", carpoolId],
        (old) => {
          if (!old) {
            return {
              pageParams: [{ before: null, beforeId: null }],
              pages: [[msg]],
            };
          }

          const flatMessages = old.pages.flat();

          // Check if message already exists (by ID or optimistic ID)
          const messageExists = flatMessages.some(
            (m) =>
              m.id === msg.id ||
              (m.optimistic &&
                m.content === msg.content &&
                m.senderId === msg.senderId)
          );

          if (messageExists) {
            // Replace optimistic message with real one
            const updatedMessages = flatMessages.map((m) =>
              m.optimistic &&
              m.content === msg.content &&
              m.senderId === msg.senderId
                ? msg
                : m
            );

            return {
              ...old,
              pages: [updatedMessages],
            };
          }

          // Add new message and remove any optimistic duplicates
          const filteredMessages = flatMessages.filter(
            (m) =>
              !m.optimistic ||
              m.content !== msg.content ||
              m.senderId !== msg.senderId
          );

          return {
            ...old,
            pages: [[...filteredMessages, msg]],
          };
        }
      );
    };

    socket.on("chatHistory", handleChatHistory);
    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.emit("leave", { carpoolId });
      socket.off("chatHistory", handleChatHistory);
      socket.off("newMessage", handleNewMessage);
      listenersRef.current[listenerKey] = false;
    };
  }, [socket, carpoolId, userId, queryClient]);

  const loadMore = () => {
    if (query.isFetchingNextPage || !query.hasNextPage) return;
    query.fetchNextPage();
  };

  return {
    messages,
    loadMore,
    hasMore: query.hasNextPage,
    loadingInitial: !query.data,
    loadingMore: query.isFetchingNextPage,
    clearCache,
  };
}

const mergeLatestPage = (
  cachedPages: Message[][],
  incoming: Message[]
): Message[][] => {
  // ✅ Case 0: No cache at all
  if (cachedPages.length === 0) {
    return [incoming];
  }

  const cachedLatest = cachedPages[0];

  // ✅ Case 1: Perfect match → use cached, do nothing
  if (messagesEqual(cachedLatest, incoming)) {
    return cachedPages;
  }

  // ✅ Case 2: NO OVERLAP → DROP ENTIRE CACHE
  // We cannot trust any of the cached pages.
  if (!hasOverlap(cachedLatest, incoming)) {
    return [incoming];
  }

  // ✅ Case 3: Partial overlap → clean merge without duplication
  const incomingIds = new Set(incoming.map((m) => m.id));

  const mergedLatest = [
    ...incoming,
    ...cachedLatest.filter((m) => !incomingIds.has(m.id)),
  ];

  // ✅ Keep older pages (they remain aligned because overlap exists)
  return [mergedLatest, ...cachedPages.slice(1)];
};

const messagesEqual = (a: Message[], b: Message[]) => {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id) return false;
    if (a[i].content !== b[i].content) return false;
    if (a[i].createdAt !== b[i].createdAt) return false;
  }

  return true;
};
const hasOverlap = (cached: Message[], incoming: Message[]) => {
  const cachedIds = new Set(cached.map((m) => m.id));
  return incoming.some((m) => cachedIds.has(m.id));
};
