import CustomView from "@/components/View";
import { Text, View } from "react-native";
import tw from "twrnc";
import LineChart from "./LineChart";
import ProgressBar from "./ProgressBar";

interface DonationEventOverviewProps {
  event: {
    title: string;
    description: string;
    target: number;
    raised: number;
    progress: number;
    participants: number;
    donations: { day: string; amount: number }[];
  };
}

const DonationEventOverview = ({ event }: DonationEventOverviewProps) => {
  return (
    <CustomView
      style={tw`w-full border-[#0FF1CF] border-[1px] rounded-xl p-4 bg-[#1B2A50] gap-4`}
    >
      <View style={tw`flex-row justify-between items-center`}>
        <View>
          <Text style={tw`text-white text-xl font-bold`}>{event.title}</Text>
          <Text style={tw`text-gray-300 text-sm`}>{event.description}</Text>
        </View>
        <View style={tw`bg-green-900 px-3 py-1 rounded-full`}>
          <Text style={tw`text-green-300 text-sm`}>Active</Text>
        </View>
      </View>

      <View style={tw`gap-3`}>
        <View style={tw`flex-row justify-between`}>
          <Text style={tw`text-gray-300`}>Target</Text>
          <Text style={tw`text-white font-bold`}>
            ₦{event.target.toLocaleString()}
          </Text>
        </View>

        <View style={tw`gap-2`}>
          <View style={tw`flex-row justify-between`}>
            <Text style={tw`text-gray-300`}>Raised</Text>
            <Text style={tw`text-[#0FF1CF] font-bold`}>
              ₦{event.raised.toLocaleString()}
            </Text>
          </View>
          <ProgressBar progress={event.progress} />
          <Text style={tw`text-gray-400 text-right text-sm`}>
            {event.progress.toFixed(1)}%
          </Text>
        </View>

        <View style={tw`flex-row justify-between`}>
          <Text style={tw`text-gray-300`}>Participants</Text>
          <Text style={tw`text-white font-bold`}>
            {event.participants.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={tw`mt-2`}>
        <Text style={tw`text-white font-bold mb-3`}>Weekly Donations</Text>
        <LineChart
          data={event.donations}
          color="#0FF1CF"
          valueKey="amount"
          label="Amount"
        />
      </View>
    </CustomView>
  );
};

export default DonationEventOverview;
