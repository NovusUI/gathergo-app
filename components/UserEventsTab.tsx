import ActivityIndicator from "@/components/ui/AppLoader";
import { layoutSpacing } from "@/constants/spacing";
import type { EventData } from "@/types/auth";
import { useLockedRouter } from "@/utils/navigation";
import { SectionList, type SectionListProps, Text, View } from "react-native";
import tw from "twrnc";
import EventCard from "./ui/EventCard";

interface UserEventsTabProps
  extends Pick<
    SectionListProps<EventData>,
    "ListHeaderComponent" | "renderSectionHeader"
  > {
  events: EventData[];
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
  ListHeaderComponent,
  renderSectionHeader,
}: UserEventsTabProps) {
  const router = useLockedRouter();
  return (
    <SectionList<EventData>
      sections={[{ data: events }]}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={ListHeaderComponent}
      renderSectionHeader={renderSectionHeader}
      stickySectionHeadersEnabled={Boolean(renderSectionHeader)}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <EventCard {...item} onPress={() => router.push(`/event/${item.id}`)} />
      )}
      onEndReached={() => {
        if (!isPending && hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isPending || isFetchingNextPage ? (
          <View style={tw`items-center py-6`}>
            <ActivityIndicator
              accessibilityLabel={
                isPending ? "Loading events" : "Loading more events"
              }
            />
          </View>
        ) : events.length === 0 ? (
          <Text style={tw`py-4 text-base text-[#AFC0E7]`}>No events yet.</Text>
        ) : null
      }
      contentContainerStyle={[
        tw`gap-3`,
        { paddingBottom: layoutSpacing.listBottomInset },
      ]}
    />
  );
}
