// contexts/PushNotificationContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

import { useRegisterPushToken, useRemovePushToken } from "@/services/mutations";
import { useAuthStore } from "@/store/auth";
import { registerForPushNotifications } from "@/utils/pushNotification";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { Platform } from "react-native";

type PushNotificationContextType = {
  expoPushToken: string | null;
  registerPushToken: () => Promise<void>;
  notificationData: any;
  clearNotificationData: () => void;
};

const PushNotificationContext = createContext<PushNotificationContextType>({
  expoPushToken: null,
  registerPushToken: async () => {},
  notificationData: null,
  clearNotificationData: () => {},
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, // Add this for iOS
    shouldShowList: true, // Add this for iOS
  }),
});
export const PushNotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notificationData, setNotificationData] = useState<any>(null);
  const { user } = useAuth();
  const router = useRouter();
  const navigationHandledRef = useRef(false);
  const { token: accessToken } = useAuthStore();

  const { mutateAsync: registerToken } = useRegisterPushToken();
  const { mutateAsync: removeToken } = useRemovePushToken();

  const clearNotificationData = useCallback(() => {
    setNotificationData(null);
    navigationHandledRef.current = false;
  }, []);

  const handleNotificationNavigation = useCallback(
    (data: any) => {
      if (!data?.carpoolId || navigationHandledRef.current) return;

      navigationHandledRef.current = true;
      console.log("🚀 Navigating to chat from notification:", data.carpoolId);

      router.push(`/chat/${data.carpoolId}`);

      setTimeout(() => {
        clearNotificationData();
      }, 1000);
    },
    [router, clearNotificationData]
  );

  const registerPushToken = useCallback(async () => {
    if (!user?.id || !accessToken) return;

    try {
      const token = await registerForPushNotifications();
      if (token) {
        setExpoPushToken(token);
        await registerToken({
          token,
          platform: Platform.OS,
        });
      }
    } catch (error) {
      console.error("Failed to register push token:", error);
    }
  }, [user?.id, accessToken, registerToken]);

  // Setup notification listeners
  useEffect(() => {
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationNavigation(
          response.notification.request.content.data
        );
      });

    return () => {
      Notifications.removeNotificationSubscription(responseSubscription);
    };
  }, [handleNotificationNavigation]);

  // Handle app launch from notification
  useEffect(() => {
    const getInitialNotification = async () => {
      const notification =
        await Notifications.getLastNotificationResponseAsync();
      if (notification) {
        handleNotificationNavigation(
          notification.notification.request.content.data
        );
      }
    };

    getInitialNotification();
  }, [handleNotificationNavigation]);

  // Register push token when user logs in
  useEffect(() => {
    if (user?.id && accessToken) {
      registerPushToken();
    }
  }, [user?.id, accessToken, registerPushToken]);

  return (
    <PushNotificationContext.Provider
      value={{
        expoPushToken,
        registerPushToken,
        notificationData,
        clearNotificationData,
      }}
    >
      {children}
    </PushNotificationContext.Provider>
  );
};

export const usePushNotification = () => useContext(PushNotificationContext);
