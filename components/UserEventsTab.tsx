// components/UserEventsTab.tsx
import ActivityIndicator from "@/components/ui/AppLoader";
import { useLockedRouter } from "@/utils/navigation";
import { useRouter } from "expo-router";
import { FlatList, Text, View } from "react-native";
import tw from "twrnc";
import EventCard from "./ui/EventCard";

interface UserEventsTabProps {
  events: any[];
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isPending: boolean;
}

export default function UserEventsTab({
  events,
  isFetchingNextPage,
  fetchNextPage,
  hasNextPage,
  isPending,
}: UserEventsTabProps) {
  const router = useLockedRouter();

  if (isPending) {
    return (
      <View style={tw`flex-1 justify-center items-center py-10`}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!events.length) {
    return (
      <View style={tw`mt-4`}>
        <Text style={tw`text-white text-base`}>No events yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <EventCard
          id={item.id}
          title={item.title}
          location={item.location}
          imageUrl={item.imageUrl}
          thumbnailUrl={item.thumbnailUrl}
          registrationType={item.registrationType}
          registrationFee={item.registrationFee}
          donationTarget={item.donationTarget}
          lowestTicketPrice={item.lowestTicketPrice}
          onPress={() => router.push(`/event/${item.id}`)}
          startDate={item.startDate}
        />
      )}
      onEndReached={() => {
        console.log("hasNextPage:", hasNextPage);
        console.log("isFetchingNextPage:", isFetchingNextPage);
        if (hasNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={tw`py-4`}>
            <ActivityIndicator size="small" />
          </View>
        ) : null
      }
      contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
    />
  );
}
