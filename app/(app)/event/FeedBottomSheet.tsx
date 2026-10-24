import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useAppTheme } from "@/hooks/useAppTheme";
import AppRefreshControl, {
  RefreshIndicator,
  nativeRefreshIndicatorOffset,
} from "@/components/ui/AppRefreshControl";
import { useFreeEventRegistration } from "@/hooks/useFreeEventRegistration";
// components/event/FeedBottomSheet.tsx
import VolunteerButton from "@/components/volunteer/VolunteerButton";
import FeedRenderer from "@/components/feed/FeedRenderer";
import ActivityIndicator from "@/components/ui/AppLoader";
import { FeedItem } from "@/hooks/useEventFeed";
import { useLocationManager } from "@/hooks/useLocationManager";
import { useEventDetails, usePaginatedEventCarpools } from "@/services/queries";
import { EventCarpoolFilter } from "@/types/carpool";
import { numberWithCommas } from "@/utils/utils";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import DontationProgress from "./DontationProgress";

interface FeedBottomSheetProps {
  eventId: string;
  isVisible: boolean;
  initialTab?: "feed" | "carpool";
  hasEventEnded?: boolean;
  onClose: () => void;
  onAction?: (action: any) => void;
  feedData?: {
    pinnedFeeds: FeedItem[];
    regularFeeds: FeedItem[];
    allFeeds: FeedItem[];
    hasMore: boolean;
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    hideFeed: (feedId: string) => void;
    loadMore: () => void;
    refresh: () => void;
  };
}

