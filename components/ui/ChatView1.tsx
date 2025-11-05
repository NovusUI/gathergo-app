import { Image, Text, View } from "react-native";

interface Props {
  time: string;
  message: string;
  imageUrl: any;
}

const ChatView1 = ({ message, time, imageUrl }: Props) => {
  return (
    <View className="flex-row items-end gap-3">
      <Image
        source={imageUrl}
        className="bg-white w-5 h-5 rounded-full"
      ></Image>
      <View className="max-w-2/3 p-5 bg-[#031542] gap-3 rounded-t-2xl rounded-br-2xl ">
        <Text className="text-white">{message.trim()}</Text>
        <Text className="text-white self-end">{time}</Text>
      </View>
    </View>
  );
};

export default ChatView1;
