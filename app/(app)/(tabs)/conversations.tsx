import ConversationView from "@/components/ConversationView";
import { useSocket } from "@/context/SocketContext";
import { useFocusEffect, useRouter } from "expo-router";
import { MessageCircle, UserRound } from "lucide-react-native";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import tw from "twrnc";
import { useConversations } from "../../../hooks/useSocketReactHook";

const Conversations = () => {
  const router = useRouter();
  const { data: conversations = [] } = useConversations();
  const { socket } = useSocket();

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (socket?.connected) {
        socket.emit("getConversationTray", {});
      }
    }, [socket])
  );
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (socket?.connected) {
      socket.emit("getConversationTray");
      setRefreshing(false);
    } else {
      setRefreshing(false);
    }
  }, [socket]);

  return (
    <View style={tw`flex-1 bg-[#01082E] pt-10 pb-10 px-5 overflow-hidden`}>
      <View style={tw`mb-10 flex-row justify-between items-center`}>
        <View
          style={tw`w-11 h-11 rounded-md bg-[#1B2A50] items-center justify-center`}
        >
          <UserRound size={20} color="#8FA5E2" />
        </View>
      </View>

      <Text style={tw`text-2xl text-white font-semibold`}>Chats</Text>

      <ScrollView
        style={tw`w-full max-w-[500px] mt-5`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["white"]}
            tintColor="white"
          />
        }
      >
        <View style={tw`gap-5`}>
          {conversations.length === 0 ? (
            <View style={tw`items-center justify-center py-20`}>
              <View
                style={tw`w-14 h-14 rounded-full bg-[#1B2A50] mb-4 items-center justify-center`}
              >
                <MessageCircle size={24} color="#8FA5E2" />
              </View>
              <Text style={tw`text-white text-lg font-semibold`}>No chats yet</Text>
              <Text style={tw`text-gray-400 mt-2 text-center px-6`}>
                Start a conversation from a carpool and it will show here.
              </Text>
            </View>
          ) : (
            conversations.map((conversation: any) => (
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
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default Conversations;
