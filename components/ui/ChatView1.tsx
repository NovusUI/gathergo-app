import { useAppTheme } from "@/hooks/useAppTheme";
import { Image, Text, View } from "react-native";

import { UserRound } from "lucide-react-native";

interface Props {
  time: string;
  message: string;
  imageUrl?: string | null;
}

const ChatView1 = ({ message, time, imageUrl }: Props) => {
  const { tw, color } = useAppTheme();
  return (
    <View style={tw`flex-row items-end gap-3 my-1`}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={tw`bg-surface dark:bg-white w-7 h-7 rounded-full border border-info/30 dark:border-[#31C6F6]/30`}
        />
      ) : (
        <View
          style={tw`w-7 h-7 rounded-full bg-surfaceMuted dark:bg-[#1B2A50] items-center justify-center border border-info/20 dark:border-[#31C6F6]/20`}
        >
          <UserRound size={13} color={color("#8FA5E2", "secondary")} />
        </View>
      )}
      <View
        style={tw`max-w-[82%] p-4 bg-chatIncoming gap-3 rounded-t-2xl rounded-br-2xl m-2 border border-border dark:border-[#31C6F6]/15`}
      >
        <Text style={tw`text-foreground dark:text-white leading-5`}>{message?.trim()}</Text>
        <Text style={tw`text-secondary dark:text-[#A8BAE4] text-xs self-end`}>{time}</Text>
      </View>
    </View>
  );
};

export default ChatView1;
