import { Image, Text, View } from "react-native";
import tw from "twrnc";
import { UserRound } from "lucide-react-native";

interface Props {
  time: string;
  message: string;
  imageUrl?: string | null;
}

const ChatView1 = ({ message, time, imageUrl }: Props) => {
  return (
    <View style={tw`flex-row items-end gap-3 my-1`}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={tw`bg-white w-7 h-7 rounded-full border border-[#31C6F6]/30`}
        />
      ) : (
        <View
          style={tw`w-7 h-7 rounded-full bg-[#1B2A50] items-center justify-center border border-[#31C6F6]/20`}
        >
          <UserRound size={13} color="#8FA5E2" />
        </View>
      )}
      <View
        style={tw`max-w-[82%] p-4 bg-[#07143B] gap-3 rounded-t-2xl rounded-br-2xl m-2 border border-[#31C6F6]/15`}
      >
        <Text style={tw`text-white leading-5`}>{message?.trim()}</Text>
        <Text style={tw`text-[#A8BAE4] text-xs self-end`}>{time}</Text>
      </View>
    </View>
  );
};

export default ChatView1;
