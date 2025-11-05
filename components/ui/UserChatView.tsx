import { Text, View } from "react-native";

interface Props {
  time: string;
  message: string;
}

const UserChatView = ({ message, time }: Props) => {
  return (
    <View className="max-w-2/3 min-w-fit p-5 bg-[#350342] gap-3 rounded-t-2xl rounded-bl-2xl self-end">
      <Text className="text-white">{message.trim()}</Text>
      <Text className="text-white self-end">{time}</Text>
    </View>
  );
};

export default UserChatView;
