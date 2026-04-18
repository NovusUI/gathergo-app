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
    <View style={tw`flex-row items-end gap-3`}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={tw`bg-white w-5 h-5 rounded-full`} />
      ) : (
        <View style={tw`w-5 h-5 rounded-full bg-[#1B2A50] items-center justify-center`}>
          <UserRound size={10} color="#8FA5E2" />
        </View>
      )}
      <View
        style={tw`max-w-[80%] p-5 bg-[#031542] gap-3 rounded-t-2xl rounded-br-2xl m-2`}
      >
        <Text style={tw`text-white`}>{message?.trim()}</Text>
        <Text style={tw`text-white self-end`}>{time}</Text>
      </View>
    </View>
  );
};

export default ChatView1;
