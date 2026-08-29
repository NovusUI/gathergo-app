import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";
import tw from "twrnc";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface Props {
  time: string;
  message: string;
  optimistic?: boolean;
  rideIconName?: IoniconName;
}

const UserChatView = ({
  message,
  time,
  optimistic = false,
  rideIconName = "car-outline",
}: Props) => {
  return (
    <View
      style={tw`max-w-[84%] min-w-[112px] p-4 bg-[#350342] gap-3 rounded-t-2xl rounded-bl-2xl self-end m-2 border border-[#0FF1CF]/20`}
    >
      <Text style={tw`text-white leading-5`}>{message?.trim()}</Text>
      <View style={tw`flex-row items-center self-end gap-2`}>
        <View
          style={tw`w-6 h-6 rounded-full bg-[#0FF1CF]/15 items-center justify-center`}
        >
          <Ionicons name={rideIconName} size={12} color="#0FF1CF" />
        </View>
        {!optimistic && <Text style={tw`text-[#DDE6FF] text-xs`}>{time}</Text>}
        {optimistic && <Ionicons name="time" color="#DDE6FF" size={14} />}
      </View>
    </View>
  );
};

export default UserChatView;
