// hooks/useNotifications.ts
import { useNotification } from "@/context/NotificationContext";
import { useSocket } from "@/context/SocketContext";
import { Notification } from "@/types/notification";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

export function useNotifications() {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const { loadMoreNotifications, getNotificationTray } = useNotification();
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastLoadedBefore, setLastLoadedBefore] = useState<{
    before: string | null;
    beforeId: string | null;
  }>({ before: null, beforeId: null });

  // Read notifications directly from cache (set by NotificationContext)
  const notificationsData = queryClient.getQueryData<any>([
    "notifications",
    "list",
  ]);
  const notifications = notificationsData?.pages?.flat() || [];

  // Get unread count from cache
  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["notifications", "unreadCount"],
    queryFn: () => 0,
    enabled: false,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  // Function to join notification room
  const joinNotificationRoom = useCallback(() => {
    if (!socket) return;
    console.log("Joining notification room");
    getNotificationTray();
  }, [socket, getNotificationTray]);

  // Handle loading more
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || notifications.length === 0) return;

    setIsLoadingMore(true);

    // Find the oldest notification for pagination
    const oldestNotification = notifications[notifications.length - 1];
    const before = oldestNotification.createdAt;
    const beforeId = oldestNotification.id;

    console.log("Loading more notifications before:", before, beforeId);
    loadMoreNotifications(before, beforeId);

    // Reset loading after a timeout (socket response will update cache)
    setTimeout(() => setIsLoadingMore(false), 2000);
  }, [isLoadingMore, hasMore, notifications, loadMoreNotifications]);

  const refresh = () => {
    getNotificationTray();
  };

  // Effect for socket event listeners and connection management
  useEffect(() => {
    if (!socket) return;

    // Listen for notifications response to update hasMore state
    const handleNotifications = (response: {
      notifications: Notification[];
      hasMore: boolean;
    }) => {
      console.log(
        "Received notifications, hasMore:",
        response.notifications.length
      );
      setHasMore(response.hasMore);
      setIsLoadingMore(false);
    };

    // Listen for notification tray to reset hasMore
    const handleNotificationTray = (tray: {
      notifications: Notification[];
      totalUnread: number;
      hasMore: boolean;
    }) => {
      setHasMore(tray.hasMore);
    };

    // Handle connection events
    const handleConnect = () => {
      console.log("Socket connected, loading notifications");
      joinNotificationRoom();
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");
    };

    // Set up event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("notifications", handleNotifications);
    socket.on("notificationTray", handleNotificationTray);

    // Join notification room initially if connected
    if (isConnected) {
      joinNotificationRoom();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("notifications", handleNotifications);
      socket.off("notificationTray", handleNotificationTray);
    };
  }, [socket, isConnected, joinNotificationRoom]);

  return {
    // All notifications
    notifications,

    // Unread count for badge
    unreadCount,

    // Pagination
    loadMore,
    hasMore,
    isLoadingMore,

    // Refresh
    refresh,

    // Loading state (initial)
    loadingInitial: notifications.length === 0 && isConnected,
  };
}
