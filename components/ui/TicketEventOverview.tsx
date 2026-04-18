import CustomView from "@/components/View";
import { Text, View } from "react-native";
import tw from "twrnc";
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
  return (
    <CustomView
      style={tw`w-full border-[#5669FF] border-[1px] rounded-xl p-4 bg-[#1B2A50] gap-4`}
    >
      <View style={tw`flex-row justify-between items-center`}>
        <View>
          <Text style={tw`text-white text-xl font-bold`}>{event.title}</Text>
          <Text style={tw`text-gray-300 text-sm`}>{event.description}</Text>
        </View>
        <View
          style={[
            tw`px-3 py-1 rounded-full`,
            event.isSoldOut ? tw`bg-red-900` : tw`bg-blue-900`,
          ]}
        >
          <Text
            style={[
              tw`text-sm`,
              event.isSoldOut ? tw`text-red-300` : tw`text-blue-300`,
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
            <Text style={tw`text-gray-300`}>Total Tickets Sold</Text>
            <Text style={tw`text-[#5669FF] font-bold`}>
              {event.totalTicketsSold.toLocaleString()}/
              {event.totalTicketsAvailable.toLocaleString()}
            </Text>
          </View>
          <ProgressBar progress={event.totalProgress} />
          <View style={tw`flex-row justify-between`}>
            <Text style={tw`text-gray-400 text-sm`}>
              {event.totalProgress.toFixed(1)}% sold
            </Text>
            <Text style={tw`text-gray-400 text-sm`}>
              {event.totalTicketsLeft.toLocaleString()} tickets left
            </Text>
          </View>
        </View>

        <View style={tw`flex-row justify-between`}>
          <Text style={tw`text-gray-300`}>Total Revenue</Text>
          <Text style={tw`text-white font-bold`}>
            ₦{event.revenue.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Ticket Types Breakdown */}
      <View style={tw`mt-2`}>
        <Text style={tw`text-white font-bold mb-3`}>Ticket Types</Text>
        <View style={tw`gap-3`}>
          {event.ticketTypes.map((ticketType) => (
            <View
              key={ticketType.id}
              style={tw`p-3 bg-[#0A1126] rounded-lg gap-2`}
            >
              <View style={tw`flex-row justify-between items-center`}>
                <Text style={tw`text-white font-medium`}>
                  {ticketType.name}
                </Text>
                <Text style={tw`text-white font-bold`}>
                  ₦{ticketType.price.toLocaleString()}
                </Text>
              </View>

              <View style={tw`gap-1`}>
                <View style={tw`flex-row justify-between`}>
                  <Text style={tw`text-gray-400 text-sm`}>Sold</Text>
                  <Text style={tw`text-[#5669FF] text-sm font-medium`}>
                    {ticketType.ticketsSold.toLocaleString()}/
                    {ticketType.ticketsTotal.toLocaleString()}
                  </Text>
                </View>
                <ProgressBar
                  progress={ticketType.progress}
                  height={8}
                  color="#5669FF"
                />
                <View style={tw`flex-row justify-between`}>
                  <Text style={tw`text-gray-500 text-xs`}>
                    {ticketType.progress.toFixed(1)}% sold
                  </Text>
                  <Text style={tw`text-gray-500 text-xs`}>
                    {ticketType.ticketsLeft.toLocaleString()} left
                  </Text>
                </View>
              </View>

              <View
                style={tw`flex-row justify-between pt-2 border-t border-gray-800`}
              >
                <Text style={tw`text-gray-400 text-sm`}>
                  Revenue from {ticketType.name}
                </Text>
                <Text style={tw`text-white text-sm font-medium`}>
                  ₦{ticketType.revenue.toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Sales Chart */}
      <View style={tw`mt-2`}>
        <Text style={tw`text-white font-bold mb-3`}>Daily Sales</Text>
        <LineChart
          data={event.sales.map((s) => ({ day: s.day, amount: s.amount }))}
          color="#5669FF"
          valueKey="amount"
          label="Amount"
        />
      </View>
    </CustomView>
  );
};

export default TicketEventOverview;
