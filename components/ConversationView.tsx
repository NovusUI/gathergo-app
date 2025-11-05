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
}
const ConversationView = ({ onClick }: ConversationProps) => {
  return (
    <TouchableOpacity
      className="px-10 py-5 bg-[#031542] rounded-2xl gap-3"
      onPress={onClick}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-white">The Skill Hunt </Text>
        <Text className="text-[#D9D9D9] text-xs">13:28</Text>
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

        <Text className="text-xs text-white">
          We have space for you to keep your stuff, although it depends.{" "}
        </Text>
      </View>
      <View className="self-end w-24 rounded-2xl  flex-row justify-center bg-[#C6C6C6]/20 py-3">
        <Text className="text-white  text-xs">Carpool</Text>
      </View>
    </TouchableOpacity>
  );
};

export default ConversationView;
