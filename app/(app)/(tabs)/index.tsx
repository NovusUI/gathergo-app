// app/home.tsx
import Tab from "@/components/Tab";
import CarpoolCard from "@/components/ui/CarpoolCard";
import EventCard from "@/components/ui/EventCard";
import PlaceCard from "@/components/ui/PlaceCard";

import { useAuth } from "@/context/AuthContext";
import { useForYouCarpools, useForYouEvents } from "@/services/queries";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useLocationManager } from "@/hooks/useLocationManager";
import { useUnreadCounts } from "@/hooks/useSocketReactHook";
import { Feather, Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const { coords, requestLocation } = useLocationManager();
  const { data } = useUnreadCounts();
  useEffect(() => {
    requestLocation(); // ask softly once
  }, []);

  const tabs = ["Events", "Carpool", "Places"];

  const [activeTab, setActiveTab] = useState(tabs[0]);
  const { user } = useAuth();

  const { data: events, isPending: loading } = useForYouEvents(user?.id);
  const {
    data: carpoolsForYou,
    isPending: pendingCarpoolData,
    error,
  } = useForYouCarpools();

  const router = useRouter();
  useEffect(() => {
    console.log(user);
  }, [user]);
  const dummyPlaces = [
    {
      id: "p1",
      name: "Nike Art Gallery",
      description: "A cultural hub for Nigerian art",
      imageUrl: "https://via.placeholder.com/80",
    },
    {
      id: "p2",
      name: "Lekki Conservation Center",
      description: "Nature reserve and canopy walk",
      imageUrl: "https://via.placeholder.com/80",
    },
  ];

  return (
    <View className="flex-1 bg-[#030A31] flex items-center flex-col pt-20 pb-5">
      {/* Header */}
      <View className="flex flex-row justify-between items-center w-full max-w-[500px] px-5">
        <Text className="text-white">Hello!</Text>
        <View className="gap-8 flex-row">
          <TouchableOpacity>
            <Feather name="heart" size={40} color={"white"} />
          </TouchableOpacity>
          <TouchableOpacity
            className="relative"
            onPress={() => router.push("/conversations")}
          >
            <Ionicons
              size={40}
              color={"white"}
              name={
                data?.totalUnread && data?.totalUnread > 0
                  ? "chatbubble"
                  : "chatbubble-outline"
              }
            />
            {data?.totalUnread && data?.totalUnread > 0 && (
              <View className="flex-row justify-center items-center h-7 min-w-7 rounded-full bg-[#0FF1CF] absolute right-0">
                {" "}
                <Text className="text-white font-bold text-sm">
                  {data?.totalUnread}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Featured Banner */}
      <View className="mt-4 overflow-hidden">
        <Image source={require("../../../assets/images/circleframe.png")} />
      </View>

      {/* Tabs */}
      <View className="flex flex-row justify-between py-4 px-5 w-full max-w-[500px]">
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
      <ScrollView className="px-5 w-full max-w-[500px]">
        <View className="mt-6 mb-20 gap-4">
          {activeTab === "Events" &&
            (loading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : events?.data?.length ? (
              events.data?.map((event: any) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  location={event.location}
                  // date={new Date(event.startDate).toLocaleDateString()}
                  thumbnailUrl={event.thumbnailUrl}
                  imageUrl={event.imageUrl}
                  onPress={() => router.replace(`/event/${event.id}`)}
                  registrationType={event.registrationType}
                  registrationFee={event.registrationFee}
                  startDate={event.startDate}
                />
              ))
            ) : (
              <Text className="text-gray-400 text-center">
                No events found.
              </Text>
            ))}

          {activeTab === "Carpool" &&
            (pendingCarpoolData ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : carpoolsForYou?.data.length ? (
              carpoolsForYou.data.map((carpool: any) => (
                <CarpoolCard
                  id={carpool.id}
                  pickupLocation={carpool.origin}
                  title={carpool.event.title}
                  imageUrl={carpool.event.imageUrl}
                  thumbnailUrl={carpool.event.thumbnailUrl}
                  startDate={carpool.event.startDate}
                  departureTime={carpool.departureTime}
                  onPress={() => router.push(`/carpool/${carpool.id}`)}
                />
              ))
            ) : (
              <Text className="text-gray-400 text-center">
                No carpool found for you.
              </Text>
            ))}

          {activeTab === "Places" &&
            dummyPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                name={place.name}
                description={place.description}
                imageUrl={place.imageUrl}
                onPress={() => console.log(`Clicked on ${place.name}`)}
              />
            ))}
        </View>
      </ScrollView>
    </View>
  );
}
