// hooks/useNotifications.ts
import { useNotification } from "@/context/NotificationContext";
import { useSocket } from "@/context/SocketContext";
import { Notification } from "@/types/notification";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type NotificationsListData = {
  pageParams: { before: string | null; beforeId: string | null }[];
  pages: Notification[][];
};

type NotificationsMeta = {
  hasMore: boolean;
  lastUpdatedAt: number;
};

export function useNotifications() {
  const { isConnected } = useSocket();
  const { loadMoreNotifications, getNotificationTray, initialLoading } =
    useNotification();

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const inFlightCursorRef = useRef<string | null>(null);
  const loadingResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const wasConnectedRef = useRef(false);

  const { data: notificationsData } = useQuery<NotificationsListData>({
    queryKey: ["notifications", "list"],
    queryFn: () => ({ pageParams: [], pages: [] }),
    enabled: false,
    staleTime: 1000 * 60 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  const notifications = useMemo(
    () => notificationsData?.pages?.flat() || [],
    [notificationsData]
  );

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["notifications", "unreadCount"],
    queryFn: () => 0,
    enabled: false,
    staleTime: 1000 * 60 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  const { data: notificationMeta = { hasMore: true, lastUpdatedAt: 0 } } =
    useQuery<NotificationsMeta>({
      queryKey: ["notifications", "meta"],
      queryFn: () => ({ hasMore: true, lastUpdatedAt: 0 }),
      enabled: false,
      staleTime: 1000 * 60 * 60 * 2,
      gcTime: 1000 * 60 * 10,
    });

  const hasMore = notificationMeta.hasMore;

  // Join notification room only when connection flips to connected.
  useEffect(() => {
    if (isConnected && !wasConnectedRef.current) {
      console.log("Socket connected, loading notifications");
      getNotificationTray();
    }

    wasConnectedRef.current = isConnected;
  }, [isConnected, getNotificationTray]);

  // Any tray/pagination socket response updates this timestamp in NotificationContext.
  useEffect(() => {
    if (!notificationMeta.lastUpdatedAt) return;

    setIsLoadingMore(false);
    inFlightCursorRef.current = null;

    if (loadingResetTimeoutRef.current) {
      clearTimeout(loadingResetTimeoutRef.current);
      loadingResetTimeoutRef.current = null;
    }
  }, [notificationMeta.lastUpdatedAt]);

  useEffect(() => {
    return () => {
      if (loadingResetTimeoutRef.current) {
        clearTimeout(loadingResetTimeoutRef.current);
      }
    };
  }, []);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || notifications.length === 0) return;

    const oldestNotification = notifications[notifications.length - 1];
    const before = oldestNotification.createdAt;
    const beforeId = oldestNotification.id;
    const cursorKey = `${before}|${beforeId}`;

    if (inFlightCursorRef.current === cursorKey) {
      return;
    }

    inFlightCursorRef.current = cursorKey;
    setIsLoadingMore(true);

    console.log("Loading more notifications before:", before, beforeId);
    loadMoreNotifications(before, beforeId);

    if (loadingResetTimeoutRef.current) {
      clearTimeout(loadingResetTimeoutRef.current);
    }

    // Fallback in case socket response is delayed/missed.
    loadingResetTimeoutRef.current = setTimeout(() => {
      setIsLoadingMore(false);
      inFlightCursorRef.current = null;
      loadingResetTimeoutRef.current = null;
    }, 4000);
  }, [isLoadingMore, hasMore, notifications, loadMoreNotifications]);

  const refresh = useCallback(() => {
    if (!isConnected) return;
    getNotificationTray();
  }, [isConnected, getNotificationTray]);

  return {
    notifications,
    unreadCount,
    loadMore,
    hasMore,
    isLoadingMore,
    refresh,
    loadingInitial: initialLoading,
  };
}
