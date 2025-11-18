import ConversationView from "@/components/ConversationView";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import tw from "twrnc";
import { useConversations } from "../../../hooks/useSocketReactHook";

const Conversations = () => {
  const router = useRouter();
  const { data: conversations = [] } = useConversations();

  useEffect(() => {
    console.log(conversations);
    if (conversations) {
      console.log(conversations.length);
    }
  }, [conversations]);

  return (
    <View style={tw`flex-1 bg-[#01082E] pt-10 pb-10 px-5 overflow-hidden`}>
      <View style={tw`mb-10 flex-row justify-between items-center`}>
        <Image
          source={require("../../../assets/animoji.png")}
          style={tw`w-11 h-11 rounded-md bg-white`}
        />
      </View>

      <Text style={tw`text-2xl text-white font-semibold`}>Chats</Text>

      <ScrollView style={tw`w-full max-w-[500px] mt-5`}>
        <View style={tw`gap-5`}>
          {conversations.map((conversation: any) => (
            <ConversationView
              key={conversation.carpool?.id}
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

export default Conversations;
