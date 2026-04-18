import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import Shortcut from "@/components/Shortcut";
import CustomView from "@/components/View";
import DonationEventOverview from "@/components/ui/DonationEventOverview";
import Payments from "@/components/ui/Payments";
import RegistrationEventOverview from "@/components/ui/RegistrationEventOverview";
import TicketEventOverview from "@/components/ui/TicketEventOverview";
import { useEventDashboardData, useShortcutEvent } from "@/hooks/useDashboard";
import { useEventDetails } from "@/services/queries";

import { Payment } from "@/utils/mockPayments";
import { safeGoBack } from "@/utils/navigation";
import { useLockedRouter } from "@/utils/navigation";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

// Mock payments for this specific event
const mockEventPayments: Payment[] = [
  {
    id: "1",
    name: "John Doe",
    amount: 50000,
    time: "10:30 AM",
    date: "Jan 25",
    event: "Feed500",
  },
  {
    id: "2",
    name: "Jane Smith",
    amount: 75000,
    time: "11:15 AM",
    date: "Jan 25",
    event: "Feed500",
  },
  {
    id: "3",
    name: "Robert Johnson",
    amount: 100000,
    time: "2:45 PM",
    date: "Jan 25",
    event: "Feed500",
  },
  {
    id: "4",
    name: "Sarah Williams",
    amount: 25000,
    time: "4:20 PM",
    date: "Jan 25",
    event: "Feed500",
  },
  {
    id: "5",
    name: "Michael Brown",
    amount: 150000,
    time: "9:15 AM",
    date: "Jan 26",
    event: "Feed500",
  },
  {
    id: "6",
    name: "Emily Davis",
    amount: 50000,
    time: "1:30 PM",
    date: "Jan 26",
    event: "Feed500",
  },
  {
    id: "7",
    name: "David Wilson",
    amount: 75000,
    time: "3:45 PM",
    date: "Jan 26",
    event: "Feed500",
  },
  {
    id: "8",
    name: "Lisa Taylor",
    amount: 100000,
    time: "5:20 PM",
    date: "Jan 26",
    event: "Feed500",
  },
  {
    id: "9",
    name: "James Anderson",
    amount: 25000,
    time: "10:10 AM",
    date: "Jan 27",
    event: "Feed500",
  },
  {
    id: "10",
    name: "Maria Thomas",
    amount: 150000,
    time: "11:45 AM",
    date: "Jan 27",
    event: "Feed500",
  },
];

