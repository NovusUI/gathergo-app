import { useAppTheme } from "@/hooks/useAppTheme";
import CustomView from "@/components/View";
import { Text, View } from "react-native";

import LineChart from "./LineChart";
import ProgressBar from "./ProgressBar";

interface RegistrationEventOverviewProps {
  event: {
    title: string;
    description: string;
    price: number;
    registrations: number;
    registrationsGoal: number;
    revenue: number;
    registrationsData: { day: string; registrations: number }[];
  };
}

const RegistrationEventOverview = ({
  event,
}: RegistrationEventOverviewProps) => {
  const { tw, color } = useAppTheme();
  return (
    <CustomView
      style={tw`w-full border-danger dark:border-[#FF932E] border-[1px] rounded-xl p-4 bg-surfaceMuted dark:bg-[#1B2A50] gap-4`}
    >
      <View style={tw`flex-row justify-between items-center`}>
        <View>
          <Text style={tw`text-foreground dark:text-white text-xl font-bold`}>{event.title}</Text>
          <Text style={tw`text-secondary dark:text-gray-300 text-sm`}>{event.description}</Text>
        </View>
        <View style={tw`bg-orange-900 px-3 py-1 rounded-full`}>
          <Text style={tw`text-orange-300 text-sm`}>Open</Text>
        </View>
      </View>

      <View style={tw`gap-3`}>
        <View style={tw`flex-row justify-between`}>
          <Text style={tw`text-secondary dark:text-gray-300`}>Registration Fee</Text>
          <Text style={tw`text-foreground dark:text-white font-bold`}>
            ₦{event.price.toLocaleString()}
          </Text>
        </View>

        <View style={tw`gap-2`}>
          <View style={tw`flex-row justify-between`}>
            <Text style={tw`text-secondary dark:text-gray-300`}>Registrations</Text>
            <Text style={tw`text-danger dark:text-[#FF932E] font-bold`}>
              {event.registrations.toLocaleString()}/
              {event.registrationsGoal.toLocaleString()}
            </Text>
          </View>
          <ProgressBar
            progress={(event.registrations / event.registrationsGoal) * 100}
          />
          <Text style={tw`text-muted dark:text-gray-400 text-right text-sm`}>
            {((event.registrations / event.registrationsGoal) * 100).toFixed(1)}
            % of goal
          </Text>
        </View>

        <View style={tw`flex-row justify-between`}>
          <Text style={tw`text-secondary dark:text-gray-300`}>Revenue</Text>
          <Text style={tw`text-foreground dark:text-white font-bold`}>
            ₦{event.revenue.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={tw`mt-2`}>
        <Text style={tw`text-foreground dark:text-white font-bold mb-3`}>Daily Registrations</Text>
        <LineChart
          data={event.registrationsData.map((r) => ({
            day: r.day,
            registrations: r.registrations,
          }))}
          color={color("#FF932E", "danger")}
          valueKey="registrations"
          label="Registrations"
        />
      </View>
    </CustomView>
  );
};

export default RegistrationEventOverview;
