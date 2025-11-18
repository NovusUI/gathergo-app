import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import tw from "twrnc";

interface Props {
  time: string;
  message: string;
  optimistic?: boolean;
}

const UserChatView = ({ message, time, optimistic = false }: Props) => {
  return (
    <View
      style={tw`max-w-[80%] min-w-fit p-5 bg-[#350342] gap-3 rounded-t-2xl rounded-bl-2xl self-end m-2`}
    >
      <Text style={tw`text-white`}>{message?.trim()}</Text>
      {!optimistic && <Text style={tw`text-white self-end`}>{time}</Text>}
      {optimistic && (
        <Ionicons name="time" style={tw`self-end`} color="white" />
      )}
    </View>
  );
};

export default UserChatView;
