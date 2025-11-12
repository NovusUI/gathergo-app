import { formatMessageTimestamp } from "@/utils/utils";
import { Image, Text, TouchableOpacity, View } from "react-native";
import OverlappingImages from "./ui/OverlappingImages";

interface ConversationProps {
  title: string;
  lastMessage: {
    imgUrl: string;
    text: string;
    date: string;
  };
  driverImgUrl: string;
  passengerImgUrls: string[];
  onClick: () => void;
  unreadCount: number;
}
const ConversationView = ({
  onClick,
  title,
  lastMessage,
  unreadCount = 0,
}: ConversationProps) => {
  return (
    <TouchableOpacity
      className="px-10 py-5 bg-[#031542] rounded-2xl gap-3"
      onPress={onClick}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-white">{title} </Text>
        <Text className="text-[#D9D9D9] text-xs">
          {lastMessage.date && formatMessageTimestamp(lastMessage.date)}
        </Text>
      </View>
      <OverlappingImages
        images={[
          require("../assets/animoji.png"),
          require("../assets/animoji.png"),
          require("../assets/animoji.png"),
          require("../assets/animoji.png"),
        ]}
      />
      <View className="flex-row items-center gap-3">
        <Image
          source={require("../assets/animoji.png")}
          className="w-6 h-6 rounded-full"
        />

        <Text
          className="text-xs text-white mr-10"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {lastMessage?.text}{" "}
        </Text>
      </View>
      <View className="self-end w-24 rounded-2xl  flex-row justify-center bg-[#C6C6C6]/20 py-3">
        <Text className="text-white  text-xs">Carpool</Text>
      </View>
    </TouchableOpacity>
  );
};

export default ConversationView;
