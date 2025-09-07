// app/home.tsx
import Tab from "@/components/Tab";
import CarpoolCard from "@/components/ui/CarpoolCard";
import EventCard from "@/components/ui/EventCard";
import PlaceCard from "@/components/ui/PlaceCard";

import { useAuth } from "@/context/AuthContext";
import { useForYouEvents } from "@/services/queries";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";

export default function HomeScreen() {
  const tabs = ["Events", "Carpool", "Places"];

  const [activeTab, setActiveTab] = useState(tabs[0]);
  const { user } = useAuth();

  const { data: events, isPending: loading } = useForYouEvents(user?.id);

  const router= useRouter()


  const dummyCarpools = [
    {
      id: "c1",
      driverName: "John Doe",
      pickupLocation: "Lagos",
      dropLocation: "Abuja",
      availableSeats: 3,
      departureTime: "2025-08-28T15:30:00Z",
    },
    {
      id: "c2",
      driverName: "Mary Jane",
      pickupLocation: "Ikeja",
      dropLocation: "Lekki",
      availableSeats: 2,
      departureTime: "2025-08-29T10:00:00Z",
    },
  ];
  
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
    <View className="flex-1 bg-[#030A31] flex items-center flex-col py-5">
      {/* Header */}
      <View className="flex flex-row justify-between items-center">
        <Text className="text-white">Good morning, {user?.name || "Guest"}</Text>
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
    {activeTab === "Events" && (
      loading ? (
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
          />
        ))
      ) : (
        <Text className="text-gray-400 text-center">No events found.</Text>
      )
    )}

    {activeTab === "Carpool" && (
      dummyCarpools.map((carpool) => (
        <CarpoolCard
          key={carpool.id}
          driverName={carpool.driverName}
          pickupLocation={carpool.pickupLocation}
          dropLocation={carpool.dropLocation}
          availableSeats={carpool.availableSeats}
          departureTime={carpool.departureTime}
          onPress={() => console.log(`Clicked on ${carpool.driverName}`)}
        />
      ))
    )}

    {activeTab === "Places" && (
      dummyPlaces.map((place) => (
        <PlaceCard
          key={place.id}
          name={place.name}
          description={place.description}
          imageUrl={place.imageUrl}
          onPress={() => console.log(`Clicked on ${place.name}`)}
        />
      ))
    )}
  </View>
</ScrollView>

    </View>
  );
}
