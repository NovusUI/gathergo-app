// components/event/FeedBottomSheet.tsx
import FeedRenderer from "@/components/feed/FeedRenderer";
import ActivityIndicator from "@/components/ui/AppLoader";
import { FeedItem } from "@/hooks/useEventFeed";
import { useLocationManager } from "@/hooks/useLocationManager";
import { useEventDetails, usePaginatedEventCarpools } from "@/services/queries";
import { EventCarpoolFilter } from "@/types/carpool";
import { numberWithCommas } from "@/utils/utils";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Text,
  TouchableOpacity,
  View
} from "react-native";
import tw from "twrnc";

interface FeedBottomSheetProps {
  eventId: string;
  isVisible: boolean;
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
  onClose,
  onAction,
  feedData,
}) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [activeTab, setActiveTab] = useState<"feed" | "carpool">("feed");
  const [carpoolFilter, setCarpoolFilter] = useState<EventCarpoolFilter>("all");
  const [requestingCloseToYou, setRequestingCloseToYou] = useState(false);
  const { coords, requestLocation, error: locationError, openSettings } =
    useLocationManager();
  const snapPoints = useMemo(() => ["100%"], []);

  // const snapPoints = useMemo(() => {
  //   // Calculate based on screen height
  //   const screenHeight = Dimensions.get("window").height;
  //   return [screenHeight * 0.6, screenHeight * 0.9];
  // }, []);

  // Use provided feedData or fallback to hook
  //const feedHook = useEventFeed(eventId);
  const feed = feedData;

  const {
    data: carpoolPages,
    isPending: carpoolsLoading,
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
        (carpoolFilter !== "close_to_you" || Boolean(coords)),
    }
  );

  const carpoolList = useMemo(
    () => carpoolPages?.pages?.flatMap((page) => page.data) ?? [],
    [carpoolPages]
  );
  const carpoolTotal = carpoolPages?.pages?.[0]?.meta?.total ?? 0;

  const { data: eventData } = useEventDetails(eventId);
  const supportsCarpool = eventData?.data?.isPhysicalEvent !== false;
  const [refreshing, setRefreshing] = useState(false);

  // Open/close handling
  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isVisible]);

  useEffect(() => {
    if (!supportsCarpool && activeTab === "carpool") {
      setActiveTab("feed");
    }
  }, [activeTab, supportsCarpool]);

  const handleFilterChange = async (filter: EventCarpoolFilter) => {
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

  const handleLoadMore = useCallback(() => {
    if (feed?.hasMore && !feed?.loadingMore) {
      feed?.loadMore();
    }
  }, [feed?.hasMore, feed?.loadingMore, feed?.loadMore]);
  const renderFeedItem = useCallback(
    ({ item }: { item: any }) => (
      <FeedRenderer
        feed={item}
        onHide={feed?.hideFeed}
        onAction={(action) => onAction?.(action)}
      />
    ),
    [feed?.hideFeed, onAction]
  );

  const renderCarpoolItem = useCallback(
    ({ item }: { item: any }) => (
      <TouchableOpacity
        style={tw`mx-4 mb-3 p-4 bg-[#101C45] rounded-xl border border-[#1B2A50]`}
        onPress={() => onAction?.({ type: "OPEN_CARPOOL", carpoolId: item.id })}
      >
        <View style={tw`flex-row justify-between items-start`}>
          <View style={tw`flex-1 pr-3`}>
            <Text style={tw`text-white font-semibold`} numberOfLines={1}>
              {item.origin}
              {item.destination ? ` -> ${item.destination}` : ""}
            </Text>
            <Text style={tw`text-gray-400 text-xs mt-1`}>
              Departs {item.departureTime}
            </Text>
          </View>
          <View style={tw`items-end`}>
            <Text style={tw`text-[#0FF1CF] font-semibold text-xs`}>
              {item.pricePerSeat > 0
                ? `₦${numberWithCommas(item.pricePerSeat, false, null)}`
                : "Free"}
            </Text>
            <Text style={tw`text-gray-400 text-xs mt-1`}>
              {item.seatsLeft} seat{item.seatsLeft === 1 ? "" : "s"} left
            </Text>
          </View>
        </View>

        <View style={tw`flex-row items-center justify-between mt-3`}>
          <Text style={tw`text-gray-300 text-xs`}>
            @{item.driver?.username || "driver"}
          </Text>
          <View style={tw`bg-[#0FF1CF] px-2.5 py-1 rounded-full`}>
            <Text style={tw`text-xs text-black font-semibold`}>
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
                if (primaryReason === "distance" || reasons.includes("distance")) {
                  return "Close to you";
                }
                return "Recommended";
              })()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [carpoolFilter, onAction]
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
    } = eventData.data;


    return (
      <View style={tw`p-4 bg-[#101C45] mx-4 mt-2 rounded-xl`}>
        <Text style={tw`text-white font-bold mb-2`}>
          {eventData.data.title}
        </Text>

        {registrationType === "ticket" && eventTickets && (
          <View style={tw`mb-3`}>
            <Text style={tw`text-gray-300 mb-2`}>Available Tickets:</Text>
            {eventTickets.map((ticket: any, index: number) => (
              <TouchableOpacity
                key={index}
                style={tw`px-3 py-2 bg-[#1B2A50] rounded-lg mb-2`}
                onPress={() => onAction?.({ type: "BUY_TICKET" })}
              >
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-white`}>{ticket.type}</Text>
                  <Text style={tw`text-[#0FF1CF] font-bold`}>
                    ₦{numberWithCommas(ticket.price || 0, false, null)}
                  </Text>
                </View>
                <Text style={tw`text-gray-400 text-xs mt-1`}>
                  {ticket.quantity - ticket.sold} remaining
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {registrationType === "registration" && (
          <TouchableOpacity
            style={tw`mb-3`}
            onPress={() => onAction?.({ type: "REGISTER" })}
          >
            <Text style={tw`text-gray-300 mb-1`}>Registration:</Text>
            <Text style={tw`text-[#0FF1CF] font-bold text-lg`}>
              {registrationFee && registrationFee > 0
                ? `₦${numberWithCommas(registrationFee, false, null)}`
                : "Free"}
            </Text>
          </TouchableOpacity>
        )}

        {registrationType === "donation" && donationTarget && (
          <TouchableOpacity
            style={tw`mb-3`}
            onPress={() => onAction?.({ type: "DONATE" })}
          >
            <Text style={tw`text-gray-300 mb-2`}>Donation Progress:</Text>
            <Text style={tw`text-[#0FF1CF] font-bold text-lg mb-1`}>
              ₦{numberWithCommas(donationTarget, false, null)} Goal
            </Text>
            <View style={tw`h-2 bg-gray-700 rounded-full overflow-hidden`}>
              <View
                style={[
                  tw`h-full bg-[#0FF1CF] rounded-full`,
                  {
                    width: `${Math.min(
                      ((totalDonations/100 || 0) / donationTarget) * 100,
                      100
                    )}%`,
                  },
                ]}
              />
            </View>
            <Text style={tw`text-gray-400 text-xs mt-1`}>
              ₦{numberWithCommas((totalDonations || 0) / 100, false, null)}{" "}
              raised
            </Text>
          </TouchableOpacity>
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
          ? "bg-[#0FF1CF] border-[#0FF1CF]"
          : "bg-[#101C45] border-[#1B2A50]"
      )}
    >
      <Text
        style={tw.style(
          "text-xs font-semibold",
          carpoolFilter === value ? "text-black" : "text-white"
        )}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const ListHeaderComponent = useCallback(
    () => (
      <>
        <View
          style={tw`flex-row justify-between items-center p-5 border-b border-gray-800`}
        >
          <View style={tw`flex-row items-center gap-2`}>
            <TouchableOpacity
              style={tw.style(
                "px-3 py-1.5 rounded-full",
                activeTab === "feed" ? "bg-[#0FF1CF]" : "bg-[#1B2A50]"
              )}
              onPress={() => setActiveTab("feed")}
            >
              <Text
                style={tw.style(
                  "text-xs font-semibold",
                  activeTab === "feed" ? "text-black" : "text-white"
                )}
              >
                Live Feed
              </Text>
            </TouchableOpacity>
            {supportsCarpool && (
              <TouchableOpacity
                style={tw.style(
                  "px-3 py-1.5 rounded-full",
                  activeTab === "carpool" ? "bg-[#0FF1CF]" : "bg-[#1B2A50]"
                )}
                onPress={() => setActiveTab("carpool")}
              >
                <Text
                  style={tw.style(
                    "text-xs font-semibold",
                    activeTab === "carpool" ? "text-black" : "text-white"
                  )}
                >
                  Carpool
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={tw`flex-row items-center`}>
            {activeTab === "feed" && Boolean(feed?.error) && (
              <Text style={tw`text-red-500 text-xs mr-3`}>{feed?.error}</Text>
            )}
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === "feed" ? (
          <>
            {renderEventInfo()}

            {feed?.pinnedFeeds && feed?.pinnedFeeds.length > 0 && (
              <View style={tw`px-4 mt-4`}>
                <Text style={tw`text-gray-400 mb-3`}>📌 Pinned</Text>
                {feed.pinnedFeeds.map((pinnedFeed) => (
                  <View key={`pinned-${pinnedFeed?.id}`}>
                    {renderFeedItem({ item: pinnedFeed })}
                  </View>
                ))}
              </View>
            )}

            <Text
              style={tw`text-gray-400 mb-3 px-4 ${
                feed?.pinnedFeeds && feed?.pinnedFeeds?.length > 0
                  ? "mt-4"
                  : "mt-0"
              }`}
            >
              📝 Latest Activity
            </Text>

            {feed?.loading && feed?.regularFeeds?.length === 0 && (
              <ActivityIndicator tone="accent" size="large" style={tw`py-10`} />
            )}
          </>
        ) : (
          <View style={tw`px-4 pt-4 gap-3`}>
            <View style={tw`flex-row justify-between items-center`}>
              <Text style={tw`text-gray-300 text-sm`}>
                {carpoolTotal} ride{carpoolTotal === 1 ? "" : "s"} available
              </Text>
              <TouchableOpacity
                onPress={() => onAction?.({ type: "CREATE_CARPOOL" })}
                style={tw`bg-[#0FF1CF]/20 px-3 py-1.5 rounded-full border border-[#0FF1CF]/40`}
              >
                <Text style={tw`text-[#0FF1CF] text-xs font-semibold`}>
                  Create ride
                </Text>
              </TouchableOpacity>
            </View>

            <View style={tw`flex-row gap-2 mb-4`}>
              <FilterChip label="All" value="all" />
              <FilterChip label="Close to you" value="close_to_you" />
              <FilterChip label="Followed" value="followed" />
            </View>

            {Boolean(locationError) && carpoolFilter === "close_to_you" && (
              <View style={tw`bg-red-500/20 border border-red-500/40 p-3 rounded-lg`}>
                <Text style={tw`text-red-300 text-xs mb-2`}>{locationError}</Text>
                <TouchableOpacity
                  onPress={openSettings}
                  style={tw`self-start bg-red-500/20 px-3 py-1 rounded-full`}
                >
                  <Text style={tw`text-red-200 text-xs`}>Open Settings</Text>
                </TouchableOpacity>
              </View>
            )}

            {(carpoolsLoading || requestingCloseToYou) && (
              <ActivityIndicator tone="accent" size="large" style={tw`py-8`} />
            )}
          </View>
        )}
      </>
    ),
    [
      activeTab,
      carpoolFilter,
      carpoolsLoading,
      carpoolTotal,
      feed,
      locationError,
      requestingCloseToYou,
      onClose,
      onAction,
      renderFeedItem,
    ]
  );

  // List Footer Component
  const ListFooterComponent = useCallback(
    () => (
      <>
        {/* Loading More Indicator */}
        {activeTab === "feed" && feed?.loadingMore && (
          <ActivityIndicator tone="accent" style={tw`py-4`} />
        )}
        {activeTab === "carpool" && carpoolsLoadingMore && (
          <ActivityIndicator tone="accent" style={tw`py-4`} />
        )}

        {/* End of Feed Message */}
        {activeTab === "feed" &&
          !feed?.hasMore &&
          feed?.regularFeeds &&
          feed?.regularFeeds?.length > 0 && (
            <View style={tw`py-6 items-center`}>
              <Text style={tw`text-gray-500`}>
                🎉 You&apos;ve reached the end
              </Text>
            </View>
          )}
        {activeTab === "carpool" && !hasMoreCarpools && carpoolList.length > 0 && (
          <View style={tw`py-6 items-center`}>
            <Text style={tw`text-gray-500`}>No more rides</Text>
          </View>
        )}
      </>
    ),
    [
      activeTab,
      carpoolList.length,
      carpoolsLoadingMore,
      feed?.loadingMore,
      feed?.hasMore,
      feed?.regularFeeds?.length,
      hasMoreCarpools,
    ]
  );

  // List Empty Component
  const ListEmptyComponent = useCallback(
    () =>
      activeTab === "feed" && !feed?.loading ? (
        <View style={tw`py-10 items-center`}>
          <Ionicons name="chatbubble-outline" size={48} color="#666" />
          <Text style={tw`text-gray-500 mt-4`}>No activity yet</Text>
          <Text style={tw`text-gray-600 text-sm mt-2`}>
            Be the first to interact with this event!
          </Text>
        </View>
      ) : activeTab === "carpool" && !carpoolsLoading ? (
        <View style={tw`py-10 items-center`}>
          <Ionicons name="car-outline" size={48} color="#666" />
          <Text style={tw`text-gray-500 mt-4`}>No rides found</Text>
          <Text style={tw`text-gray-600 text-sm mt-2`}>
            Try another filter or create a ride for this event.
          </Text>
        </View>
      ) : null,
    [activeTab, carpoolsLoading, feed?.loading]
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      index={0}
      enableDynamicSizing={false}
      topInset={0}
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
      backgroundStyle={{ backgroundColor: "#01082E" }}
      handleIndicatorStyle={{ backgroundColor: "#666" }}
    >
      <BottomSheetFlatList
        key={activeTab}
        focusHook={useFocusEffect}
        data={activeTab === "feed" ? feed?.regularFeeds || [] : carpoolList}
        keyExtractor={(item: any) => item.id}
        renderItem={activeTab === "feed" ? renderFeedItem : renderCarpoolItem}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={tw`pb-20`}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        extraData={{
          activeTab,
          feedCount: feed?.regularFeeds?.length || 0,
          pinnedCount: feed?.pinnedFeeds?.length || 0,
          carpoolCount: carpoolList.length,
        }}
        refreshing={activeTab === "feed" ? refreshing : false}
        onRefresh={
          activeTab === "feed"
            ? onRefresh
            : () => {
                refreshCarpools();
              }
        }
        onEndReached={activeTab === "feed" ? handleLoadMore : () => {
          if (hasMoreCarpools && !carpoolsLoadingMore) {
            loadMoreCarpools();
          }
        }}
        onEndReachedThreshold={0.3} // Load more when 30% from bottom
        showsVerticalScrollIndicator={false}
      />
    </BottomSheetModal>
  );
};

export default FeedBottomSheet;
