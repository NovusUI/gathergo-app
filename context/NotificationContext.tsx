// contexts/NotificationContext.tsx
import { useSocket } from "@/context/SocketContext";
import { Notification } from "@/types/notification";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect } from "react";

interface NotificationContextType {
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  loadMoreNotifications: (before?: string, beforeId?: string) => void;
  getNotificationTray: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  markAsRead: () => {},
  markAllAsRead: () => {},
  loadMoreNotifications: () => {},
  getNotificationTray: () => {},
});

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // Mark notification as read
  const markAsRead = useCallback(
    (notificationId: string) => {
      if (!socket) return;
      socket.emit("markAsRead", { notificationId });
    },
    [socket]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    if (!socket) return;
    socket.emit("markAllAsRead");
  }, [socket]);

  // Load more notifications
  const loadMoreNotifications = useCallback(
    (before?: string, beforeId?: string) => {
      if (!socket) return;
      socket.emit("loadMoreNotifications", { before, beforeId, limit: 20 });
    },
    [socket]
  );

  // Get notification tray (first page)
  const getNotificationTray = useCallback(() => {
    if (!socket) return;
    socket.emit("getNotificationTray", {});
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    // Get initial notification state when socket connects
    const handleConnect = () => {
      console.log("✅ Socket connected, loading notifications");
      //socket.emit("getNotificationTray", {});
    };

    // Handle notification tray
    const handleNotificationTray = (tray: {
      notifications: Notification[];
      totalUnread: number;
      hasMore: boolean;
    }) => {
      console.log(
        "📦 Received notification tray:",
        tray.notifications.length,
        "notifications"
      );

      queryClient.setQueryData(["notifications", "list"], (old: any) => {
        // Always replace with fresh data for the first page
        return {
          pageParams: [{ before: null, beforeId: null }],
          pages: [tray.notifications],
        };
      });

      // Set unread count separately
      queryClient.setQueryData(
        ["notifications", "unreadCount"],
        tray.totalUnread
      );
    };

    // Handle new notification in real-time
    const handleNewNotification = (newNotification: {
      data: Notification;
      notificationType: string;
    }) => {
      console.log("🆕 New notification received:", {
        ...newNotification.data,
        type: newNotification.notificationType,
      });
      const notification = {
        ...newNotification.data,
        type: newNotification.notificationType,
      };
      queryClient.setQueryData(["notifications", "list"], (old: any) => {
        if (!old || !old.pages || old.pages.length === 0) {
          return {
            pageParams: [{ before: null, beforeId: null }],
            pages: [[notification]],
          };
        }

        // Prepend to the first page (most recent notifications)
        const updatedFirstPage = [notification, ...old.pages[0]];

        // Keep the rest of the pages as-is
        return {
          ...old,
          pages: [updatedFirstPage, ...old.pages.slice(1)],
        };
      });

      // Increment unread count
      queryClient.setQueryData(
        ["notifications", "unreadCount"],
        (old: number | undefined) => (old || 0) + 1
      );
    };

    // In NotificationContext.tsx, update the handleNotifications function:

    // Handle loaded notifications (for pagination)
    const handleNotifications = (response: {
      notifications: Notification[];
      hasMore: boolean;
    }) => {
      console.log(
        "📄 Received notifications for pagination:",
        response.notifications.length,
        "notifications, hasMore:",
        response.hasMore
      );

      queryClient.setQueryData(["notifications", "list"], (old: any) => {
        if (!old || !old.pages || old.pages.length === 0) {
          return {
            pageParams: [{ before: null, beforeId: null }],
            pages: [response.notifications],
          };
        }

        // Check if we already have these notifications (refresh vs pagination)
        const existingIds = new Set(
          old.pages.flat().map((n: Notification) => n.id)
        );
        const newNotifications = response.notifications.filter(
          (n) => !existingIds.has(n.id)
        );

        if (newNotifications.length === 0) {
          console.log("📄 No new notifications to add");
          return old; // No change
        }

        // Append as a new page for pagination
        console.log(
          "📄 Appending",
          newNotifications.length,
          "new notifications as new page"
        );

        return {
          ...old,
          pages: [...old.pages, newNotifications],
          pageParams: [
            ...old.pageParams,
            {
              before: newNotifications[newNotifications.length - 1]?.createdAt,
              beforeId: newNotifications[newNotifications.length - 1]?.id,
            },
          ],
        };
      });
    };

    // Handle notification marked as read
    const handleNotificationRead = (updatedNotification: Notification) => {
      console.log("✅ Notification marked as read:", updatedNotification.id);

      // Update in notifications list - similar to message read status updates
      queryClient.setQueryData(["notifications", "list"], (old: any) => {
        if (!old) return old;

        const flatNotifications = old.pages.flat();

        // Update the specific notification
        const updatedNotifications = flatNotifications.map(
          (item: Notification) =>
            item.id === updatedNotification.id ? { ...item, read: true } : item
        );

        return {
          ...old,
          pages: [updatedNotifications],
        };
      });

      // Decrement unread count
      queryClient.setQueryData(
        ["notifications", "unreadCount"],
        (old: number | undefined) => Math.max(0, (old || 1) - 1)
      );
    };

    // Handle all notifications read
    const handleAllNotificationsRead = () => {
      console.log("✅ All notifications marked as read");

      // Update all notifications to read
      queryClient.setQueryData(["notifications", "list"], (old: any) => {
        if (!old) return old;

        const flatNotifications = old.pages.flat();
        const updatedNotifications = flatNotifications.map(
          (item: Notification) => ({
            ...item,
            read: true,
          })
        );

        return {
          ...old,
          pages: [updatedNotifications],
        };
      });

      // Reset unread count to 0
      queryClient.setQueryData(["notifications", "unreadCount"], 0);
    };

    // Handle unread count updates
    const handleUnreadCount = (count: number) => {
      console.log("🔔 Unread count updated:", count);
      queryClient.setQueryData(["notifications", "unreadCount"], count);
    };

    // Set up event listeners
    socket.on("connect", handleConnect);
    socket.on("notificationTray", handleNotificationTray);
    socket.on("notificationRead", handleNotificationRead);
    socket.on("allNotificationsRead", handleAllNotificationsRead);
    socket.on("notifications", handleNotifications);
    socket.on("unreadCount", handleUnreadCount);
    socket.on("newNotification", handleNewNotification);

    // If already connected, load notifications immediately
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("notificationTray", handleNotificationTray);
      socket.off("notificationRead", handleNotificationRead);
      socket.off("allNotificationsRead", handleAllNotificationsRead);
      socket.off("notifications", handleNotifications);
      socket.off("unreadCount", handleUnreadCount);
      socket.off("newNotification", handleNewNotification);
    };
  }, [socket, queryClient]);

  return (
    <NotificationContext.Provider
      value={{
        markAsRead,
        markAllAsRead,
        loadMoreNotifications,
        getNotificationTray,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);

// EXACT SAME HELPER FUNCTIONS AS useChatMessages
const mergeLatestPage = (
  cachedPages: Notification[][],
  incoming: Notification[]
): Notification[][] => {
  if (cachedPages.length === 0) {
    return [incoming];
  }

  const cachedLatest = cachedPages[0];

  if (notificationsEqual(cachedLatest, incoming)) {
    return cachedPages;
  }

  if (!hasOverlap(cachedLatest, incoming)) {
    return [incoming];
  }

  const incomingIds = new Set(incoming.map((n) => n.id));
  const mergedLatest = [
    ...incoming,
    ...cachedLatest.filter((n) => !incomingIds.has(n.id)),
  ];

  return [mergedLatest, ...cachedPages.slice(1)];
};

const notificationsEqual = (a: Notification[], b: Notification[]) => {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id) return false;
    if (a[i].title !== b[i].title) return false;
    if (a[i].createdAt !== b[i].createdAt) return false;
  }

  return true;
};

const hasOverlap = (cached: Notification[], incoming: Notification[]) => {
  const cachedIds = new Set(cached.map((n) => n.id));
  return incoming.some((n) => cachedIds.has(n.id));
};