const FeedBottomSheet: FC<FeedBottomSheetProps> = ({
  eventId,
  isVisible,
  initialTab = "feed",
  hasEventEnded = false,
  onClose,
  onAction,
  feedData,
}) => {
  const { tw, color } = useAppTheme();
  const layout = useResponsiveLayout({ hasTabNavigation: false });
  const sheetMargin = Math.max(0, (layout.availableWidth - 840) / 2);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [activeTab, setActiveTab] = useState<"feed" | "carpool">(initialTab);
  const [carpoolFilter, setCarpoolFilter] = useState<EventCarpoolFilter>("all");
  const [requestingCloseToYou, setRequestingCloseToYou] = useState(false);
  const {
    coords,
    requestLocation,
    error: locationError,
    openSettings,
  } = useLocationManager();
  const snapPoints = useMemo(() => ["100%"], []);

  const feed = feedData;

  const {
    data: carpoolPages,
    isPending: carpoolsLoading,
    isRefetching: carpoolsRefreshing,
    isFetchingNextPage: carpoolsLoadingMore,
    fetchNextPage: loadMoreCarpools,
    hasNextPage: hasMoreCarpools,
    refetch: refreshCarpools,
  } = usePaginatedEventCarpools(
    {
      eventId,
      filter: carpoolFilter,
      latitude: coords?.lat,
      longitude: coords?.lng,
    },
    20,
    {
      enabled:
        isVisible &&
        activeTab === "carpool" &&
        !hasEventEnded &&
        (carpoolFilter !== "close_to_you" || Boolean(coords)),
    }
  );

  const carpoolList = useMemo(
    () => carpoolPages?.pages?.flatMap((page) => page.data) ?? [],
    [carpoolPages]
  );
  const carpoolTotal = carpoolPages?.pages?.[0]?.meta?.total ?? 0;

  const { data: eventData } = useEventDetails(eventId);
  const {
    registration: freeRegistration,
    isPending: checkingRegistration,
    isError: registrationCheckFailed,
    refetch: refreshRegistration,
  } = useFreeEventRegistration(eventData?.data);
  const supportsCarpool = eventData?.data?.isPhysicalEvent !== false;
  const canUseCarpool = supportsCarpool && !hasEventEnded;
  const eventRegistrationFee = eventData?.data?.registrationFee ?? null;
  const [refreshing, setRefreshing] = useState(false);
  const listRefreshing = activeTab === "feed" ? refreshing : carpoolsRefreshing;

  // Open/close handling
  useEffect(() => {
    if (isVisible) {
      setActiveTab(initialTab);
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [initialTab, isVisible]);

  useEffect(() => {
    if (!canUseCarpool && activeTab === "carpool") {
      setActiveTab("feed");
    }
  }, [activeTab, canUseCarpool]);

  const handleFilterChange = async (filter: EventCarpoolFilter) => {
    if (hasEventEnded) return;

    setCarpoolFilter(filter);

    if (filter === "close_to_you" && !coords) {
      setRequestingCloseToYou(true);
      const location = await requestLocation(true);
      setRequestingCloseToYou(false);

      if (!location) {
        setCarpoolFilter("all");
      }
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    feed?.refresh();
    setTimeout(() => setRefreshing(false), 1000);
  }, [feed?.refresh]);

  const refreshList = useCallback(() => {
    if (activeTab === "feed") {
      onRefresh();
    } else {
      void refreshCarpools();
    }
  }, [activeTab, onRefresh, refreshCarpools]);

  const handleLoadMore = useCallback(() => {
    if (feed?.hasMore && !feed?.loadingMore) {
      feed?.loadMore();
    }
  }, [feed?.hasMore, feed?.loadingMore, feed?.loadMore]);
  const renderFeedItem = useCallback(
    ({ item }: { item: any }) => (
      <FeedRenderer
        feed={item}
        eventRegistrationFee={eventRegistrationFee}
        onHide={feed?.hideFeed}
        onAction={(action) => onAction?.(action)}
      />
    ),
    [eventRegistrationFee, feed?.hideFeed, onAction]
  );

  const renderCarpoolItem = useCallback(
    ({ item }: { item: any }) => (
      <TouchableOpacity
        disabled={hasEventEnded}
        style={[
          tw`mx-4 mb-3 p-4 bg-surface dark:bg-[#101C45] rounded-xl border border-border dark:border-[#1B2A50]`,
          hasEventEnded ? tw`opacity-50` : null,
        ]}
        onPress={() =>
          onAction?.({ type: "OPEN_CARPOOL", carpoolId: item.id })
        }
      >
        <View style={tw`flex-row justify-between items-start`}>
          <View style={tw`flex-1 pr-3`}>
            <Text style={tw`text-foreground dark:text-white font-semibold`} numberOfLines={1}>
              {item.origin}
              {item.destination ? ` -> ${item.destination}` : ""}
            </Text>
            <Text style={tw`text-muted dark:text-gray-400 text-xs mt-1`}>
              Departs {item.departureTime}
            </Text>
          </View>
          <View style={tw`items-end`}>
            <Text style={tw`text-accent dark:text-[#0FF1CF] font-semibold text-xs`}>
              {item.pricePerSeat > 0
                ? `₦${numberWithCommas(item.pricePerSeat, false, null)}`
                : "Free"}
            </Text>
            <Text style={tw`text-muted dark:text-gray-400 text-xs mt-1`}>
              {item.seatsLeft} seat{item.seatsLeft === 1 ? "" : "s"} left
            </Text>
          </View>
        </View>

        <View style={tw`flex-row items-center justify-between mt-3`}>
          <Text style={tw`text-secondary dark:text-gray-300 text-xs`}>
            @{item.driver?.username || "driver"}
          </Text>
          <View style={tw`bg-accentFill dark:bg-[#0FF1CF] px-2.5 py-1 rounded-full`}>
            <Text style={tw`text-xs text-onAccent dark:text-[#01082E] font-semibold`}>
              {(() => {
                if (carpoolFilter === "close_to_you") {
                  if (typeof item.distanceKm === "number") {
                    return `${item.distanceKm.toFixed(1)} km away`;
                  }
                  return "Close to you";
                }

                const reasons: string[] = item.ranking?.reasons || [];
                const primaryReason = item.ranking?.primaryReason;
                if (
                  primaryReason === "followed_owner" ||
                  reasons.includes("followed_owner")
                ) {
                  return "You follow owner";
                }
                if (
                  primaryReason === "distance" ||
                  reasons.includes("distance")
                ) {
                  return "Close to you";
                }
                return "Recommended";
              })()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [carpoolFilter, hasEventEnded, onAction, tw]
  );

  // Render event info based on type
  const renderEventInfo = () => {
    if (!eventData?.data) return null;

    const {
      registrationType,
      eventTickets,
      registrationFee,
      donationTarget,
      totalDonations,
      donationsEnabled,
    } = eventData.data;

    return (
      <View style={tw`p-4 bg-surface dark:bg-[#101C45] mx-4 mt-2 mb-4 rounded-xl`}>
        <Text style={tw`text-foreground dark:text-white font-bold mb-2`}>
          {eventData.data.title}
        </Text>

        {hasEventEnded && (
          <View
            style={tw`mb-3 rounded-xl border border-border dark:border-[#2B3C66] bg-surface/60 dark:bg-[#1B2A50]/60 p-3`}
          >
            <Text style={tw`text-sm font-semibold text-muted dark:text-[#8FA1CB]`}>
              Event ended
            </Text>
            <Text style={tw`mt-1 text-xs leading-5 text-secondary dark:text-[#9FB0D8]`}>
              Ticketing, registration, and donations are closed.
            </Text>
          </View>
        )}

        {!hasEventEnded && registrationType === "ticket" && eventTickets && (
          <View style={tw`mb-3`}>
            <Text style={tw`text-secondary dark:text-gray-300 mb-2`}>Available Tickets:</Text>
            {eventTickets.map((ticket: any, index: number) => (
              <TouchableOpacity
                key={index}
                style={tw`px-3 py-2 bg-surfaceMuted dark:bg-[#1B2A50] rounded-lg mb-2`}
                onPress={() => onAction?.({ type: "BUY_TICKET" })}
              >
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-foreground dark:text-white`}>{ticket.type}</Text>
                  <Text style={tw`text-accent dark:text-[#0FF1CF] font-bold`}>
                    ₦{numberWithCommas(ticket.price || 0, false, null)}
                  </Text>
                </View>
                <Text style={tw`text-muted dark:text-gray-400 text-xs mt-1`}>
                  {ticket.quantity - ticket.sold} remaining
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!hasEventEnded && registrationType === "registration" && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Event registration"
            accessibilityState={{
              disabled: checkingRegistration || Boolean(freeRegistration),
            }}
            disabled={checkingRegistration || Boolean(freeRegistration)}
            style={tw`mb-3`}
            onPress={() =>
              registrationCheckFailed
                ? void refreshRegistration()
                : onAction?.({ type: "REGISTER" })
            }
          >
            <Text style={tw`text-secondary dark:text-gray-300 mb-1`}>Registration:</Text>
            <Text style={tw`text-accent dark:text-[#0FF1CF] font-bold text-lg`}>
              {checkingRegistration
                ? "Checking registration…"
                : freeRegistration
                  ? "Registered"
                  : registrationCheckFailed
                    ? "Retry registration check"
                    : registrationFee && registrationFee > 0
                      ? `₦${numberWithCommas(registrationFee, false, null)}`
                      : "Free"}
            </Text>
          </TouchableOpacity>
        )}

        {!hasEventEnded &&
          donationsEnabled && (registrationType === "donation" || registrationType === "volunteer") && (
            <DontationProgress
              onAction={onAction}
              donationTarget={donationTarget}
              totalDonations={totalDonations}
            />
          )}
      </View>
    );
  };

  // List Header Component
  const FilterChip = ({
    label,
    value,
  }: {
    label: string;
    value: EventCarpoolFilter;
  }) => (
    <TouchableOpacity
      onPress={() => handleFilterChange(value)}
      style={tw.style(
        "px-3 py-2 rounded-full border",
        carpoolFilter === value
          ? "bg-accentFill dark:bg-[#0FF1CF] border-accent dark:border-[#0FF1CF]"
          : "bg-surface dark:bg-[#101C45] border-border dark:border-[#1B2A50]"
      )}
    >
      <Text
        style={tw.style(
          "text-xs font-semibold",
          carpoolFilter === value ? "text-onAccent dark:text-[#01082E]" : "text-foreground dark:text-white"
        )}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const ListHeaderComponent = useCallback(
    () => (
      <>
        <RefreshIndicator refreshing={listRefreshing} />
        <View
          style={tw`flex-row justify-between items-center gap-2 p-5 border-b border-border dark:border-gray-800`}
        >
          <View style={tw`flex-1 flex-row flex-wrap items-center gap-2`}>
            <TouchableOpacity
              style={tw.style(
                "px-3 py-1.5 rounded-full",
                activeTab === "feed" ? "bg-accentFill dark:bg-[#0FF1CF]" : "bg-surfaceMuted dark:bg-[#1B2A50]"
              )}
              onPress={() => setActiveTab("feed")}
            >
              <Text
                style={tw.style(
                  "text-xs font-semibold",
                  activeTab === "feed" ? "text-onAccent dark:text-[#01082E]" : "text-foreground dark:text-white"
                )}
              >
                Live Feed
              </Text>
            </TouchableOpacity>
            {canUseCarpool && (
              <TouchableOpacity
                style={tw.style(
                  "px-3 py-1.5 rounded-full",
                  activeTab === "carpool" ? "bg-accentFill dark:bg-[#0FF1CF]" : "bg-surfaceMuted dark:bg-[#1B2A50]"
                )}
                onPress={() => setActiveTab("carpool")}
              >
                <Text
                  style={tw.style(
                    "text-xs font-semibold",
                    activeTab === "carpool" ? "text-onAccent dark:text-[#01082E]" : "text-foreground dark:text-white"
                  )}
                >
                  Carpool
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={tw`flex-row items-center gap-2`}>
            {eventData && onAction ? (
              <VolunteerButton
                event={eventData.data}
                hasEventEnded={hasEventEnded}
                variant="compact"
                onPress={() => onAction({ type: "VOLUNTEER" })}
              />
            ) : null}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close feed"
              onPress={onClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={24} color={color("white", "foreground")} />
            </TouchableOpacity>
          </View>
        </View>
        {activeTab === "feed" && feed?.error ? (
          <Text style={tw`px-5 pt-2 text-danger dark:text-red-500 text-xs`}>{feed.error}</Text>
        ) : null}

        {activeTab === "feed" ? (
          <>
            {renderEventInfo()}

            {!listRefreshing &&
              feed?.loading &&
              feed?.allFeeds.length === 0 && (
                <ActivityIndicator
                  tone="accent"
                  size="large"
                  style={tw`py-10`}
                />
              )}
          </>
        ) : (
          <View style={tw`px-4 pt-4 gap-3`}>
            <View style={tw`flex-row justify-between items-center`}>
              <Text style={tw`text-secondary dark:text-gray-300 text-sm`}>
                {carpoolTotal} ride{carpoolTotal === 1 ? "" : "s"} available
              </Text>
              <TouchableOpacity
                disabled={hasEventEnded}
                onPress={() => onAction?.({ type: "CREATE_CARPOOL" })}
                style={[
                  tw`bg-accentFill/20 dark:bg-[#0FF1CF]/20 px-3 py-1.5 rounded-full border border-accent/40 dark:border-[#0FF1CF]/40`,
                  hasEventEnded ? tw`opacity-50` : null,
                ]}
              >
                <Text style={tw`text-accent dark:text-[#0FF1CF] text-xs font-semibold`}>
                  {hasEventEnded ? "Event ended" : "Create ride"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={tw`flex-row gap-2 mb-4`}>
              <FilterChip label="All" value="all" />
              <FilterChip label="Close to you" value="close_to_you" />
              <FilterChip label="Followed" value="followed" />
            </View>

            {Boolean(locationError) && carpoolFilter === "close_to_you" && (
              <View
                style={tw`bg-danger/20 dark:bg-red-500/20 border border-danger/40 dark:border-red-500/40 p-3 rounded-lg`}
              >
                <Text style={tw`text-danger dark:text-red-300 text-xs mb-2`}>
                  {locationError}
                </Text>
                <TouchableOpacity
                  onPress={openSettings}
                  style={tw`self-start bg-danger/20 dark:bg-red-500/20 px-3 py-1 rounded-full`}
                >
                  <Text style={tw`text-danger dark:text-red-200 text-xs`}>Open Settings</Text>
                </TouchableOpacity>
              </View>
            )}

            {!listRefreshing && (carpoolsLoading || requestingCloseToYou) && (
              <ActivityIndicator tone="accent" size="large" style={tw`py-8`} />
            )}
          </View>
        )}
      </>
    ),
    [
      listRefreshing,
      activeTab,
      carpoolFilter,
      carpoolsLoading,
      carpoolTotal,
      feed,
      eventData,
      freeRegistration,
      checkingRegistration,
      registrationCheckFailed,
      refreshRegistration,
      hasEventEnded,
      locationError,
      requestingCloseToYou,
      onClose,
      onAction,
      canUseCarpool, tw, color]
  );

  // List Footer Component
  const ListFooterComponent = useCallback(
    () => (
      <>
        {/* Loading More Indicator */}
        {!listRefreshing && activeTab === "feed" && feed?.loadingMore && (
          <ActivityIndicator tone="accent" style={tw`py-4`} />
        )}
        {!listRefreshing && activeTab === "carpool" && carpoolsLoadingMore && (
          <ActivityIndicator tone="accent" style={tw`py-4`} />
        )}

        {/* End of Feed Message */}
        {activeTab === "feed" &&
          !feed?.hasMore &&
          Boolean(feed?.allFeeds.length) && (
            <View style={tw`py-6 items-center`}>
              <Text style={tw`text-muted dark:text-gray-500`}>
                🎉 You&apos;ve reached the end
              </Text>
            </View>
          )}
        {activeTab === "carpool" &&
          !hasMoreCarpools &&
          carpoolList.length > 0 && (
            <View style={tw`py-6 items-center`}>
              <Text style={tw`text-muted dark:text-gray-500`}>No more rides</Text>
            </View>
          )}
      </>
    ),
    [
      listRefreshing,
      activeTab,
      carpoolList.length,
      carpoolsLoadingMore,
      feed?.loadingMore,
      feed?.hasMore,
      feed?.allFeeds.length,
      hasMoreCarpools,
      tw,
    ]
  );

  // List Empty Component
  const ListEmptyComponent = useCallback(
    () =>
      activeTab === "feed" && !feed?.loading ? (
        <View style={tw`py-10 items-center`}>
          <Ionicons name="chatbubble-outline" size={48} color="#666" />
          <Text style={tw`text-muted dark:text-gray-500 mt-4`}>No activity yet</Text>
          <Text style={tw`text-muted dark:text-gray-600 text-sm mt-2`}>
            Be the first to interact with this event!
          </Text>
        </View>
      ) : activeTab === "carpool" && !carpoolsLoading ? (
        <View style={tw`py-10 items-center`}>
          <Ionicons name="car-outline" size={48} color="#666" />
          <Text style={tw`text-muted dark:text-gray-500 mt-4`}>No rides found</Text>
          <Text style={tw`text-muted dark:text-gray-600 text-sm mt-2`}>
            {hasEventEnded
              ? "Ride creation and joining are closed for this event."
              : "Try another filter or create a ride for this event."}
          </Text>
        </View>
      ) : null,
    [activeTab, carpoolsLoading, feed?.loading, hasEventEnded, tw]
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      index={0}
      enableDynamicSizing={false}
      topInset={layout.insets.top}
      bottomInset={layout.insets.bottom}
      containerStyle={{marginLeft: layout.insets.left + sheetMargin, marginRight: layout.insets.right + sheetMargin}}
      onDismiss={onClose}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
        />
      )}
      backgroundStyle={{ backgroundColor: color("#01082E", "background") }}
      handleIndicatorStyle={{ backgroundColor: "#666" }}
    >
      <BottomSheetFlatList
        key={activeTab}
        style={tw`flex-1`}
        focusHook={useFocusEffect}
        data={activeTab === "feed" ? feed?.allFeeds ?? [] : carpoolList}
        keyExtractor={(item: any) => item.id}
        renderItem={activeTab === "feed" ? renderFeedItem : renderCarpoolItem}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={tw`w-full max-w-[720px] self-center pb-6`}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        extraData={{
          activeTab,
          eventRegistrationFee,
          feedCount: feed?.allFeeds.length || 0,
          carpoolCount: carpoolList.length,
          hasEventEnded,
        }}
        refreshing={listRefreshing}
        onRefresh={refreshList}
        progressViewOffset={nativeRefreshIndicatorOffset}
        refreshControl={
          <AppRefreshControl
            refreshing={listRefreshing}
            onRefresh={refreshList}
          />
        }
        onEndReached={
          activeTab === "feed"
            ? handleLoadMore
            : () => {
                if (hasMoreCarpools && !carpoolsLoadingMore) {
                  loadMoreCarpools();
                }
              }
        }
        onEndReachedThreshold={0.3} // Load more when 30% from bottom
        showsVerticalScrollIndicator={false}
      />
    </BottomSheetModal>
  );
};

export default FeedBottomSheet;