const EventDashboard = () => {
  const { id } = useLocalSearchParams();
  const router = useLockedRouter();

  const eventId = Array.isArray(id) ? id[0] : id;
  //const event = mockEventData[eventId as keyof typeof mockEventData];

  const { isLoading, data, error } = useEventDashboardData(eventId);
  const { data: eventDetailsResponse } = useEventDetails(eventId, {
    enabled: Boolean(eventId),
  });

  const { isLoading: isShortcutLoading, data: shortcutData } =
    useShortcutEvent(eventId);

  const event = useMemo(() => data?.data.event, [data]);
  const eventDetails = eventDetailsResponse?.data;

  const payments = useMemo(() => data?.data.payments || [], [data]);
  const hasEventEnded = useMemo(() => {
    const boundary = eventDetails?.endDate;
    if (!boundary) return false;

    const parsedBoundary = new Date(boundary);
    if (Number.isNaN(parsedBoundary.getTime())) return false;

    return parsedBoundary.getTime() < Date.now();
  }, [eventDetails?.endDate]);
  const shortcuts = useMemo(() => shortcutData?.data.shortcuts, [shortcutData]);

  if (isLoading) {
    return (
      <View style={tw`flex-1 pt-10 bg-[#01082E]`}>
        <CustomView className={`px-3`}>
          <CustomeTopBarNav
            title="Event"
            onClickBack={() => safeGoBack(router, "/dashboard")}
          />
        </CustomView>
        <ScrollView>
          <View
            style={tw`bg-gray-700 h-60 w-full flex items-center justify-center`}
          >
            <View style={tw`w-12 h-12 rounded-full bg-gray-600 mb-2`} />
            <View style={tw`bg-gray-600 h-4 w-32 rounded`} />
            <View style={tw`bg-gray-600 h-3 w-24 rounded mt-1`} />
          </View>
          <View style={tw`bg-gray-700 h-60 w-full`} />
          <View style={tw`py-2 px-5`}>
            <View style={tw`bg-gray-700 h-6 w-3/4 mb-4 rounded`} />
            <View style={tw`bg-gray-700 h-4 w-full mb-2 rounded`} />
            <View style={tw`bg-gray-700 h-4 w-5/6 rounded`} />
          </View>
          <View style={tw`bg-[#1B2A50]/40 h-2 my-3`} />
          <View style={tw`py-2 px-5`}>
            <View style={tw`bg-gray-700 h-5 w-1/2 mb-4 rounded`} />
            {[1, 2, 3, 4].map((_, i) => (
              <View key={i} style={tw`flex-row items-center mb-4`}>
                <View style={tw`bg-gray-700 h-8 w-8 rounded-full`} />
                <View style={tw`ml-3`}>
                  <View style={tw`bg-gray-700 h-4 w-32 mb-2 rounded`} />
                  <View style={tw`bg-gray-700 h-3 w-24 rounded`} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={tw`py-5 px-5`}>
          <View style={tw`bg-gray-700 h-12 w-full rounded`} />
        </View>
      </View>
    );
  }

  if (!!!data?.data) {
    return (
      <View style={tw`flex-1 bg-[#01082E] justify-center items-center`}>
        <Text style={tw`text-white text-xl`}>Event not found</Text>
        <TouchableOpacity
          style={tw`mt-4 px-6 py-3 bg-[#5669FF] rounded-full`}
          onPress={() => safeGoBack(router, "/dashboard")}
        >
          <Text style={tw`text-white font-medium`}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-[#01082E]`}>
      {/* Top Navigation */}
      <View style={tw`pt-10 pb-4 px-5`}>
        <CustomeTopBarNav
          title={event.title}
          onClickBack={() => safeGoBack(router, "/dashboard")}
        />
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-5 pb-28`}
        showsVerticalScrollIndicator={false}
      >
        <View style={tw`gap-4 mb-24`}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push(`/event/${eventId}`)}
            style={tw`rounded-3xl border border-[#24345A] bg-[#0A173F] p-4`}
          >
            <Text style={tw`text-xs uppercase tracking-widest text-[#87A0D6]`}>
              {hasEventEnded ? "Ended event page" : "Public event page"}
            </Text>
            <Text style={tw`mt-2 text-lg font-semibold text-white`}>
              Open attendee view
            </Text>
            <Text style={tw`mt-2 text-sm leading-5 text-[#C6D5F2]`}>
              {hasEventEnded
                ? "This event has ended, but the public page still holds the story, impact, and shareable details."
                : "Preview the event page the same way attendees, donors, and guests see it."}
            </Text>
            <Text style={tw`mt-3 text-sm font-semibold text-[#0FF1CF]`}>
              {hasEventEnded ? "View ended event page" : "Open event page"}
            </Text>
          </TouchableOpacity>

          {/* Event Overview based on type */}
          {event.type === "donation" && <DonationEventOverview event={event} />}
          {event.type === "ticket" && <TicketEventOverview event={event} />}
          {event.type === "registration" && (
            <RegistrationEventOverview event={event} />
          )}

          {/* Account Info */}
          {/* <AccountInfoCard accountInfo={event.accountInfo} /> */}

          {/* Event Payments - Using the existing Payment component */}
          <Payments title="Event Payments" payments={payments} />
        </View>
      </ScrollView>

      {/* Quick Access - Always visible at bottom */}
      <View
        style={tw`absolute bottom-0 left-0 right-0 bg-[#01082E] pt-3 pb-5 px-5 border-t border-gray-800`}
      >
        <Text style={tw`text-white text-lg font-bold mb-3`}>Quick Access</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={tw`flex-row`}
        >
          <View style={tw`flex-row gap-3`}>
            {shortcuts?.map((shortcut) => (
              <Shortcut
                key={shortcut.id}
                title={shortcut.title}
                link={shortcut.link}
                isCurrent={shortcut.id === eventId}
                iconColor={shortcut.iconColor}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default EventDashboard;
