import Tab from "@/components/Tab";
import CarpoolCard from "@/components/ui/CarpoolCard";
import EventCard from "@/components/ui/EventCard";
import { layoutSpacing, spacing } from "@/constants/spacing";

import { useAuth } from "@/context/AuthContext";
import { useForYouCarpools, useForYouEvents } from "@/services/queries";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useLocationManager } from "@/hooks/useLocationManager";
import { useNotifications } from "@/hooks/useNotifications";
import { useUnreadCounts } from "@/hooks/useSocketReactHook";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";

export default function HomeScreen() {
  const { requestLocation } = useLocationManager();
  const { data } = useUnreadCounts();
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const tabs = ["Events", "Carpool", "Circle"];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const { data: events, isPending: loading } = useForYouEvents(user?.id);
  const { data: carpoolsForYou, isPending: pendingCarpoolData } =
    useForYouCarpools();

  const router = useRouter();

  const displayName = user?.username || user?.name || "there";

  return (
    <View style={[tw`flex-1 bg-[#030A31] items-center`, styles.screen]}>
      {/* Header */}
      <View style={[tw`flex-row justify-between items-center w-full max-w-[500px]`, styles.header]}>
        <Text style={tw`text-white`}>{`Hello ${displayName} 😊`}</Text>
        <View style={tw`flex-row items-center justify-between`}>
          <TouchableOpacity
            style={[tw`relative`, styles.headerIconButton]}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons
              size={30}
              color={"white"}
              name={unreadCount > 0 ? "heart" : "heart-outline"}
            />
            {unreadCount > 0 && (
              <View
                style={tw`absolute right-0 bg-[#0FF1CF] rounded-full h-5  px-2 justify-center items-center`}
              >
                <Text style={tw`text-white font-bold text-sm`}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`relative`}
            onPress={() => router.push("/conversations")}
          >
            <Ionicons
              size={30}
              color="white"
              name={
                data?.totalUnread && data.totalUnread > 0
                  ? "chatbubble"
                  : "chatbubble-outline"
              }
            />
            {data?.totalUnread && data.totalUnread > 0 && (
              <View
                style={tw`absolute right-0 bg-[#0FF1CF] rounded-full h-5 px-2  justify-center items-center`}
              >
                <Text style={tw`text-white font-bold text-xs`}>
                  {data.totalUnread}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Featured Banner */}
      <TouchableOpacity
        style={[tw`overflow-hidden`, styles.banner]}
        onPress={() => router.push("/circle")}
      >
        <Image source={require("../../../assets/images/circleframe.png")} />
      </TouchableOpacity>

      {/* Tabs */}
      <View style={[tw`flex-row justify-between w-full max-w-[500px]`, styles.tabs]}>
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            title={tab}
            isActive={activeTab === tab}
            className="w-1/4"
            onPress={() => setActiveTab(tab)}
          />
        ))}
      </View>

      {/* Event List */}
      <ScrollView style={[tw`w-full max-w-[500px]`, styles.scroll]}>
        <View style={styles.listSection}>
          {activeTab === "Events" &&
            (loading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : events?.data?.length ? (
              <View style={styles.listGroup}>
                {events.data.map((event: any) => (
                  <EventCard
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    location={event.location}
                    thumbnailUrl={event.thumbnailUrl}
                    imageUrl={event.imageUrl}
                    onPress={() => router.replace(`/event/${event.id}`)}
                    registrationType={event.registrationType}
                    registrationFee={event.registrationFee}
                    startDate={event.startDate}
                  />
                ))}
              </View>
            ) : (
              <Text style={tw`text-gray-400 text-center`}>
                No events found.
              </Text>
            ))}

          {activeTab === "Carpool" &&
            (pendingCarpoolData ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : carpoolsForYou?.data.length ? (
              <View style={styles.listGroup}>
                {carpoolsForYou.data.map((carpool: any) => (
                  <CarpoolCard
                    key={carpool.id}
                    id={carpool.id}
                    pickupLocation={carpool.origin}
                    title={carpool.event.title}
                    imageUrl={carpool.event.imageUrl}
                    thumbnailUrl={carpool.event.thumbnailUrl}
                    startDate={carpool.event.startDate}
                    departureTime={carpool.departureTime}
                    onPress={() => router.push(`/carpool/${carpool.id}`)}
                  />
                ))}
              </View>
            ) : (
              <Text style={tw`text-gray-400 text-center`}>
                No carpool found for you.
              </Text>
            ))}

          {activeTab === "Circle" && (
            <TouchableOpacity
              style={styles.circleBanner}
              onPress={() => router.push("/circle")}
              activeOpacity={0.85}
            >
              <Image
                source={require("../../../assets/images/circleframe.png")}
                style={styles.circleBannerImage}
              />
              <Text style={tw`text-white text-base font-semibold mt-3 text-center`}>
                Circle is coming soon
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: layoutSpacing.pageTop,
    paddingBottom: layoutSpacing.pageBottom,
  },
  header: {
    paddingHorizontal: layoutSpacing.pageHorizontal,
  },
  headerIconButton: {
    marginRight: spacing.xl,
  },
  banner: {
    marginTop: spacing.lg,
  },
  tabs: {
    paddingVertical: spacing.lg,
    paddingHorizontal: layoutSpacing.pageHorizontal,
  },
  scroll: {
    paddingHorizontal: layoutSpacing.pageHorizontal,
  },
  listSection: {
    marginTop: spacing.lg,
    marginBottom: layoutSpacing.listBottomInset,
  },
  listGroup: {
    gap: layoutSpacing.listGap,
  },
  circleBanner: {
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: "#101C45",
    alignItems: "center",
  },
  circleBannerImage: {
    width: "100%",
    maxWidth: 420,
    height: 140,
    borderRadius: 12,
  },
});
