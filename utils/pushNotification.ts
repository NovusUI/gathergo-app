// utils/pushNotifications.ts
import { NOTIFICATION_SOUNDS } from "@/constants/notificationSounds";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const registerForPushNotifications = async (): Promise<
  string | null
> => {
  try {
    if (!Device.isDevice) {
      console.log("Must use physical device for push notifications");
      return null;
    }

    // Android 13 needs a channel before requesting notification permission.
    if (Platform.OS === "android") {
      await Promise.all(
        Object.values(NOTIFICATION_SOUNDS).map(({ channelId, name, sound }) =>
          Notifications.setNotificationChannelAsync(channelId, {
            name,
            sound,
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
          }),
        ),
      );
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      throw new Error("Project ID not found");
    }

    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;

    console.log("✅ Expo push token:", token);
    return token;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
};
