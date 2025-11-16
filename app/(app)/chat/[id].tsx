import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomView from "@/components/View";
import ChatInput from "@/components/inputs/ChatInput";
import { ChatSkeleton } from "@/components/ui/ChatSkeleton";
import ChatView1 from "@/components/ui/ChatView1";
import OverlappingImages from "@/components/ui/OverlappingImages";
import { TypingIndicator } from "@/components/ui/TypingIndicator";
import UserChatView from "@/components/ui/UserChatView";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useConversations } from "@/hooks/useSocketReactHook";
import { useMessageQueueStore } from "@/store/messageQueue";
import { useQueryClient } from "@tanstack/react-query";

const ChatPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const [value, setValue] = useState("");
  const carpoolId = Array.isArray(id) ? id[0] : id;
  const { socket, updateConversationAfterSend, clearNotificationData } =
    useSocket();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const { addMessage } = useMessageQueueStore();

  const { messages, loadMore, hasMore, loadingInitial, loadingMore } =
    useChatMessages(carpoolId);

  const { data: conversations = [] } = useConversations();

  const unreadCount =
    (conversations.find((conv: any) => conv.carpool.id == carpoolId) as any)
      ?.unreadCount ?? 0;

  const queryClient = useQueryClient();
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const SCROLL_THRESHOLD = 80;

  const handleScroll = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const nearBottom = y < SCROLL_THRESHOLD;
    setIsAtBottom(nearBottom);
  };

  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidShow", () => {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      });
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    console.log(messages.length, "message length");
    if (!socket || !carpoolId || messages.length === 0 || !isAtBottom) return;

    const t = setTimeout(() => {
      socket.emit("markMsgAsRead", { carpoolId });
    }, 300);

    return () => clearTimeout(t);
  }, [messages.length, socket, carpoolId, isAtBottom]);
  useEffect(() => {
    // Clear any pending notification data when chat screen is opened
    clearNotificationData();
  }, [carpoolId, clearNotificationData]);

  useEffect(() => {
    if (!socket || !carpoolId) {
      return;
    } else {
      const handleTyping = (data: { userId: string; isTyping: boolean }) => {
        setTypingUsers((prev) => {
          if (data.isTyping) {
            if (!prev.includes(data.userId)) return [...prev, data.userId];
            return prev;
          } else {
            return prev.filter((id) => id !== data.userId);
          }
        });
      };

      socket.on("typing", handleTyping);

      return () => {
        socket.off("typing", handleTyping);
      };
    }
  }, [socket, carpoolId]);

  useEffect(() => {
    if (isAtBottom) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      });
    }
  }, [messages.length]);

  const sendMessage = async (text: string) => {
    if (!socket || text.trim().length === 0) return;
    setSending(true);

    const optimistic = {
      id: `temp-${Date.now()}`,
      content: text,
      carpoolId,
      senderId: user?.id,
      createdAt: new Date().toISOString(),
      sender: { id: user?.id, username: user?.username },
      readBy: [],
      optimistic: true,
    };

    queryClient.setQueryData(["messages", carpoolId], (old: any) => {
      if (!old) {
        return {
          pageParams: [{ before: null, beforeId: null }],
          pages: [[optimistic]],
        };
      }

      const flat = old.pages.flat();

      return {
        ...old,
        pages: [[optimistic, ...flat]],
      };
    });

    updateConversationAfterSend(carpoolId, optimistic);
    setValue("");

    requestAnimationFrame(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    });

    try {
      if (socket && socket.connected) {
        socket.emit("sendMessage", {
          carpoolId,
          content: text,
          tempId: optimistic.id,
        });
      } else {
        await addMessage({ carpoolId, content: text, tempId: optimistic.id });
      }
    } catch (e) {
      console.log("send error", e);
    }

    setSending(false);
  };

  const hasCached = messages.length > 0;
  const showLoader = loadingInitial && !hasCached;

  const typingCount = typingUsers.length;
  const isTyping = typingCount > 0;

  let typingText = "";
  if (typingCount === 1) typingText = "1 person is typing";
  else if (typingCount === 2) typingText = "2 people are typing";
  else if (typingCount > 2) typingText = "Several people are typing";

  const renderMessage = ({ item }: { item: any }) => {
    const isUser = item.senderId === user?.id;

    if (isUser) {
      return (
        <UserChatView
          message={item.content}
          time={new Date(item.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          optimistic={item.optimistic}
        />
      );
    }

    return (
      <ChatView1
        message={item.content}
        time={new Date(item.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
        imageUrl={require("../../../assets/animoji.png")}
      />
    );
  };

  return (
    <View className="flex-1 pt-20 bg-[#01082E]">
      <CustomView className="px-3 flex-row justify-between items-center relative">
        <CustomeTopBarNav title="Chat" onClickBack={() => router.back()} />
        <OverlappingImages
          images={[
            require("../../../assets/animoji.png"),
            require("../../../assets/animoji.png"),
            require("../../../assets/animoji.png"),
            require("../../../assets/animoji.png"),
          ]}
          className="absolute right-4"
        />
      </CustomView>

      <View className="h-[1px] w-full bg-white my-5" />

      <View className="w-full max-w-[500px] flex-1">
        {showLoader ? (
          <ChatSkeleton />
        ) : (
          <FlatList
            ref={flatListRef}
            inverted
            data={messages}
            keyExtractor={(item) => `msg-${item.id}`}
            renderItem={renderMessage}
            onScroll={handleScroll}
            onEndReached={() => hasMore && loadMore()}
            onEndReachedThreshold={0.1}
            // 🚀 keeps scroll position stable when new pages prepend
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingBottom: 12,
            }}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator color="white" className="py-3" />
              ) : null
            }
          />
        )}
      </View>

      {isTyping && <TypingIndicator text={typingText} />}
      {!isAtBottom && (
        <TouchableOpacity
          onPress={() =>
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true })
          }
          className="absolute bottom-32 right-5 bg-blue-500 rounded-full h-10 w-10 flex-row items-center justify-center"
        >
          <Text className="text-white text-lg">↓</Text>
          {unreadCount > 0 && (
            <View className="absolute top-0 right-0 rounded-full min-w-4 h-4 bg-white flex-row items-center justify-center">
              <Text className="text-[#350342] text-xs">{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      <CustomView className="min-h-28 p-5">
        {!showLoader && (
          <ChatInput
            sending={sending}
            onSend={() => sendMessage(value)}
            value={value}
            setValue={setValue}
            carpoolId={carpoolId}
          />
        )}
      </CustomView>
    </View>
  );
};

export default ChatPage;
