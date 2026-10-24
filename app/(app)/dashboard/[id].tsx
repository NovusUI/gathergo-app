import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAppTheme } from "@/hooks/useAppTheme";
import DonationEventOverview from "@/components/ui/DonationEventOverview";
import ImpactPageLoader from "@/components/ui/ImpactPageLoader";
import Payments from "@/components/ui/Payments";
import RegistrationEventOverview from "@/components/ui/RegistrationEventOverview";
import TicketEventOverview from "@/components/ui/TicketEventOverview";
import VolunteerOverview from "@/components/volunteer/VolunteerOverview";
import { canRecruitVolunteers } from "@/utils/volunteer";
import { useEventDashboardData, useShortcutEvent } from "@/hooks/useDashboard";
import { useEventDetails } from "@/services/queries";

import { isEventPastEnd } from "@/utils/dateTimeHandler";
import { safeGoBack, useLockedRouter } from "@/utils/navigation";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const EventDashboard = () => {
  const { tw } = useAppTheme();
  const { id } = useLocalSearchParams();
  const router = useLockedRouter();

  const eventId = Array.isArray(id) ? id[0] : id;

  const { isLoading, data } = useEventDashboardData(eventId);
  const { data: eventDetailsResponse } = useEventDetails(eventId, {
    enabled: Boolean(eventId),
  });

  const { data: shortcutData } = useShortcutEvent(eventId);

  const event = useMemo(() => data?.data.event, [data]);
  const eventDetails = eventDetailsResponse?.data;

  const payments = useMemo(() => data?.data.payments || [], [data]);
  const hasEventEnded = useMemo(
    () => isEventPastEnd(eventDetails?.startDate, eventDetails?.endDate),
    [eventDetails?.endDate, eventDetails?.startDate],
  );
  const shortcuts = useMemo(() => shortcutData?.data.shortcuts, [shortcutData]);

  if (isLoading) {
    return (
      <DashboardLayout title="Event" onBack={() => safeGoBack(router, "/dashboard")} shortcuts={shortcuts ?? []}
        loading={<ImpactPageLoader title="Mapping event activity" message="Loading your event performance, attendance, and payments." />} />
    );
  }

  if (!!!data?.data) {
    return (
      <View style={tw`flex-1 bg-background dark:bg-[#01082E] justify-center items-center`}>
        <Text style={tw`text-foreground dark:text-white text-xl`}>Event not found</Text>
        <TouchableOpacity
          style={tw`mt-4 px-6 py-3 bg-primary dark:bg-[#5669FF] rounded-full`}
          onPress={() => safeGoBack(router, "/dashboard")}
        >
          <Text style={tw`text-onPrimary dark:text-white font-medium`}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <DashboardLayout title={event.title} onBack={() => safeGoBack(router, "/dashboard")} shortcuts={shortcuts ?? []} currentShortcutId={eventId}
      secondary={<Payments title="Event Payments" payments={payments} />}>
      <View style={tw`gap-4`}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push(`/event/${eventId}`)}
            style={tw`rounded-3xl border border-border dark:border-[#24345A] bg-surface dark:bg-[#0A173F] p-4`}
          >
            <Text style={tw`text-xs uppercase tracking-widest text-muted dark:text-[#87A0D6]`}>
              {hasEventEnded ? "Ended event page" : "Public event page"}
            </Text>
            <Text style={tw`mt-2 text-lg font-semibold text-foreground dark:text-white`}>
              Open attendee view
            </Text>
            <Text style={tw`mt-2 text-sm leading-5 text-secondary dark:text-[#C6D5F2]`}>
              {hasEventEnded
                ? "This event has ended. Its public page still holds the event details, updates, and any impact stories you shared."
                : "Preview the event page the same way attendees, donors, and guests see it."}
            </Text>
            <Text style={tw`mt-3 text-sm font-semibold text-accent dark:text-[#0FF1CF]`}>
              {hasEventEnded ? "View ended event page" : "Open event page"}
            </Text>
          </TouchableOpacity>

          {/* Event Overview based on type */}
          {event.type === "donation" && <DonationEventOverview event={event} />}
          {event.type === "ticket" && <TicketEventOverview event={event} />}
          {event.type === "registration" && (
            <RegistrationEventOverview event={event} />
          )}

          {eventDetails && canRecruitVolunteers(eventDetails) ? <VolunteerOverview event={eventDetails} /> : null}

      </View>
    </DashboardLayout>
  );
};

export default EventDashboard;
