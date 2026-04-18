import { useLocalSearchParams, useRouter } from "expo-router";
import { useLockedRouter } from "@/utils/navigation";
import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ActivityIndicator from "@/components/ui/AppLoader";
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  KeyboardEvent,
  Platform,
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
import { useConversation } from "@/context/ConversationContext";
import { usePushNotification } from "@/context/PushNotificationContext";
import { useSocket } from "@/context/SocketContext";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useConversations } from "@/hooks/useSocketReactHook";
import { safeGoBack } from "@/utils/navigation";
import { useMessageQueueStore } from "@/store/messageQueue";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react-native";
import tw from "twrnc";

// Import the useCarpoolDetails hook
import { useCarpoolDetails } from "@/hooks/useCarpoolDetails";

const ChatPage = () => {
  const router = useLockedRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const [value, setValue] = useState("");
  const carpoolId = Array.isArray(id) ? id[0] : id;
  const { socket } = useSocket();
  const { updateConversationAfterSend } = useConversation();
  const { clearNotificationData } = usePushNotification();
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const draftLoadedRef = useRef(false);

  const flatListRef = useRef<FlatList>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const SCROLL_THRESHOLD = 80;
  const getDraftKey = (chatId: string) => `chat_draft_${chatId}`;

  // Use the useCarpoolDetails hook to fetch carpool chat details
  const {
    data: carpoolDetails,
    isLoading: isLoadingCarpoolDetails,
    error: carpoolError,
    refetch: refetchCarpoolDetails,
  } = useCarpoolDetails(carpoolId);

  // Extract user's role in the carpool
  const getUserRole = () => {
    if (!carpoolDetails || !user) return null;

    if (carpoolDetails.driverId === user.id) {
      return "driver";
    }

    const passenger = carpoolDetails.passengers.find((p) => p.id === user.id);
    return passenger ? "passenger" : null;
  };

  // Check if user is a member of this carpool
  const isUserMember = () => {
    if (!carpoolDetails || !user) return false;

    return (
      carpoolDetails.driverId === user.id ||
      carpoolDetails.passengers.some((p) => p.id === user.id)
    );
  };

  // Extract participant images from carpool details
  const getParticipantImages = () => {
    if (!carpoolDetails) return [];

    const images: Array<string | null | undefined> = [];

    // Add driver's avatar if not current user
    if (carpoolDetails.driver.id !== user?.id) {
      images.push(carpoolDetails.driver.avatar || null);
    }

    // Add passengers' avatars (only accepted ones)
    carpoolDetails.passengers
      .filter((p) => p.id !== user?.id && p.status === "ACCEPTED")
      .forEach((p) => {
        images.push(p.avatar || null);
      });

    // Limit to 4 images for the OverlappingImages component
    return images.slice(0, 4);
  };

  // Get sender's avatar for chat messages
  const getSenderAvatar = (senderId: string) => {
    if (!carpoolDetails) return null;

    if (senderId === carpoolDetails.driverId) {
      return carpoolDetails.driver.avatar || null;
    }

    const passenger = carpoolDetails.passengers.find((p) => p.id === senderId);
    return passenger?.avatar || null;
  };

  // Show alert if user is not eligible to chat
  useEffect(() => {
    if (carpoolDetails && !carpoolDetails.canChat && carpoolDetails.reason) {
      Alert.alert("Chat Not Available", carpoolDetails.reason, [
        {
          text: "OK",
          onPress: () => safeGoBack(router, "/conversations"),
          style: "default",
        },
        {
          text: "Refresh",
          onPress: () => refetchCarpoolDetails(),
          style: "cancel",
        },
      ]);
    }
  }, [carpoolDetails, router, refetchCarpoolDetails]);

  const handleScroll = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const nearBottom = y < SCROLL_THRESHOLD;
    setIsAtBottom(nearBottom);
  };

  useEffect(() => {
    const loadDraft = async () => {
      if (!carpoolId) return;
      try {
        const savedDraft = await AsyncStorage.getItem(getDraftKey(carpoolId));
        if (savedDraft) {
          setValue(savedDraft);
        }
      } catch (error) {
        console.log("failed to load chat draft", error);
      } finally {
        draftLoadedRef.current = true;
      }
    };

    draftLoadedRef.current = false;
    loadDraft();
  }, [carpoolId]);

  useEffect(() => {
    if (!carpoolId || !draftLoadedRef.current) return;
    const timeout = setTimeout(async () => {
      try {
        if (value.trim().length === 0) {
          await AsyncStorage.removeItem(getDraftKey(carpoolId));
        } else {
          await AsyncStorage.setItem(getDraftKey(carpoolId), value);
        }
      } catch (error) {
        console.log("failed to save chat draft", error);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [value, carpoolId]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      });
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    const frameSub = Keyboard.addListener(
      "keyboardDidChangeFrame",
      (event: KeyboardEvent) => {
        setKeyboardHeight(event.endCoordinates?.height ?? 0);
      }
    );
    const showHeightSub = Keyboard.addListener(
      "keyboardDidShow",
      (event: KeyboardEvent) => {
        setKeyboardHeight(event.endCoordinates?.height ?? 0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
      frameSub.remove();
      showHeightSub.remove();
    };
  }, []);

  useEffect(() => {
    console.log(messages.length, "message length");
    if (
      !socket ||
      !carpoolId ||
      messages.length === 0 ||
      !isAtBottom ||
      isLoadingCarpoolDetails || // ← Check if still loading
      (carpoolDetails && !carpoolDetails.canChat) // ← Only check if loaded
    )
      return;

    const t = setTimeout(() => {
      socket.emit("markMsgAsRead", { carpoolId });
    }, 300);

    return () => clearTimeout(t);
  }, [
    messages.length,
    socket,
    carpoolId,
    isAtBottom,
    carpoolDetails,
    isLoadingCarpoolDetails,
  ]);

  useEffect(() => {
    // Clear any pending notification data when chat screen is opened
    clearNotificationData();
  }, [carpoolId, clearNotificationData]);

  useEffect(() => {
    if (
      !socket ||
      !carpoolId ||
      isLoadingCarpoolDetails ||
      (carpoolDetails && carpoolDetails.canChat === false)
    ) {
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
  }, [socket, carpoolId, carpoolDetails, isLoadingCarpoolDetails]);

  useEffect(() => {
    if (isAtBottom) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      });
    }
  }, [messages.length]);

  const sendMessage = async (text: string) => {
    // Prevent sending if user is not eligible
    if (!carpoolDetails?.canChat) {
      Alert.alert(
        "Cannot Send Message",
        carpoolDetails?.reason || "You are not eligible to chat in this carpool"
      );
      return;
    }

    if (!socket || text.trim().length === 0) return;
    setSending(true);

    const optimistic = {
      id: `temp-${Date.now()}`,
      content: text,
      carpoolId,
      senderId: user?.id,
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id,
        username: user?.username,
        // Add user's role for display
        role: getUserRole(),
      },
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
    if (carpoolId) {
      AsyncStorage.removeItem(getDraftKey(carpoolId)).catch((error) =>
        console.log("failed to clear chat draft", error)
      );
    }

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
      Alert.alert("Error", "Failed to send message");
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

    // Get sender's profile image
    const senderImage = getSenderAvatar(item.senderId);

    return (
      <ChatView1
        message={item.content}
        time={new Date(item.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
        imageUrl={senderImage}
      />
    );
  };

  // Show loading state while checking eligibility
  if (isLoadingCarpoolDetails) {
    return (
      <View style={tw`flex-1 pt-10 bg-[#01082E] justify-center items-center`}>
        <ActivityIndicator tone="accent" size="large" />
        <Text style={tw`text-white mt-4`}>Loading carpool details...</Text>
      </View>
    );
  }

  // Show error state if carpool details failed to load
  if (carpoolError) {
    return (
      <View
        style={tw`flex-1 pt-10 bg-[#01082E] justify-center items-center p-5`}
      >
        <Text style={tw`text-white text-lg mb-4 text-center`}>
          Unable to load carpool details
        </Text>
        <TouchableOpacity
          onPress={() => refetchCarpoolDetails()}
          style={tw`bg-blue-500 px-6 py-3 rounded-full`}
        >
          <Text style={tw`text-white`}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => safeGoBack(router, "/conversations")}
          style={tw`mt-4 px-6 py-3 rounded-full border border-white`}
        >
          <Text style={tw`text-white`}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check if user is a member (even if canChat is false)
  if (carpoolDetails && !isUserMember()) {
    return (
      <View
        style={tw`flex-1 pt-10 bg-[#01082E] justify-center items-center p-5`}
      >
        <Text style={tw`text-white text-lg mb-4 text-center`}>
          You are not a member of this carpool
        </Text>
        <TouchableOpacity
          onPress={() => safeGoBack(router, "/conversations")}
          style={tw`bg-blue-500 px-6 py-3 rounded-full`}
        >
          <Text style={tw`text-white`}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-[#01082E]`}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
    >
      <View style={tw`flex-1 pt-10 bg-[#01082E]`}>
      <CustomView
        style={tw`px-3 flex-row justify-between items-center relative`}
      >
        <CustomeTopBarNav
          title={carpoolDetails?.event?.name || carpoolDetails?.name || "Chat"}
          onClickBack={() => safeGoBack(router, "/conversations")}
        />

        {/* Display carpool participant images */}
        {isLoadingCarpoolDetails ? (
          <View
            style={tw`absolute right-4 w-16 h-8 bg-gray-700 rounded-full animate-pulse`}
          />
        ) : (
          <OverlappingImages
            images={getParticipantImages()}
            className={`absolute right-4`}
          />
        )}
      </CustomView>

      <View style={tw`h-px w-full bg-white my-5`} />

      {/* Show carpool info header */}
      {carpoolDetails && (
        <View style={tw`px-4 mb-4`}>
          <Text style={tw`text-white text-lg font-semibold`}>
            {carpoolDetails.event?.name || carpoolDetails.name}
          </Text>
          <Text style={tw`text-gray-400 text-sm`}>
            {getUserRole() === "driver" ? "Driver" : "Passenger"} •{" "}
            {carpoolDetails.status.toLowerCase()}
          </Text>
          {Boolean(carpoolDetails.expiresAt) && (
            <Text style={tw`text-yellow-400 text-xs mt-1`}>
              Chat expires:{" "}
              {new Date(carpoolDetails.expiresAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      )}

      {/* Show eligibility status banner if not fully eligible */}
      {carpoolDetails &&
        !carpoolDetails.canChat &&
        Boolean(carpoolDetails.reason) && (
        <View style={tw`bg-red-500 mx-4 p-3 rounded-lg mb-4`}>
          <Text style={tw`text-white text-center font-semibold`}>
            Chat Restricted: {carpoolDetails.reason}
          </Text>
        </View>
      )}

      <View style={tw`w-full max-w-[500px] flex-1`}>
        {showLoader ? (
          <ChatSkeleton />
        ) : (
          <FlatList
            ref={flatListRef}
            inverted
            keyboardShouldPersistTaps="handled"
            data={messages}
            keyExtractor={(item) => `msg-${item.id}`}
            renderItem={renderMessage}
            onScroll={handleScroll}
            onEndReached={() => hasMore && loadMore()}
            onEndReachedThreshold={0.1}
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingBottom: 12,
              flexGrow: messages.length === 0 ? 1 : undefined,
            }}
            ListEmptyComponent={
              <View style={tw`flex-1 items-center justify-center py-12`}>
                <MessageCircle size={42} color="#8FA5E2" />
                <Text style={tw`text-white mt-3 font-semibold`}>
                  No messages yet
                </Text>
                <Text style={tw`text-gray-400 text-sm mt-1 text-center px-8`}>
                  Start the conversation with a quick message.
                </Text>
              </View>
            }
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator tone="accent" style={tw`py-3`} />
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
          style={tw`absolute bottom-32 right-5 bg-blue-500 rounded-full h-10 w-10 flex-row items-center justify-center`}
        >
          <Text style={tw`text-white text-lg`}>↓</Text>
          {unreadCount > 0 && (
            <View
              style={tw`absolute top-0 right-0 rounded-full min-w-[16px] h-4 bg-white flex-row items-center justify-center`}
            >
              <Text style={tw`text-[#350342] text-xs`}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      <CustomView
        style={[
          tw`min-h-28 p-5`,
          Platform.OS === "android" && keyboardHeight > 0
            ? { paddingBottom: keyboardHeight + 12 }
            : null,
        ]}
      >
        {!showLoader && carpoolDetails?.canChat && (
          <ChatInput
            sending={sending}
            onSend={() => sendMessage(value)}
            value={value}
            setValue={setValue}
            carpoolId={carpoolId}
            disabled={!carpoolDetails?.canChat}
          />
        )}

        {/* Show message if user can't chat */}
        {carpoolDetails && !carpoolDetails.canChat && (
          <View style={tw`bg-gray-800 p-4 rounded-lg`}>
            <Text style={tw`text-white text-center`}>
              {carpoolDetails.reason ||
                "Chat is not available for this carpool"}
            </Text>
          </View>
        )}
      </CustomView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatPage;
