import type { ThemeColor } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import AppLoader from "@/components/ui/AppLoader";
import GogoRefreshScrollView from "@/components/ui/GogoRefreshScrollView";
// app/notifications.tsx
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import ImpactPageLoader from "@/components/ui/ImpactPageLoader";
import { NotificationItem } from "@/components/ui/NotificationItem";
import { layoutSpacing, spacing } from "@/constants/spacing";
import { useNotification } from "@/context/NotificationContext";
import { useSocket } from "@/context/SocketContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotificationTabs } from "@/hooks/useNotificationTabs";
import { Notification } from "@/types/notification";
import { normalizeNotificationLink } from "@/utils/notificationLinks";
import { useLockedRouter } from "@/utils/navigation";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function NotificationsScreen() {
  const { tw, color } = useAppTheme();
  const styles = createStyles(color);
  const {
    notifications,
    loadMore,
    hasMore,
    refresh,
    loadingInitial: loading,
    isLoadingMore,
    refreshing,
  } = useNotifications();
  const {
    activeTab,
    setActiveTab,
    todayNotifications,
    olderNotifications,
    filteredNotifications,
  } = useNotificationTabs(notifications);

  const tabs = [
    { key: "all", label: "All" },
    { key: "events", label: "Events" },
    { key: "carpool", label: "Carpool" },
  ] as const;

  const { markAsRead, markAllAsRead } = useNotification();
  const { isConnected } = useSocket();
  useFocusEffect(
    useCallback(() => {
      if (isConnected) markAllAsRead();
    }, [isConnected, markAllAsRead])
  );
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
    [styles.sectionHeader]
  );

  const keyExtractor = useCallback((item: Notification) => item.id, []);

  const renderContent = () => {
    if (filteredNotifications.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={tw`text-muted dark:text-gray-500 text-center`}>
            {activeTab === "all"
              ? "No notifications yet"
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
        renderScrollComponent={(props) => (
          <GogoRefreshScrollView
            {...props}
            refreshing={refreshing}
            onRefresh={refresh}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={tw`text-muted dark:text-gray-500 text-center`}>No notifications yet</Text>
          </View>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoading}>
              <AppLoader accessibilityLabel="Loading more notifications" />
              <Text style={tw`text-muted dark:text-gray-500`}>Loading more...</Text>
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
      <ImpactPageLoader
        title="Mapping updates"
        message="Loading invites, payments, rides, and event signals."
        style={styles.loadingScreen}
      />
    );
  }

  return (
    <View style={[tw`flex-1 bg-background dark:bg-[#01082E]`, styles.screen]}>
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
                isActive ? "border-accent dark:border-[#0FF1CF]" : "border-transparent"
              }`}
            >
              <Text
                style={tw`${
                  isActive ? "text-accent dark:text-[#0FF1CF]" : "text-muted dark:text-gray-400"
                } font-medium`}
              >
                {tab.label}
              </Text>
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

const createStyles = (color: ThemeColor) => StyleSheet.create({
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
    color: color("white", "foreground"),
    fontWeight: "600",
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
});
