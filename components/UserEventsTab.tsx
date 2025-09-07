// components/UserEventsTab.tsx
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
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
  const router = useRouter();

  if (isPending) {
    return (
      <View className="flex-1 justify-center items-center py-10">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!events.length) {
    return (
      <View className="mt-4">
        <Text className="text-white text-base">No events yet.</Text>
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
          onPress={() => router.push(`/event/${item.id}`)}
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
          <View className="py-4">
            <ActivityIndicator size="small" />
          </View>
        ) : null
      }
      contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
    />
  );
}
