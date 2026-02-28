// components/NotificationItem.tsx
import { spacing } from "@/constants/spacing";
import { formatShortDate } from "@/utils/dateTimeHandler";
import { Image } from "expo-image";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

interface NotificationItemProps {
  notification: {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    read: boolean;
    type: string;
    imageUrl?: string;
    link?: string;
  };
  onPress: () => void;
  onMarkAsRead: (id: string) => void;
}

export const NotificationItem = ({
  notification,
  onPress,
  onMarkAsRead,
}: NotificationItemProps) => {
  const handlePress = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    onPress();
  };

  const isUsername = notification.message.startsWith("@");

  const renderNotificationType = () => {
    switch (notification.type.split("_")[1]) {
      case "donationprogress":
        return <></>;

      default:
        return (
          <View style={[tw`flex-row w-full bg-[#01082E]`, styles.inner]}>
            <View
              style={tw`w-[91px] h-[84px] rounded-lg overflow-hidden relative`}
            >
              <Image
                source={notification.imageUrl}
                placeholder={
                  notification.imageUrl
                    ? { uri: notification.imageUrl }
                    : undefined
                }
                cachePolicy="disk"
                style={{ width: 91, height: 84, borderRadius: 8 }}
                contentFit="cover"
                transition={500}
              />
              <View style={[tw`absolute bg-[#0FF1CF]/80 rounded-t-lg rounded-br-lg`, styles.dateBadge]}>
                <Text style={tw`text-white text-xs`}>
                  {formatShortDate(notification.createdAt)}
                </Text>
              </View>
            </View>
            <View style={styles.content}>
              {/* Added flex-1 here */}
              <Text
                style={tw`text-white font-semibold text-lg`}
                numberOfLines={1} // Prevents title from wrapping
                ellipsizeMode="tail"
              >
                {notification.title}
              </Text>
              <Text
                style={tw`text-white`}
                numberOfLines={2} // Limits message to 2 lines
                ellipsizeMode="tail"
              >
                {isUsername ? (
                  <>
                    <Text style={tw`font-bold text-[#3D50DF]`}>
                      {notification.message.split(" ").slice(0, 1).join(" ")}
                    </Text>
                    <Text>
                      {notification.message.split(" ").slice(1).join(" ")}
                    </Text>
                  </>
                ) : (
                  notification.message
                )}
              </Text>
            </View>
          </View>
        );
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={tw`border-b bg-[#01082E] ${
        !notification.read ? "border-[#0FF1CF]" : ""
      }`}
      hitSlop={{ top: spacing.xs, bottom: spacing.xs, left: 0, right: 0 }}
    >
      <View style={styles.outer}>{renderNotificationType()}</View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inner: {
    padding: spacing.sm,
    gap: spacing.sm,
  },
  dateBadge: {
    top: spacing.xs,
    left: spacing.xs,
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    gap: spacing.sm,
  },
});
