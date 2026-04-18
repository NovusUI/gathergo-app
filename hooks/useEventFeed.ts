// hooks/useEventFeed.ts
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useCallback, useEffect, useRef, useState } from "react";

export interface FeedItem {
  id: string;
  eventId: string;
  type: string;
  title: string;
  content?: string | null;
  userId?: string | null;
  metadata: any;
  actions: any[];
  isPinned: boolean;
  pinOrder: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string | null;
    profilePicUrlTN: string | null;
  } | null;
  event: {
    id: string;
    title: string | null;
    imageUrl: string | null;
  };
  isPinnedForUser?: boolean;
}

export function useEventFeed(eventId: string) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const limit = 20;

  // State
  const [pinnedFeeds, setPinnedFeeds] = useState<FeedItem[]>([]);
  const [regularFeeds, setRegularFeeds] = useState<FeedItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Refs
  const lastCursorRef = useRef<string | undefined>(undefined);
  const listenersSetRef = useRef(false);
  const isFeedVisibleRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const unseenFeedIdsRef = useRef<Set<string>>(new Set());
  const pinnedFeedsRef = useRef<FeedItem[]>([]);
  const regularFeedsRef = useRef<FeedItem[]>([]);

  useEffect(() => {
    isLoadingMoreRef.current = loadingMore;
  }, [loadingMore]);

  useEffect(() => {
    pinnedFeedsRef.current = pinnedFeeds;
  }, [pinnedFeeds]);

  useEffect(() => {
    regularFeedsRef.current = regularFeeds;
  }, [regularFeeds]);

  // Setup socket listeners
  const setupSocketListeners = useCallback(() => {
    if (!socket?.connected || listenersSetRef.current) return;
    const getFeedTimestamp = (feed: FeedItem) =>
      new Date(feed.updatedAt || feed.createdAt).getTime();
    const sortPinnedFeeds = (feeds: FeedItem[]) =>
      [...feeds].sort((a, b) => {
        if (a.pinOrder !== b.pinOrder) return a.pinOrder - b.pinOrder;
        return getFeedTimestamp(b) - getFeedTimestamp(a);
      });
    const sortRegularFeeds = (feeds: FeedItem[]) =>
      [...feeds].sort((a, b) => getFeedTimestamp(b) - getFeedTimestamp(a));
    const markUnreadIfHidden = (feedId: string) => {
      if (isFeedVisibleRef.current) return;
      const unseen = unseenFeedIdsRef.current;
      if (!unseen.has(feedId)) {
        unseen.add(feedId);
        setUnreadCount(unseen.size);
      }
    };
    const removeUnread = (feedId: string) => {
      const unseen = unseenFeedIdsRef.current;
      if (unseen.delete(feedId)) {
        setUnreadCount(unseen.size);
      }
    };
    const upsertPinnedFeed = (feed: FeedItem) => {
      const isKnownFeed =
        pinnedFeedsRef.current.some((item) => item.id === feed.id) ||
        regularFeedsRef.current.some((item) => item.id === feed.id);
      setPinnedFeeds((prev) => {
        const index = prev.findIndex((item) => item.id === feed.id);
        if (index >= 0) {
          const existing = prev[index];
          if (getFeedTimestamp(existing) > getFeedTimestamp(feed)) {
            return prev;
          }
          const updated = [...prev];
          updated[index] = feed;
          return sortPinnedFeeds(updated);
        }
        return sortPinnedFeeds([feed, ...prev]);
      });
      setRegularFeeds((prev) => prev.filter((item) => item.id !== feed.id));
      if (!isKnownFeed) {
        markUnreadIfHidden(feed.id);
      }
    };
    const upsertRegularFeed = (feed: FeedItem) => {
      const isKnownFeed =
        regularFeedsRef.current.some((item) => item.id === feed.id) ||
        pinnedFeedsRef.current.some((item) => item.id === feed.id);
      setRegularFeeds((prev) => {
        const index = prev.findIndex((item) => item.id === feed.id);
        if (index >= 0) {
          const existing = prev[index];
          if (getFeedTimestamp(existing) > getFeedTimestamp(feed)) {
            return prev;
          }
          const updated = [...prev];
          updated[index] = feed;
          return sortRegularFeeds(updated);
        }
        return sortRegularFeeds([feed, ...prev]);
      });
      if (!isKnownFeed) {
        markUnreadIfHidden(feed.id);
      }
    };
    const extractFeed = (payload: any): FeedItem | null => {
      if (!payload) return null;
      if (payload.feed) return payload.feed as FeedItem;
      return payload as FeedItem;
    };

    const handleFeedHistory = (data: {
      eventId: string;
      feeds: FeedItem[];
      hasMore: boolean;
    }) => {
      console.log("📨 Received feed history:", data.feeds.length, "items");

      if (data.eventId !== eventId) return;

      // Separate pinned and regular feeds
      const pinned = data.feeds.filter((feed) => feed.isPinned);
      const regular = data.feeds.filter((feed) => !feed.isPinned);

      console.log(`📌 Pinned: ${pinned.length}, 📝 Regular: ${regular.length}`);

      if (isLoadingMoreRef.current) {
        setPinnedFeeds((prev) => {
          const seen = new Set(prev.map((item) => item.id));
          return sortPinnedFeeds([
            ...prev,
            ...pinned.filter((item) => !seen.has(item.id)),
          ]);
        });
        setRegularFeeds((prev) => {
          const seen = new Set(prev.map((item) => item.id));
          return sortRegularFeeds([
            ...prev,
            ...regular.filter((item) => !seen.has(item.id)),
          ]);
        });
      } else {
        setPinnedFeeds(sortPinnedFeeds(pinned));
        setRegularFeeds(sortRegularFeeds(regular));
      }

      setHasMore(data.hasMore);
      setLoading(false);
      setLoadingMore(false);
      setError(null);

      // Update last cursor
      if (regular.length > 0) {
        lastCursorRef.current = regular[regular.length - 1].id;
      }
    };

    const handleNewFeed = (payload: any) => {
      const feed = extractFeed(payload);
      if (!feed) return;
      console.log("🆕 New feed received:", feed.type);

      if (feed.eventId !== eventId) return;

      if (feed.isPinned) {
        upsertPinnedFeed(feed);
      } else {
        upsertRegularFeed(feed);
      }
    };

    const handlePinnedFeedUpdate = (payload: any) => {
      const feed = extractFeed(payload);
      if (!feed) return;
      console.log("📍 Pinned feed update:", feed.id);

      if (feed.eventId !== eventId) return;
      upsertPinnedFeed(feed);
    };

    const handleFeedHidden = (result: { success: boolean; feedId: string }) => {
      console.log("🙈 Feed hidden:", result.feedId);

      // Remove hidden feed from both lists
      let removedCount = 0;
      setPinnedFeeds((prev) =>
        prev.filter((feed) => {
          const keep = feed.id !== result.feedId;
          if (!keep) removedCount += 1;
          return keep;
        })
      );
      setRegularFeeds((prev) =>
        prev.filter((feed) => {
          const keep = feed.id !== result.feedId;
          if (!keep) removedCount += 1;
          return keep;
        })
      );
      if (removedCount > 0) {
        removeUnread(result.feedId);
      }
    };

    const handleFeedDeleted = (payload: {
      feedId?: string | null;
      feed?: { id?: string };
    }) => {
      const feedId = payload?.feedId || payload?.feed?.id;
      if (!feedId) return;

      setPinnedFeeds((prev) => prev.filter((feed) => feed.id !== feedId));
      setRegularFeeds((prev) => prev.filter((feed) => feed.id !== feedId));
      removeUnread(feedId);
    };

    const handlePinnedFeeds = (feeds: FeedItem[]) => {
      console.log("📌 Received pinned feeds:", feeds.length);
      // This could be used if you need to show pinned feeds separately
    };

    const handleFrenzyHistory = (data: {
      eventId: string;
      frenzies: FeedItem[];
      hasMore: boolean;
    }) => {
      console.log("🎯 Frenzy history:", data.frenzies.length);
      if (data.eventId !== eventId || data.frenzies.length === 0) return;

      setPinnedFeeds((prev) => {
        const byId = new Map(prev.map((item) => [item.id, item]));
        for (const frenzy of data.frenzies.filter((feed) => feed.isPinned)) {
          const existing = byId.get(frenzy.id);
          if (!existing || getFeedTimestamp(existing) <= getFeedTimestamp(frenzy)) {
            byId.set(frenzy.id, frenzy);
          }
        }
        return sortPinnedFeeds(Array.from(byId.values()));
      });

      setRegularFeeds((prev) => {
        const byId = new Map(prev.map((item) => [item.id, item]));
        for (const frenzy of data.frenzies.filter((feed) => !feed.isPinned)) {
          const existing = byId.get(frenzy.id);
          if (!existing || getFeedTimestamp(existing) <= getFeedTimestamp(frenzy)) {
            byId.set(frenzy.id, frenzy);
          }
        }
        return sortRegularFeeds(Array.from(byId.values()));
      });
    };

    const handleError = (errorData: { message: string }) => {
      console.error("❌ Feed error:", errorData.message);
      setError(errorData.message);
      setLoading(false);
      setLoadingMore(false);
    };

    // Set up listeners
    socket.on("feedHistory", handleFeedHistory);
    socket.on("newFeed", handleNewFeed);
    socket.on("pinnedFeedUpdate", handlePinnedFeedUpdate);
    socket.on("feedHidden", handleFeedHidden);
    socket.on("pinnedFeeds", handlePinnedFeeds);
    socket.on("frenzyHistory", handleFrenzyHistory);
    socket.on("feedDeleted", handleFeedDeleted);
    socket.on("error", handleError);

    listenersSetRef.current = true;

    return () => {
      socket.off("feedHistory", handleFeedHistory);
      socket.off("newFeed", handleNewFeed);
      socket.off("pinnedFeedUpdate", handlePinnedFeedUpdate);
      socket.off("feedHidden", handleFeedHidden);
      socket.off("pinnedFeeds", handlePinnedFeeds);
      socket.off("frenzyHistory", handleFrenzyHistory);
      socket.off("feedDeleted", handleFeedDeleted);
      socket.off("error", handleError);
      listenersSetRef.current = false;
    };
  }, [socket?.connected, eventId]);

  // Join event feed
  const joinEventFeed = useCallback(() => {
    console.log(isJoined, socket?.connected);
    if (socket && socket.connected && !isJoined) {
      console.log("🎟️ Joining event feed:", eventId);
      setLoading(true);

      socket.emit("joinEventFeed", {
        eventId,
        limit,
        userId: user?.id, // Optional: send userId if available
      });

      setIsJoined(true);
    }
  }, [socket, eventId, limit, user?.id, isJoined]);

  // Leave event feed
  const leaveEventFeed = useCallback(() => {
    if (!socket || !socket.connected || !isJoined) return;

    console.log("👋 Leaving event feed:", eventId);
    socket.emit("leaveEventFeed", { eventId });
    setIsJoined(false);

    // Clear state
    setPinnedFeeds([]);
    setRegularFeeds([]);
    setHasMore(true);
    setLoading(false);
    setLoadingMore(false);
    lastCursorRef.current = undefined;
    unseenFeedIdsRef.current.clear();
    setUnreadCount(0);
  }, [socket, eventId, isJoined]);

  // Load more feeds
  const loadMoreFeeds = useCallback(() => {
    if (!socket || !socket.connected || !hasMore || loadingMore || !isJoined) {
      console.log("Cannot load more:", {
        hasSocket: !!socket,

        hasMore,
        loadingMore,
        isJoined,
      });
      return;
    }

    console.log("⬇️ Loading more feeds, cursor:", lastCursorRef.current);
    setLoadingMore(true);

    socket.emit("loadMoreFeeds", {
      eventId,
      cursor: lastCursorRef.current,
      limit,
    });
  }, [socket, eventId, hasMore, loadingMore, isJoined, limit]);

  // Hide a feed
  const hideFeed = useCallback(
    (feedId: string) => {
      if (!socket || !socket.connected) return;

      console.log("🙈 Hiding feed:", feedId);
      socket.emit("hideFeed", { feedId });
    },
    [socket]
  );

  // Get pinned feeds
  const getPinnedFeeds = useCallback(() => {
    if (!socket || !socket.connected) return;

    socket.emit("getPinnedFeeds");
  }, [socket]);

  // Subscribe to pinned updates
  const subscribeToPinnedUpdates = useCallback(() => {
    if (!socket || !socket.connected) return;

    socket.emit("subscribeToPinnedUpdates");
  }, [socket]);

  // Get frenzy history
  const getFrenzyHistory = useCallback(
    (cursor?: string, frenzyLimit: number = 10) => {
      if (!socket || !socket.connected) return;

      socket.emit("getFrenzyHistory", {
        eventId,
        limit: frenzyLimit,
        cursor,
      });
    },
    [socket, eventId]
  );

  // Main effect for setup and cleanup
  useEffect(() => {
    if (!socket) {
      console.log("🚫 No socket available");
      return;
    }

    console.log("🔧 Setting up feed for event:", eventId);

    // Setup listeners
    const cleanupListeners = setupSocketListeners();

    // Handle socket connection events
    const handleConnect = () => {
      console.log("🔌 Socket connected, joining feed if needed");
      if (!isJoined) {
        joinEventFeed();
      }
    };

    socket.on("connect", handleConnect);

    // Join feed if socket is already connected
    if (!isJoined) {
      joinEventFeed();
    }

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up feed for event:", eventId);

      // Remove listeners
      cleanupListeners?.();
      socket.off("connect", handleConnect);

      // Leave feed
      if (isJoined) {
        leaveEventFeed();
      }
    };
  }, [
    socket?.connected,
    eventId,
    isJoined,
    joinEventFeed,
    leaveEventFeed,
    setupSocketListeners,
  ]);

  // All feeds combined (pinned first, then regular)
  const allFeeds = [...pinnedFeeds, ...regularFeeds];

  const markAllAsSeen = useCallback(() => {
    unseenFeedIdsRef.current.clear();
    setUnreadCount(0);
  }, []);

  const setFeedVisibility = useCallback((visible: boolean) => {
    isFeedVisibleRef.current = visible;
    if (visible) {
      unseenFeedIdsRef.current.clear();
      setUnreadCount(0);
    }
  }, []);

  return {
    // State
    pinnedFeeds,
    regularFeeds,
    allFeeds,
    hasMore,
    loading,
    loadingMore,
    error,
    isJoined,

    // Actions
    joinEventFeed,
    leaveEventFeed,
    loadMore: loadMoreFeeds,
    hideFeed,
    getPinnedFeeds,
    subscribeToPinnedUpdates,
    getFrenzyHistory,
    markAllAsSeen,
    setFeedVisibility,
    getFeedStats: () => ({
      pinnedCount: pinnedFeeds.length,
      regularCount: regularFeeds.length,
      totalCount: unreadCount,
      hasUnread: unreadCount > 0,
    }),

    // Utilities
    refresh: () => {
      leaveEventFeed();
      setTimeout(() => joinEventFeed(), 100);
    },
  };
}
