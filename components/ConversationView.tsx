import { formatMessageTimestamp } from "@/utils/utils";
import { UserRound } from "lucide-react-native";
import { Image, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

interface ConversationProps {
  title: string;
  lastMessage: {
    imgUrl?: string | null;
    text: string;
    date: string;
  };
  driverImgUrl?: string;
  passengerImgUrls?: string[];
  onClick: () => void;
  unreadCount?: number;
}

const ConversationView = ({
  onClick,
  title,
  lastMessage,
  unreadCount = 0,
}: ConversationProps) => {
  return (
    <TouchableOpacity
      style={tw`px-10 py-5 bg-[#031542] rounded-2xl`}
      onPress={onClick}
    >
      <View style={tw`flex-row items-center justify-between mb-3`}>
        <Text style={tw`text-white`}>{title}</Text>
        <Text style={tw`text-[#D9D9D9] text-xs`}>
          {lastMessage.date && formatMessageTimestamp(lastMessage.date)}
        </Text>
      </View>

      <View style={tw`flex-row items-center mb-3`}>
        {lastMessage?.imgUrl ? (
          <Image source={{ uri: lastMessage.imgUrl }} style={tw`w-6 h-6 rounded-full mr-3`} />
        ) : (
          <View style={tw`w-6 h-6 rounded-full mr-3 bg-[#1B2A50] items-center justify-center`}>
            <UserRound size={12} color="#8FA5E2" />
          </View>
        )}

        <Text
          style={tw`text-xs text-white flex-1`}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {lastMessage?.text}
        </Text>
      </View>

      <View
        style={tw`self-end w-24 rounded-2xl flex-row justify-center bg-[#C6C6C6]/20 py-3`}
      >
        <Text style={tw`text-white text-xs`}>Carpool</Text>
      </View>
    </TouchableOpacity>
  );
};

export default ConversationView;
