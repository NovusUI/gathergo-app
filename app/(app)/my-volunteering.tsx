import { useAppTheme } from "@/hooks/useAppTheme";
import GogoRefreshScrollView from "@/components/ui/GogoRefreshScrollView";
import ImpactPageLoader from "@/components/ui/ImpactPageLoader";
import { MascotMoment } from "@/components/gogo/mascot/MascotMoment";
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomButton from "@/components/buttons/CustomBtn1";
import WithdrawApplicationButton from "@/components/volunteer/WithdrawApplicationButton";
import { useVolunteerHistory } from "@/services/queries";
import type { VolunteerHistoryEntry } from "@/types/volunteer";
import { VOLUNTEER_STATUS_LABELS } from "@/utils/volunteer";
import { formatEventDateTime } from "@/utils/dateTimeHandler";
import { safeGoBack, useLockedRouter } from "@/utils/navigation";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

export default function MyVolunteering() {
  const { tw } = useAppTheme();
  const query = useVolunteerHistory();
  const router = useLockedRouter();
  const pageLoader = (
    <ImpactPageLoader
      title="Loading your volunteering"
      message="Finding your applications and volunteer places."
    />
  );
  return (
    <View style={tw`flex-1 bg-background dark:bg-[#01082E] pt-10`}>
      <View style={tw`px-5`}>
        <CustomeTopBarNav
          title="My volunteering"
          onClickBack={() => safeGoBack(router, "/settings")}
        />
      </View>
      {query.isPending ? (
        pageLoader
      ) : query.isError ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => query.refetch()}
          style={tw`p-5`}
        >
          <Text style={tw`text-danger dark:text-[#FF8A8A]`}>
            Could not load your volunteering. Tap to retry.
          </Text>
        </TouchableOpacity>
      ) : (
        <FlatList
          data={query.data.data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            tw`gap-4 px-5 pb-16`,
            query.data.data.length === 0 && tw`grow`,
          ]}
          renderScrollComponent={(props) => (
            <GogoRefreshScrollView
              {...props}
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
            />
          )}
          ListHeaderComponent={
            <View style={tw`gap-2 pb-4`}>

              {query.data.data.length > 0 ? (
                <>
                  <Text style={tw`text-2xl font-bold text-foreground dark:text-white`}>
                    Your time makes an impact
                  </Text>
                  <Text style={tw`text-sm leading-5 text-secondary dark:text-[#A8BAE4]`}>
                    Track applications, confirmed places and contributions
                    recognised by organisers.
                  </Text>
                </>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            query.isFetching ? query.isRefetching ? null : pageLoader : (
              <View style={tw`flex-1 justify-center`}>
                <MascotMoment
                  variant="empty"
                  layout="stacked"
                  title="No volunteering yet"
                  message="Find an impact event and lend a hand. Your volunteer applications will appear here."
                  typing={false}
                />
              </View>
            )
          }
          renderItem={({ item }) => <VolunteerHistoryCard entry={item} />}
        />
      )}
    </View>
  );
}

function VolunteerHistoryCard({ entry }: { entry: VolunteerHistoryEntry }) {
  const { tw } = useAppTheme();
  const router = useLockedRouter();
  return (
    <View style={tw`gap-3 rounded-2xl border border-border dark:border-[#24345A] p-4`}>
      <Text style={tw`text-lg font-semibold text-foreground dark:text-white`}>
        {entry.event.title}
      </Text>
      <Text style={tw`text-sm text-secondary dark:text-[#A8BAE4]`}>{entry.role.title}</Text>
      <Text style={tw`text-sm text-secondary dark:text-[#A8BAE4]`}>
        {formatEventDateTime(entry.event.startDate, entry.event.endDate)}
      </Text>
      {entry.event.location !== null ? (
        <Text style={tw`text-sm text-secondary dark:text-[#A8BAE4]`}>{entry.event.location}</Text>
      ) : null}
      <Text style={tw`font-semibold text-accent dark:text-[#0FF1CF]`}>
        {VOLUNTEER_STATUS_LABELS[entry.status]}
      </Text>
      {entry.confirmedMinutes !== null ? (
        <Text style={tw`text-sm text-secondary dark:text-[#C6D5F2]`}>
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
