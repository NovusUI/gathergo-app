import ConversationView from "@/components/ConversationView";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { useConversations } from "../../../hooks/useSocketReactHook";

const conversations = () => {
  const router = useRouter();
  const { data: conversations = [] } = useConversations();

  useEffect(() => {
    console.log(conversations);
    if (conversations) {
      console.log(conversations.length);
    }
  }, [conversations]);

  return (
    <View className="flex-1 bg-[#01082E] flex  flex-col pt-20 pb-10 px-5 overflow-hidden">
      <View className="mb-10 flex-row justify-between items-center">
        <Image
          source={require("../../../assets/animoji.png")}
          className="w-11 h-11 rounded-md bg-white"
        ></Image>
      </View>

      <Text className="text-2xl text-white font-semibold">Chats</Text>
      <ScrollView className="w-full max-w-[500px] mt-5">
        <View className="gap-5">
          {conversations.map((conversation: any) => (
            <ConversationView
              title={conversation.event?.title}
              onClick={() => router.push(`/chat/${conversation.carpool?.id}`)}
              lastMessage={{
                text: conversation.lastMessage,
                date: conversation.lastMessageAt,
                imgUrl: conversation.sender?.profilePicUrl,
              }}
              unreadCount={conversation.unreadCount}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default conversations;
