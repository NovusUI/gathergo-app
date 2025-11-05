import ConversationView from "@/components/ConversationView";
import { useRouter } from "expo-router";
import { Image, ScrollView, Text, View } from "react-native";

const conversations = () => {
  const router = useRouter();
  return (
    <View className="flex-1 bg-[#01082E] flex  flex-col pt-20 pb-10 px-5 overflow-hidden">
      <View className="mb-10 flex-row justify-between items-center">
        <Image
          source={require("../../../assets/animoji.png")}
          className="w-11 h-11 rounded-md bg-white"
        ></Image>
      </View>

      <Text className="text-2xl text-white font-semibold">Chats</Text>
      <ScrollView className="w-full max-w-[500px] gap-5 mt-5">
        <ConversationView
          onClick={() => router.push(`/chat/${"djfnsjndskjfdj"}`)}
        />
      </ScrollView>
    </View>
  );
};

export default conversations;
