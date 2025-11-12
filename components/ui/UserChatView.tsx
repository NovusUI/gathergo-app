import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

interface Props {
  time: string;
  message: string;
  optimistic?: boolean;
}

const UserChatView = ({ message, time, optimistic = false }: Props) => {
  return (
    <View className="max-w-80 min-w-fit p-5 bg-[#350342] gap-3 rounded-t-2xl rounded-bl-2xl self-end m-2">
      <Text className="text-white">{message?.trim()}</Text>
      {!optimistic && <Text className="text-white self-end">{time}</Text>}
      {optimistic && (
        <Ionicons name="time" className="self-end" color="white" />
      )}
    </View>
  );
};

export default UserChatView;
