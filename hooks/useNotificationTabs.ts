import { Notification } from "@/types/notification";
import { useMemo, useState } from "react";

export type NotificationTab = "unread" | "events" | "carpool";

export function useNotificationTabs(notifications: Notification[]) {
  const [activeTab, setActiveTab] = useState<NotificationTab>("unread");

  // Memoize the filtered notifications per tab
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === "unread") return !n.read;
      if (activeTab === "events") return n.type.startsWith("event_");
      if (activeTab === "carpool") return n.type.startsWith("carpool_");
      return true;
    });
  }, [notifications, activeTab]);

  const { today, older } = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return {
      today: filteredNotifications.filter(
        (n) => new Date(n.createdAt) >= startOfToday
      ),
      older: filteredNotifications.filter(
        (n) => new Date(n.createdAt) < startOfToday
      ),
    };
  }, [filteredNotifications]); // Only depend on filteredNotifications

  return {
    activeTab,
    setActiveTab,
    todayNotifications: today,
    olderNotifications: older,
    filteredNotifications, // Add this for the empty state check
  };
}
