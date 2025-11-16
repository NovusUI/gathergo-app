// components/NotificationHandler.tsx

import { useSocket } from "@/context/SocketContext";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

export const NotificationHandler = () => {
  const { notificationData, clearNotificationData } = useSocket();
  const navigation = useRouter();
  const notificationHandled = useRef(false);

  useEffect(() => {
    if (notificationData?.carpoolId && !notificationHandled.current) {
      notificationHandled.current = true;

      console.log(
        "🚀 Navigating to chat from notification:",
        notificationData.carpoolId
      );

      // Navigate to chat screen
      // @ts-ignore - navigation type might vary
      navigation.replace(`/chat/${notificationData.carpoolId}`);

      // Clear notification data after navigation
      setTimeout(() => {
        clearNotificationData();
        notificationHandled.current = false;
      }, 2000);
    }
  }, [notificationData, navigation, clearNotificationData]);

  return null;
};
