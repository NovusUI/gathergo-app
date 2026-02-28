import { useDashboardEvents } from "@/hooks/useDashboard";
import { ChevronDown, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";
import ProgressIndicator from "./ProgressIndicator";
import CustomView from "./View";

interface Event {
  id: string;
  title: string;
  description: string;
  progress: number;
  participants: number;
  raised: number;
  goal: number;
  date: string;
  type: "upcoming" | "past";
}

interface EventsOverviewProps {
  initialEvents?: Event[];
  fetchMoreEvents?: (type: "upcoming" | "past") => Promise<Event[]>;
}

const EventCard = ({
  event,
  onPress,
}: {
  event: Event;
  onPress?: () => void;
}) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <CustomView
        style={tw`flex-row items-center justify-between px-4 py-4 border-t border-[#0FF1CF] bg-[#1B2A50]/50`}
      >
        <ProgressIndicator percentage={event.progress} />
        <View style={tw`gap-1 flex-1 mx-4`}>
          <Text style={tw`text-lg text-white font-semibold`}>
            {event.title}
          </Text>
          <Text style={tw`text-sm text-gray-300`}>
            {event.participants.toLocaleString()} Participants • $
            {event.raised.toLocaleString("en-NG", {
              style: "currency",
              currency: "NGN",
            })}{" "}
            Raised
          </Text>
          <Text style={tw`text-xs text-gray-400`}>
            Goal:{" "}
            {event.goal.toLocaleString("en-NG", {
              style: "currency",
              currency: "NGN",
            })}
          </Text>
        </View>
        <View style={tw`items-end`}>
          <Text style={tw`text-xs text-gray-400`}>{event.date}</Text>
          <Text
            style={[
              tw`text-xs mt-1 px-2 py-1 rounded-full`,
              event.type === "upcoming"
                ? tw`bg-green-900 text-green-300`
                : tw`bg-gray-800 text-gray-300`,
            ]}
          >
            {event.type === "upcoming" ? "Upcoming" : "Past"}
          </Text>
        </View>
      </CustomView>
    </TouchableOpacity>
  );
};

const EventsOverview = ({ initialEvents = [] }: EventsOverviewProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");

  const scrollViewRef = useRef<ScrollView>(null);

  const initialDisplayEvents = initialEvents.slice(0, 3);
  const hasMoreEvents = initialDisplayEvents.length < initialEvents.length;

  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } =
    useDashboardEvents(filter, undefined, {
      enabled: isExpanded,
    });

  const dashboardEventsData = useMemo(
    () => data?.pages.flatMap((page) => page.data),
    [data]
  );

  useEffect(() => {
    console.log(dashboardEventsData, "dbe");
  }, [data]);

  // const handleFetchMore = useCallback(async () => {
  //   if (!fetchMoreEvents || loading || !hasMore) return;

  //   setLoading(true);
  //   try {
  //     const newEvents = await fetchMoreEvents(
  //       filter === "all" ? "upcoming" : filter
  //     );
  //     if (newEvents.length === 0) {
  //       setHasMore(false);
  //     } else {
  //       setEvents((prev) => [...prev, ...newEvents]);
  //     }
  //   } catch (error) {
  //     console.error("Failed to fetch more events:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [fetchMoreEvents, filter, loading, hasMore]);

  const handleScroll = useCallback(
    (event: any) => {
      const { layoutMeasurement, contentOffset, contentSize } =
        event.nativeEvent;
      const paddingToBottom = 50;

      if (
        layoutMeasurement.height + contentOffset.y >=
          contentSize.height - paddingToBottom &&
        !isFetchingNextPage &&
        hasNextPage
      ) {
        fetchNextPage();
      }
    },
    [fetchNextPage, isFetchingNextPage, hasNextPage]
  );

  if (isExpanded) {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={isExpanded}
        onRequestClose={() => setIsExpanded(false)}
      >
        {!isLoading && (
          <SafeAreaView style={tw`flex-1 bg-[#01082E]`}>
            <View style={tw`flex-1`}>
              {/* Header */}
              <View
                style={tw`flex-row items-center justify-between p-4 border-b border-[#0FF1CF]`}
              >
                <Text style={tw`text-white text-xl font-bold`}>All Events</Text>
                <TouchableOpacity onPress={() => setIsExpanded(false)}>
                  <X color="white" size={24} />
                </TouchableOpacity>
              </View>

              {/* Filter */}
              <View style={tw`flex-row p-4 gap-2`}>
                {(["all", "upcoming", "past"] as const).map((filterType) => (
                  <TouchableOpacity
                    key={filterType}
                    onPress={() => {
                      setFilter(filterType);
                    }}
                    style={[
                      tw`px-4 py-2 rounded-full`,
                      filter === filterType
                        ? tw`bg-[#0FF1CF]`
                        : tw`bg-[#1B2A50]`,
                    ]}
                  >
                    <Text
                      style={[
                        tw`capitalize`,
                        filter === filterType
                          ? tw`text-black font-semibold`
                          : tw`text-white`,
                      ]}
                    >
                      {filterType} events
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Events List */}
              <ScrollView
                ref={scrollViewRef}
                style={tw`flex-1 px-4`}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={400}
              >
                <View style={tw`gap-1 pb-4`}>
                  {dashboardEventsData?.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}

                  {isFetchingNextPage && (
                    <View style={tw`py-8`}>
                      <ActivityIndicator size="large" color="#0FF1CF" />
                    </View>
                  )}

                  {!hasNextPage && dashboardEventsData.length > 0 && (
                    <Text style={tw`text-center text-gray-400 py-4`}>
                      No more events to load
                    </Text>
                  )}
                </View>
              </ScrollView>
            </View>
          </SafeAreaView>
        )}
      </Modal>
    );
  }

  return (
    <CustomView
      style={tw`w-full border-[#0FF1CF] border-[1px] rounded-xl p-4 bg-[#1B2A50]`}
    >
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <Text style={tw`text-white text-xl font-bold`}>Overview</Text>
        <Text style={tw`text-[#0FF1CF] font-medium`}>Events</Text>
      </View>

      {initialDisplayEvents.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}

      {hasMoreEvents && (
        <TouchableOpacity
          onPress={() => setIsExpanded(true)}
          style={tw`flex-row items-center justify-center mt-4 pt-4 border-t border-gray-700`}
        >
          <ChevronDown color="#0FF1CF" size={20} />
          <Text style={tw`text-[#0FF1CF] ml-2`}>View all events</Text>
        </TouchableOpacity>
      )}
    </CustomView>
  );
};

export default EventsOverview;
