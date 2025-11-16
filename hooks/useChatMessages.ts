// hooks/useChatMessages.ts

import client from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";

export interface Sender {
  id: string;
  username: string;
}

export interface Message {
  id: string;
  tempId?: string;
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

export function useChatMessages(carpoolId: string) {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const userId = user?.id;

  const queryClient = useQueryClient();
  const limit = 20;

  // Use a more robust listener tracking
  const listenersRef = useRef<{ [key: string]: boolean }>({});
  const joinedRoomsRef = useRef<Set<string>>(new Set());

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

      const url = `http://192.168.174.53:4000/api/v1/messages/${carpoolId}?${qs.join(
        "&"
      )}`;

      const res = await client.get(url, { signal });
      if (!res.status) throw new Error("Failed to fetch messages");
      return res.data.data as Promise<Message[]>;
    },

    initialPageParam: { before: null, beforeId: null },
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

  // Function to join the chat room
  const joinChatRoom = useCallback(() => {
    if (!socket || !userId || !carpoolId) return;

    const listenerKey = `chat-${carpoolId}`;

    if (listenersRef.current[listenerKey]) {
      return;
    }

    listenersRef.current[listenerKey] = true;
    joinedRoomsRef.current.add(carpoolId);

    // Join chat room and mark as read
    socket.emit("join", { carpoolId, limit });
  }, [socket, userId, carpoolId, limit]);

  // Function to leave the chat room
  const leaveChatRoom = () => {
    if (!socket || !carpoolId) return;

    const listenerKey = `chat-${carpoolId}`;

    socket.emit("leave", { carpoolId });
    listenersRef.current[listenerKey] = false;
    joinedRoomsRef.current.delete(carpoolId);
  };

  // Effect for socket event listeners and connection management
  useEffect(() => {
    if (!socket || !userId) return;

    const listenerKey = `chat-${carpoolId}`;

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
            (m) => m.optimistic && m.id === msg.tempId
          );

          if (messageExists) {
            // Replace optimistic message with real one
            const updatedMessages = flatMessages.map((m) =>
              m.optimistic && m.id === msg.tempId ? msg : m
            );

            return {
              ...old,
              pages: [updatedMessages],
            };
          }

          // Add new message and remove any optimistic duplicates
          const filteredMessages = flatMessages.filter(
            (m) => !m.optimistic || m.id !== msg.tempId
          );

          return {
            ...old,
            pages: [[...filteredMessages, msg]],
          };
        }
      );
    };

    // Handle connection events
    const handleConnect = () => {
      console.log("Socket connected, rejoining room:", carpoolId);
      // Rejoin all rooms that we were previously in
      joinedRoomsRef.current.forEach((roomId) => {
        socket.emit("join", { carpoolId: roomId, limit });
      });
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");
    };

    // Set up event listeners
    socket.on("chatHistory", handleChatHistory);
    socket.on("newMessage", handleNewMessage);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Join the room initially if connected
    if (isConnected) {
      joinChatRoom();
    }

    return () => {
      leaveChatRoom();
      socket.off("chatHistory", handleChatHistory);
      socket.off("newMessage", handleNewMessage);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket, carpoolId, userId, queryClient, isConnected]);

  // Effect to handle connection status changes
  useEffect(() => {
    if (!socket) return;

    if (isConnected) {
      // Rejoin room when connection is restored
      if (joinedRoomsRef.current.has(carpoolId)) {
        console.log("Connection restored, rejoining room:", carpoolId);
        joinChatRoom();
      }
    } else {
      // Connection lost - we'll rejoin automatically when connection is restored
      console.log("Connection lost, will rejoin when restored");
    }
  }, [isConnected, socket, carpoolId]);

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
  if (cachedPages.length === 0) {
    return [incoming];
  }

  const cachedLatest = cachedPages[0];

  if (messagesEqual(cachedLatest, incoming)) {
    return cachedPages;
  }

  if (!hasOverlap(cachedLatest, incoming)) {
    return [incoming];
  }

  const incomingIds = new Set(incoming.map((m) => m.id));
  const incomingTempId = new Set(incoming.map((m) => m.tempId));
  const mergedLatest = [
    ...incoming,
    ...cachedLatest.filter(
      (m) => !incomingIds.has(m.id) && !incomingTempId.has(m.id)
    ),
  ];

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
