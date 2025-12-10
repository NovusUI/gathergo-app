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
import { useNotifications } from "@/hooks/useNotifications";
import { useUnreadCounts } from "@/hooks/useSocketReactHook";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";

export default function HomeScreen() {
  const { coords, requestLocation } = useLocationManager();
  const { data } = useUnreadCounts();
  useEffect(() => {
    requestLocation();
  }, []);

  const tabs = ["Events", "Carpool", "Places"];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const { data: events, isPending: loading } = useForYouEvents(user?.id);
  const { data: carpoolsForYou, isPending: pendingCarpoolData } =
    useForYouCarpools();

  const router = useRouter();

  console.log(carpoolsForYou?.data[1].event.startDate, "is date valid");

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
    <View style={tw`flex-1 bg-[#030A31] pt-10 pb-5 items-center`}>
      {/* Header */}
      <View
        style={tw`flex-row justify-between items-center w-full max-w-[500px] px-5`}
      >
        <Text style={tw`text-white`}>Hello!</Text>
        <View style={tw`flex-row items-center justify-between`}>
          <TouchableOpacity
            style={tw`mr-5 relative`}
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
      <View style={tw`mt-4 overflow-hidden`}>
        <Image source={require("../../../assets/images/circleframe.png")} />
      </View>

      {/* Tabs */}
      <View style={tw`flex-row justify-between py-4 px-5 w-full max-w-[500px]`}>
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
      <ScrollView style={tw`px-5 w-full max-w-[500px]`}>
        <View style={tw`mt-6 mb-20`}>
          {activeTab === "Events" &&
            (loading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : events?.data?.length ? (
              events.data.map((event: any) => (
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
              ))
            ) : (
              <Text style={tw`text-gray-400 text-center`}>
                No events found.
              </Text>
            ))}

          {activeTab === "Carpool" &&
            (pendingCarpoolData ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : carpoolsForYou?.data.length ? (
              carpoolsForYou.data.map((carpool: any) => (
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
              ))
            ) : (
              <Text style={tw`text-gray-400 text-center`}>
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
