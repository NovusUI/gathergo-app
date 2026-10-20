import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomButton from "@/components/buttons/CustomBtn1";
import WithdrawApplicationButton from "@/components/volunteer/WithdrawApplicationButton";
import { useVolunteerHistory } from "@/services/queries";
import type { VolunteerHistoryEntry } from "@/types/volunteer";
import { VOLUNTEER_STATUS_LABELS } from "@/utils/volunteer";
import { formatEventDateTime } from "@/utils/dateTimeHandler";
import { safeGoBack, useLockedRouter } from "@/utils/navigation";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";

export default function MyVolunteering() {
  const query = useVolunteerHistory();
  const router = useLockedRouter();
  return (
    <View style={tw`flex-1 bg-[#01082E] pt-10`}>
      <View style={tw`px-5`}>
        <CustomeTopBarNav
          title="My volunteering"
          onClickBack={() => safeGoBack(router, "/settings")}
        />
      </View>
      {query.isPending ? (
        <ActivityIndicator color="#0FF1CF" />
      ) : query.isError ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => query.refetch()}
          style={tw`p-5`}
        >
          <Text style={tw`text-[#FF8A8A]`}>
            Could not load your volunteering. Tap to retry.
          </Text>
        </TouchableOpacity>
      ) : (
        <FlatList
          data={query.data.data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={tw`gap-4 px-5 pb-16`}
          refreshing={query.isRefetching}
          onRefresh={() => query.refetch()}
          ListHeaderComponent={
            <View style={tw`gap-2 pb-4`}>
              <Text style={tw`text-2xl font-bold text-white`}>
                Your time makes an impact
              </Text>
              <Text style={tw`text-sm leading-5 text-[#A8BAE4]`}>
                Track applications, confirmed places and contributions
                recognised by organisers.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={tw`text-[#A8BAE4]`}>
              You have no volunteer applications yet. Explore physical impact
              events to find a role.
            </Text>
          }
          renderItem={({ item }) => <VolunteerHistoryCard entry={item} />}
        />
      )}
    </View>
  );
}

function VolunteerHistoryCard({ entry }: { entry: VolunteerHistoryEntry }) {
  const router = useLockedRouter();
  return (
    <View style={tw`gap-3 rounded-2xl border border-[#24345A] p-4`}>
      <Text style={tw`text-lg font-semibold text-white`}>
        {entry.event.title}
      </Text>
      <Text style={tw`text-sm text-[#A8BAE4]`}>{entry.role.title}</Text>
      <Text style={tw`text-sm text-[#A8BAE4]`}>
        {formatEventDateTime(entry.event.startDate, entry.event.endDate)}
      </Text>
      {entry.event.location !== null ? (
        <Text style={tw`text-sm text-[#A8BAE4]`}>{entry.event.location}</Text>
      ) : null}
      <Text style={tw`font-semibold text-[#0FF1CF]`}>
        {VOLUNTEER_STATUS_LABELS[entry.status]}
      </Text>
      {entry.confirmedMinutes !== null ? (
        <Text style={tw`text-sm text-[#C6D5F2]`}>
          {entry.confirmedMinutes} minutes confirmed by the organiser
        </Text>
      ) : null}
      <CustomButton
        showArrow={false}
        title="View event"
        buttonClassName="w-full"
        onPress={() =>
          router.push({
            pathname: "/event/[id]",
            params: { id: entry.eventId },
          })
        }
      />
      <WithdrawApplicationButton
        application={entry}
        startDate={entry.event.startDate}
      />
    </View>
  );
}
