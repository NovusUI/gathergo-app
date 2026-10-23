import { useAppTheme } from "@/hooks/useAppTheme";
import ActivityIndicator from "@/components/ui/AppLoader";
import { useVolunteerSummary } from "@/services/queries";
import type { EventDetails } from "@/types/event";
import { useLockedRouter } from "@/utils/navigation";
import VolunteerStats from "./VolunteerStats";
import { Text, TouchableOpacity, View } from "react-native";

export default function VolunteerOverview({ event }: { event: EventDetails }) {
  const { tw, color } = useAppTheme();
  const query = useVolunteerSummary(event.id);
  const router = useLockedRouter();
  return (
    <View
      style={tw`gap-4 rounded-2xl border border-accent/30 dark:border-[#0FF1CF]/30 bg-surface dark:bg-[#071637] p-4`}
    >
      <Text style={tw`text-lg font-semibold text-foreground dark:text-white`}>Volunteering</Text>
      {query.isPending ? (
        <ActivityIndicator color={color("#0FF1CF", "accent")} />
      ) : query.isError ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => query.refetch()}
        >
          <Text style={tw`text-danger dark:text-[#FF8A8A]`}>
            Could not load volunteering. Tap to retry.
          </Text>
        </TouchableOpacity>
      ) : (
        <VolunteerStats summary={query.data.data} />
      )}
      {event.registrationType === "volunteer" &&
      (event.donationsEnabled || event.totalDonations > 0) ? (
        <Text style={tw`text-sm text-secondary dark:text-[#A8BAE4]`}>
          Optional donations raised: ₦
          {(event.totalDonations / 100).toLocaleString("en-NG")}
        </Text>
      ) : null}
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() =>
          router.push({
            pathname: "/volunteers/[id]",
            params: { id: event.id },
          })
        }
      >
        <Text style={tw`font-semibold text-accent dark:text-[#0FF1CF]`}>
          Manage roles, applications and attendance →
        </Text>
      </TouchableOpacity>
    </View>
  );
}
