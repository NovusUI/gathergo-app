// app/notifications.tsx
import { useSocket } from "@/context/SocketContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { NotificationItem } from "@/components/ui/NotificationItem";
import { useNotification } from "@/context/NotificationContext";
import { Notification } from "@/types/notification";
import { useRouter } from "expo-router";
import tw from "twrnc";

export default function NotificationsScreen() {
  const { socket } = useSocket();

  const {
    notifications,
    unreadCount,
    loadMore,
    hasMore,
    refresh,
    loadingInitial: loading,
    isLoadingMore,
  } = useNotifications();

  useEffect(() => {
    if (socket) markAllAsRead();
  }, [socket]);

  const { markAsRead, markAllAsRead } = useNotification();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    loadMore();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.link) {
      console.log("Navigate to:", notification.link);
      router.push(notification.link);
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <NotificationItem
      notification={item}
      onPress={() => handleNotificationPress(item)}
      onMarkAsRead={markAsRead}
    />
  );

  if (loading) {
    return (
      <View style={tw`flex-1 bg-[#01082E] pt-10 items-center justify-center`}>
        <Text style={tw`text-white`}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-[#01082E] pt-10 mb-20`}>
      {/* Header */}
      <View
        style={tw`px-4 py-3 border-b border-gray-200 flex-row justify-between items-center`}
      >
        <View>
          <Text style={tw`text-xl font-bold text-white`}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={tw`text-gray-500 text-sm`}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={tw`text-blue-500 font-medium`}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={tw`w-full max-w-[500px] flex-1`}>
        {/* Notifications List */}
        <FlatList
          data={notifications}
          keyExtractor={(item) => `notification-${item.id}`}
          renderItem={renderNotification}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={tw`p-8 items-center`}>
              <Text style={tw`text-gray-500 text-center`}>
                No notifications yet
              </Text>
            </View>
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={tw`py-4 items-center`}>
                <Text style={tw`text-gray-500`}>Loading more...</Text>
              </View>
            ) : null
          }
        />
      </View>
    </View>
  );
}
