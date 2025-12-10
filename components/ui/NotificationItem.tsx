// components/NotificationItem.tsx
import { Text, TouchableOpacity, View } from "react-native";
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

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={tw`p-4 border-b border-gray-200 ${
        !notification.read ? "bg-blue-50" : "bg-white"
      }`}
    >
      <View style={tw`flex-row justify-between items-start`}>
        <View style={tw`flex-1`}>
          <Text style={tw`font-semibold text-base`}>{notification.title}</Text>
          <Text style={tw`text-gray-600 mt-1`}>{notification.message}</Text>
          <Text style={tw`text-gray-400 text-xs mt-2`}>
            {new Date(notification.createdAt).toLocaleDateString()} •{" "}
            {new Date(notification.createdAt).toLocaleTimeString()}
          </Text>
        </View>
        {!notification.read && (
          <View style={tw`w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1`} />
        )}
      </View>
    </TouchableOpacity>
  );
};
