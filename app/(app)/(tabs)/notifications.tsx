// app/notifications.tsx
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import { NotificationItem } from "@/components/ui/NotificationItem";
import { layoutSpacing, spacing } from "@/constants/spacing";
import { useNotification } from "@/context/NotificationContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotificationTabs } from "@/hooks/useNotificationTabs";
import { Notification } from "@/types/notification";
import { normalizeNotificationLink } from "@/utils/notificationLinks";
import { useLockedRouter } from "@/utils/navigation";
import { formatBadgeCount } from "@/utils/utils";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import tw from "twrnc";

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    loadMore,
    hasMore,
    refresh,
    loadingInitial: loading,
    isLoadingMore,
  } = useNotifications();
  const {
    activeTab,
    setActiveTab,
    todayNotifications,
    olderNotifications,
    filteredNotifications,
  } = useNotificationTabs(notifications);

  const tabs = [
    { key: "unread", label: "Unread", badge: unreadCount },
    { key: "events", label: "Events" },
    { key: "carpool", label: "Carpool" },
  ] as const;

  const { markAsRead } = useNotification();
  const [refreshing, setRefreshing] = useState(false);
  const router = useLockedRouter();

  const sections = useMemo(
    () =>
      [
        { title: "Today", data: todayNotifications },
        { title: "Older", data: olderNotifications },
      ].filter((section) => section.data.length > 0),
    [todayNotifications, olderNotifications]
  );

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    loadMore();
  }, [isLoadingMore, hasMore, loadMore]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 1000);
  }, [refresh]);

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        markAsRead(notification.id);
      }

      const target = normalizeNotificationLink(notification.link, notification);
      if (target) {
        router.push(target);
      }
    },
    [markAsRead, router]
  );

  const renderNotificationItem = useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationItem
        notification={item}
        onPress={() => handleNotificationPress(item)}
        onMarkAsRead={markAsRead}
      />
    ),
    [handleNotificationPress, markAsRead]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string; data: Notification[] } }) => (
      <Text style={styles.sectionHeader}>{section.title}</Text>
    ),
    []
  );

  const keyExtractor = useCallback((item: Notification) => item.id, []);

  const renderContent = () => {
    if (filteredNotifications.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={tw`text-gray-500 text-center`}>
            {activeTab === "unread"
              ? "No unread notifications"
              : activeTab === "events"
                ? "No event notifications"
                : "No carpool notifications"}
          </Text>
        </View>
      );
    }

    return (
      <SectionList
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderNotificationItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={tw`text-gray-500 text-center`}>No notifications yet</Text>
          </View>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoading}>
              <Text style={tw`text-gray-500`}>Loading more...</Text>
            </View>
          ) : null
        }
      />
    );
  };

  const handleTabPress = useCallback(
    (tabKey: (typeof tabs)[number]["key"]) => {
      setActiveTab(tabKey);
    },
    [setActiveTab]
  );

  if (loading) {
    return (
      <View style={[tw`flex-1 bg-[#01082E] items-center justify-center`, styles.loadingScreen]}>
        <Text style={tw`text-white`}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={[tw`flex-1 bg-[#01082E]`, styles.screen]}>
      <CustomeTopBarNav
        title="Notifications"
        onClickBack={() => router.replace("/")}
      />

      <View style={[tw`flex-row w-full max-w-[500px] self-center`, styles.tabRow]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <Pressable
              key={tab.key}
              onPress={() => handleTabPress(tab.key)}
              style={tw`pb-2 border-b-2 ${
                isActive ? "border-[#0FF1CF]" : "border-transparent"
              }`}
            >
              <View style={tw`flex-row items-center`}>
                <Text
                  style={tw`${
                    isActive ? "text-[#0FF1CF]" : "text-gray-400"
                  } font-medium`}
                >
                  {tab.label}
                </Text>

                {tab.badge ? (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>
                      {formatBadgeCount(tab.badge)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={[tw`w-full max-w-[500px] self-center flex-1`, styles.contentContainer]}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: layoutSpacing.pageTop,
  },
  loadingScreen: {
    paddingTop: layoutSpacing.pageTop,
  },
  tabRow: {
    justifyContent: "space-between",
    paddingHorizontal: layoutSpacing.pageHorizontal,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  contentContainer: {
    marginBottom: layoutSpacing.listBottomInset,
  },
  sectionHeader: {
    ...tw`text-white font-semibold`,
    paddingHorizontal: layoutSpacing.pageHorizontal,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyState: {
    padding: layoutSpacing.cardPadding,
    alignItems: "center",
  },
  footerLoading: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  tabBadge: {
    marginLeft: spacing.xs,
    backgroundColor: "#EF4444",
    borderRadius: 999,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});
