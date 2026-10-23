import { useAppTheme } from "@/hooks/useAppTheme";
import CustomView from "@/components/View";
import { Text, View } from "react-native";

import LineChart from "./LineChart";
import ProgressBar from "./ProgressBar";

interface TicketType {
  id: string;
  name: string;
  price: number;
  ticketsSold: number;
  ticketsTotal: number;
  ticketsLeft: number;
  revenue: number;
  progress: number; // Added: Backend should calculate this
}

interface TicketEventOverviewProps {
  event: {
    title: string;
    description: string;
    ticketTypes: TicketType[];
    totalTicketsSold: number; // Added: Backend provides this
    totalTicketsAvailable: number; // Added: Backend provides this
    totalTicketsLeft: number; // Added: Backend provides this
    totalProgress: number; // Added: Backend provides this
    revenue: number;
    isSoldOut: boolean; // Added: Backend provides this
    sales: { day: string; tickets: number; amount: number }[];
  };
}

const TicketEventOverview = ({ event }: TicketEventOverviewProps) => {
  const { tw, color } = useAppTheme();
  return (
    <CustomView
      style={tw`w-full border-primary dark:border-[#5669FF] border-[1px] rounded-xl p-4 bg-surfaceMuted dark:bg-[#1B2A50] gap-4`}
    >
      <View style={tw`flex-row justify-between items-center`}>
        <View>
          <Text style={tw`text-foreground dark:text-white text-xl font-bold`}>{event.title}</Text>
          <Text style={tw`text-secondary dark:text-gray-300 text-sm`}>{event.description}</Text>
        </View>
        <View
          style={[
            tw`px-3 py-1 rounded-full`,
            event.isSoldOut ? tw`bg-dangerSoft dark:bg-red-900` : tw`bg-infoSoft dark:bg-blue-900`,
          ]}
        >
          <Text
            style={[
              tw`text-sm`,
              event.isSoldOut ? tw`text-danger dark:text-red-300` : tw`text-info dark:text-blue-300`,
            ]}
          >
            {event.isSoldOut ? "Sold Out" : "Selling"}
          </Text>
        </View>
      </View>

      {/* Overall Statistics */}
      <View style={tw`gap-3`}>
        <View style={tw`gap-2`}>
          <View style={tw`flex-row justify-between`}>
            <Text style={tw`text-secondary dark:text-gray-300`}>Total Tickets Sold</Text>
            <Text style={tw`text-primary dark:text-[#5669FF] font-bold`}>
              {event.totalTicketsSold.toLocaleString()}/
              {event.totalTicketsAvailable.toLocaleString()}
            </Text>
          </View>
          <ProgressBar progress={event.totalProgress} />
          <View style={tw`flex-row justify-between`}>
            <Text style={tw`text-muted dark:text-gray-400 text-sm`}>
              {event.totalProgress.toFixed(1)}% sold
            </Text>
            <Text style={tw`text-muted dark:text-gray-400 text-sm`}>
              {event.totalTicketsLeft.toLocaleString()} tickets left
            </Text>
          </View>
        </View>

        <View style={tw`flex-row justify-between`}>
          <Text style={tw`text-secondary dark:text-gray-300`}>Total Revenue</Text>
          <Text style={tw`text-foreground dark:text-white font-bold`}>
            ₦{event.revenue.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Ticket Types Breakdown */}
      <View style={tw`mt-2`}>
        <Text style={tw`text-foreground dark:text-white font-bold mb-3`}>Ticket Types</Text>
        <View style={tw`gap-3`}>
          {event.ticketTypes.map((ticketType) => (
            <View
              key={ticketType.id}
              style={tw`p-3 bg-background dark:bg-[#0A1126] rounded-lg gap-2`}
            >
              <View style={tw`flex-row justify-between items-center`}>
                <Text style={tw`text-foreground dark:text-white font-medium`}>
                  {ticketType.name}
                </Text>
                <Text style={tw`text-foreground dark:text-white font-bold`}>
                  ₦{ticketType.price.toLocaleString()}
                </Text>
              </View>

              <View style={tw`gap-1`}>
                <View style={tw`flex-row justify-between`}>
                  <Text style={tw`text-muted dark:text-gray-400 text-sm`}>Sold</Text>
                  <Text style={tw`text-primary dark:text-[#5669FF] text-sm font-medium`}>
                    {ticketType.ticketsSold.toLocaleString()}/
                    {ticketType.ticketsTotal.toLocaleString()}
                  </Text>
                </View>
                <ProgressBar
                  progress={ticketType.progress}
                  height={8}
                  color={color("#5669FF", "primary")}
                />
                <View style={tw`flex-row justify-between`}>
                  <Text style={tw`text-muted dark:text-gray-500 text-xs`}>
                    {ticketType.progress.toFixed(1)}% sold
                  </Text>
                  <Text style={tw`text-muted dark:text-gray-500 text-xs`}>
                    {ticketType.ticketsLeft.toLocaleString()} left
                  </Text>
                </View>
              </View>

              <View
                style={tw`flex-row justify-between pt-2 border-t border-border dark:border-gray-800`}
              >
                <Text style={tw`text-muted dark:text-gray-400 text-sm`}>
                  Revenue from {ticketType.name}
                </Text>
                <Text style={tw`text-foreground dark:text-white text-sm font-medium`}>
                  ₦{ticketType.revenue.toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Sales Chart */}
      <View style={tw`mt-2`}>
        <Text style={tw`text-foreground dark:text-white font-bold mb-3`}>Daily Sales</Text>
        <LineChart
          data={event.sales.map((s) => ({ day: s.day, amount: s.amount }))}
          color={color("#5669FF", "primary")}
          valueKey="amount"
          label="Amount"
        />
      </View>
    </CustomView>
  );
};

export default TicketEventOverview;
