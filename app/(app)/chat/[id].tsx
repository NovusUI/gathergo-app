import ChatBackdrop from "@/components/ui/ChatBackdrop";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { safeGoBack, useLockedRouter } from "@/utils/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ActivityIndicator from "@/components/ui/AppLoader";
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomView from "@/components/View";
import RideVibeChatCard from "@/components/carpool/RideVibeChatCard";
import VibeCheckMessageCard from "@/components/carpool/VibeCheckMessageCard";
import VibeCheckModal from "@/components/carpool/VibeCheckModal";
import ChatInput from "@/components/inputs/ChatInput";
import ChatView1 from "@/components/ui/ChatView1";
import ImpactPageLoader from "@/components/ui/ImpactPageLoader";
import { TypingIndicator } from "@/components/ui/TypingIndicator";
import UserChatView from "@/components/ui/UserChatView";
import {
  getCarpoolVibeDialogMessages,
  getCarpoolVibeHandshakeInstruction,
  getCarpoolVibeMascotStyle,
  getCarpoolVibeSafetyRoleCopy,
  getCarpoolVibeSafetySignal,
  getCarpoolVibeSafetyTips,
  getCarpoolVehicleOption,
} from "@/constants/carpool";
import { useAuth } from "@/context/AuthContext";
import { useConversation } from "@/context/ConversationContext";
import { usePushNotification } from "@/context/PushNotificationContext";
import { useSocket } from "@/context/SocketContext";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useConversations } from "@/hooks/useSocketReactHook";
import { useGetCarpoolDetails } from "@/services/queries";
import {
  createVibeCheckChatMessage,
  getVibeCheckMessageDetails,
  useVibeCheckHandshake,
  type VibeCheckRole,
} from "@/hooks/useVibeCheckHandshake";
import { useVibeCheckPrompt } from "@/hooks/useVibeCheckPrompt";
import { pendingMessage, useMessageQueueStore } from "@/store/messageQueue";
import { showGlobalError } from "@/utils/globalErrorHandler";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { formatTo12Hour } from "@/utils/utils";

// Import the useCarpoolDetails hook
import { useCarpoolDetails } from "@/hooks/useCarpoolDetails";

const getPossibleVehicleIcon = (source: any) => {
  if (!source) return null;

  return (
    source.vehicleIcon ||
    source.vehicle_icon ||
    source.rideVibe ||
    source.ride_vibe ||
    source.vibe ||
    source.vehicle?.icon ||
    source.vehicle?.key ||
    source.ride?.vehicleIcon ||
    null
  );
};

const formatRideDepartureTime = (departureTime?: string | null) => {
  const trimmed = departureTime?.trim();
  if (!trimmed) return null;

  const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    return formatTo12Hour(
      `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`
    );
  }

  const parsedDate = new Date(trimmed);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return trimmed;
};

const ChatPage = () => {
  const { tw, color } = useAppTheme();
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

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conv: any) => String(conv.carpool?.id) === String(carpoolId)
      ) as any,
    [conversations, carpoolId]
  );

  const unreadCount = activeConversation?.unreadCount ?? 0;

  const [sending, setSending] = useState(false);
  const sendInProgress = useRef(false);
  const [rideVibeExpanded, setRideVibeExpanded] = useState(false);
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
  const { data: fullCarpoolDetailsResponse } = useGetCarpoolDetails(
    carpoolId || "",
    {
      enabled: Boolean(carpoolId),
    }
  );
  const fullCarpoolDetails = fullCarpoolDetailsResponse?.data;

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
    return () => {
      showSub.remove();
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
  }, [messages.length, isAtBottom]);

  const sendMessage = async (
    text: string,
    options: { clearComposer?: boolean } = {}
  ) => {
    // Prevent sending if user is not eligible
    if (!carpoolDetails?.canChat) {
      Alert.alert(
        "Cannot Send Message",
        carpoolDetails?.reason || "You are not eligible to chat in this carpool"
      );
      return;
    }

    if (!user || sendInProgress.current || text.trim().length === 0) return;
    sendInProgress.current = true;
    setSending(true);
    try {
      const queued = {
        tempId: `temp-${uuidv4()}`,
        content: text,
        carpoolId,
        senderId: user.id,
        createdAt: new Date().toISOString(),
        sender: { id: user.id, username: user.username ?? null },
        error: null,
      };
      await addMessage(queued);
      updateConversationAfterSend(carpoolId, pendingMessage(queued));
      const shouldClearComposer = options.clearComposer ?? true;
      if (shouldClearComposer) {
        setValue("");
        AsyncStorage.removeItem(getDraftKey(carpoolId)).catch(error =>
          console.error("Failed to clear chat draft", error));
      }
      requestAnimationFrame(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }));
    } catch (error) {
      console.error("Could not save pending message", error);
      Alert.alert("Message not queued", "Couldn't save your message. Your text is still here; please try again.");
    } finally {
      sendInProgress.current = false;
      setSending(false);
    }
  };

  const retryMessage = (tempId: string) => {
    if (!user) return;
    void useMessageQueueStore.getState().retryMessage(user.id, tempId).catch(error => {
      console.error("Could not retry message", error);
      showGlobalError("Couldn't queue this message for retry. Please try again.");
    });
  };

  const openCarpoolDetails = () => {
    if (!carpoolId) return;

    router.push(`/carpool/${carpoolId}`);
  };

  const hasCached = messages.length > 0;
  const showLoader = loadingInitial && !hasCached;

  const typingCount = typingUsers.length;
  const isTyping = typingCount > 0;

  let typingText = "";
  if (typingCount === 1) typingText = "1 person is typing";
  else if (typingCount === 2) typingText = "2 people are typing";
  else if (typingCount > 2) typingText = "Several people are typing";

  const rideVibeSource =
    getPossibleVehicleIcon(carpoolDetails) ||
    getPossibleVehicleIcon((carpoolDetails as any)?.carpool) ||
    getPossibleVehicleIcon(fullCarpoolDetails) ||
    getPossibleVehicleIcon(fullCarpoolDetails?.carpool) ||
    getPossibleVehicleIcon(activeConversation?.carpool) ||
    getPossibleVehicleIcon(activeConversation);
  const selectedVehicle = getCarpoolVehicleOption(rideVibeSource);
  const fullCarpool = (fullCarpoolDetails as any)?.carpool;
  const conversationCarpool = activeConversation?.carpool;
  const rideIconName = selectedVehicle?.iconName ?? "car-outline";
  const rideLabel = selectedVehicle?.label ?? "Shared ride";
  const eventTitle =
    carpoolDetails?.event?.name ||
    carpoolDetails?.event?.title ||
    carpoolDetails?.name ||
    "Carpool chat";
  const originLabel =
    carpoolDetails?.origin ||
    (fullCarpoolDetails as any)?.origin ||
    fullCarpool?.origin ||
    conversationCarpool?.origin ||
    null;
  const destinationLabel =
    fullCarpoolDetails?.destination ??
    (carpoolDetails?.event?.location ||
      (fullCarpoolDetails as any)?.event?.location ||
      fullCarpool?.event?.location ||
      conversationCarpool?.event?.location ||
      carpoolDetails?.event?.name ||
      (fullCarpoolDetails as any)?.event?.name ||
      (fullCarpoolDetails as any)?.event?.title ||
      fullCarpool?.event?.name ||
      fullCarpool?.event?.title ||
      conversationCarpool?.event?.name ||
      conversationCarpool?.event?.title ||
      "Event destination");
  const rawDepartureTime =
    carpoolDetails?.departureTime ||
      (fullCarpoolDetails as any)?.departureTime ||
      fullCarpool?.departureTime ||
      conversationCarpool?.departureTime;
  const departureTimeLabel = formatRideDepartureTime(rawDepartureTime);
  const safetyTips = useMemo(
    () => getCarpoolVibeSafetyTips(rideVibeSource),
    [rideVibeSource]
  );
  const safetySignal = useMemo(
    () => getCarpoolVibeSafetySignal(rideVibeSource),
    [rideVibeSource]
  );
  const rideVibeMascotStyle = useMemo(
    () => getCarpoolVibeMascotStyle(rideVibeSource),
    [rideVibeSource]
  );
  const userRole = getUserRole();
  const roleLabel =
    userRole === "driver"
      ? "Pooler"
      : userRole === "passenger"
        ? "Rider"
        : "Member";
  const vibeCheckRole: VibeCheckRole =
    userRole === "driver"
      ? "pooler"
      : userRole === "passenger"
        ? "rider"
        : "member";
  const handshakeInstruction = useMemo(
    () => getCarpoolVibeHandshakeInstruction(vibeCheckRole),
    [vibeCheckRole]
  );
  const rideVibeDialogMessages = useMemo(
    () =>
      getCarpoolVibeDialogMessages(rideVibeSource, {
        departureTime: departureTimeLabel,
        destination: destinationLabel,
        handshakeInstruction,
        pickupLocation: originLabel,
        safetySignal,
        safetyTips,
      }),
    [
      rideVibeSource,
      departureTimeLabel,
      destinationLabel,
      handshakeInstruction,
      originLabel,
      safetySignal,
      safetyTips,
    ]
  );
  const rideVibeDialogKey = useMemo(
    () =>
      rideVibeDialogMessages
        .map((message) => message.map((part) => part.text).join(""))
        .join("|"),
    [rideVibeDialogMessages]
  );
  const safetyCopy = useMemo(
    () => getCarpoolVibeSafetyRoleCopy(safetySignal, roleLabel, rideLabel),
    [safetySignal, roleLabel, rideLabel]
  );
  const vibeCheckPrompt = useVibeCheckPrompt({
    carpoolId,
    departureTime: rawDepartureTime,
    enabled: Boolean(carpoolDetails?.canChat),
    userId: user?.id,
  });
  const vibeCheckHandshake = useVibeCheckHandshake({
    carpoolId,
    departureTime: rawDepartureTime,
    driverId: carpoolDetails?.driverId,
    enabled: Boolean(carpoolDetails?.canChat),
    messages,
    passengers: carpoolDetails?.passengers,
    role: vibeCheckRole,
    socket,
    userId: user?.id,
  });
  const completeVibeCheck = (
    passengerId?: string,
    passengerLabel?: string | null
  ) => {
    const confirmation = vibeCheckHandshake.confirm({
      passengerId,
      passengerLabel,
      signalAction:
        vibeCheckRole === "pooler"
          ? safetySignal.driverAction
          : safetySignal.passengerAction,
      signalTitle: safetySignal.title,
    });
    if (!confirmation) return;

    sendMessage(
      createVibeCheckChatMessage(vibeCheckRole, safetySignal, {
        passengerId: confirmation.passengerId,
        passengerLabel: confirmation.passengerLabel,
      }),
      {
        clearComposer: false,
      }
    );
  };
  const renderMessage = ({ item }: { item: any }) => {
    const isUser = item.senderId === user?.id;
    const vibeCheckMessageDetails = getVibeCheckMessageDetails(item.content);
    const messageTime = new Date(item.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (vibeCheckMessageDetails) {
      const messagePassengerId =
        vibeCheckMessageDetails.passengerId ||
        (item.senderId === carpoolDetails?.driverId ? user?.id : item.senderId);
      const messageHandshake =
        vibeCheckHandshake.getPassengerHandshake(messagePassengerId);
      const needsConfirmation =
        !isUser &&
        vibeCheckRole !== "member" &&
        Boolean(messageHandshake) &&
        (vibeCheckRole === "pooler"
          ? vibeCheckMessageDetails.actorLabel === "Rider" &&
            !messageHandshake?.poolerConfirmed
          : vibeCheckMessageDetails.actorLabel === "Pooler" &&
            (!vibeCheckMessageDetails.passengerId ||
              vibeCheckMessageDetails.passengerId === user?.id) &&
            !messageHandshake?.riderConfirmed);

      return (
        <VibeCheckMessageCard
          actorLabel={vibeCheckMessageDetails.actorLabel}
          isComplete={Boolean(messageHandshake?.isComplete)}
          needsConfirmation={needsConfirmation}
          rideIconName={rideIconName}
          signalAction={vibeCheckMessageDetails.signalAction}
          signalTitle={vibeCheckMessageDetails.signalTitle}
          time={messageTime}
          optimistic={item.optimistic}
          error={item.error}
          onRetry={() => retryMessage(item.id)}
          onPress={vibeCheckPrompt.open}
        />
      );
    }

    if (isUser) {
      return (
        <UserChatView
          message={item.content}
          time={messageTime}
          optimistic={item.optimistic}
          error={item.error}
          onRetry={() => retryMessage(item.id)}
          rideIconName={rideIconName}
        />
      );
    }

    // Get sender's profile image
    const senderImage = getSenderAvatar(item.senderId);

    return (
      <ChatView1
        message={item.content}
        time={messageTime}
        imageUrl={senderImage}
      />
    );
  };

  // Show loading state while checking eligibility
  if (isLoadingCarpoolDetails) {
    return (
      <ImpactPageLoader
        title="Opening ride chat"
        message="Checking the ride vibe, safety flow, and conversation access."
      />
    );
  }

  // Show error state if carpool details failed to load
  if (carpoolError) {
    return (
      <View
        style={tw`flex-1 pt-10 bg-background dark:bg-[#01082E] justify-center items-center p-5`}
      >
        <Text style={tw`text-foreground dark:text-white text-lg mb-4 text-center`}>
          Unable to load carpool details
        </Text>
        <TouchableOpacity
          onPress={() => refetchCarpoolDetails()}
          style={tw`bg-info dark:bg-blue-500 px-6 py-3 rounded-full`}
        >
          <Text style={tw`text-onPrimary dark:text-white`}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => safeGoBack(router, "/conversations")}
          style={tw`mt-4 px-6 py-3 rounded-full border border-borderStrong dark:border-white`}
        >
          <Text style={tw`text-foreground dark:text-white`}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check if user is a member (even if canChat is false)
  if (carpoolDetails && !isUserMember()) {
    return (
      <View
        style={tw`flex-1 pt-10 bg-background dark:bg-[#01082E] justify-center items-center p-5`}
      >
        <Text style={tw`text-foreground dark:text-white text-lg mb-4 text-center`}>
          You are not a member of this carpool
        </Text>
        <TouchableOpacity
          onPress={() => safeGoBack(router, "/conversations")}
          style={tw`bg-info dark:bg-blue-500 px-6 py-3 rounded-full`}
        >
          <Text style={tw`text-onPrimary dark:text-white`}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-background dark:bg-[#01082E]`}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
    >
      <SafeAreaView edges={["top"]} style={tw`flex-1 w-full max-w-[840px] self-center bg-background dark:bg-[#01082E]`}>
        <CustomView className="max-w-full" style={tw`px-3`}>
          <CustomeTopBarNav
            title={eventTitle}
            onClickBack={() => safeGoBack(router, "/conversations")}
            rightNode={
              isLoadingCarpoolDetails ? (
                <ActivityIndicator
                  size={32}
                  accessibilityLabel="Loading ride details"
                />
              ) : (
                <TouchableOpacity
                  accessibilityLabel={
                    rideVibeExpanded ? "Collapse ride vibe" : "View ride details"
                  }
                  accessibilityRole="button"
                  activeOpacity={0.86}
                  disabled={!carpoolId && !rideVibeExpanded}
                  onPress={
                    rideVibeExpanded
                      ? () => setRideVibeExpanded(false)
                      : openCarpoolDetails
                  }
                  style={[
                    tw`w-11 h-11 rounded-full items-center justify-center border`,
                    rideVibeExpanded
                      ? tw`bg-danger/12 dark:bg-[#FF6B6B]/12 border-danger/25 dark:border-[#FF6B6B]/25`
                      : tw`bg-accentFill/12 dark:bg-[#0FF1CF]/12 border-accent/25 dark:border-[#0FF1CF]/25`,
                  ]}
                >
                  <Ionicons
                    name={rideVibeExpanded ? "close" : rideIconName}
                    size={rideVibeExpanded ? 22 : 24}
                    color={rideVibeExpanded ? color("#FF6B6B", "danger") : color("#0FF1CF", "accent")}
                  />
                </TouchableOpacity>
              )
            }
          />
        </CustomView>

        {carpoolDetails && (
          <View style={tw`px-4 mt-4 mb-4`}>
            <RideVibeChatCard
              dialogKey={rideVibeDialogKey}
              dialogMessages={rideVibeDialogMessages}
              expanded={rideVibeExpanded}
              iconName={rideIconName}
              label={rideLabel}
              mascotStyle={rideVibeMascotStyle}
              onOpenVibeCheck={vibeCheckPrompt.open}
              onToggle={() => setRideVibeExpanded((current) => !current)}
              vibeCheckButtonLabel={
                vibeCheckRole === "pooler" &&
                vibeCheckHandshake.passengerCount === 0
                  ? "Waiting for riders"
                  : vibeCheckHandshake.isComplete
                  ? `${safetySignal.title} complete`
                  : vibeCheckHandshake.currentUserConfirmed
                    ? `Waiting for ${vibeCheckHandshake.waitingForLabel}`
                    : `Complete ${safetySignal.title}`
              }
              roleLabel={roleLabel}
              safetySignal={safetySignal}
            />
          </View>
        )}

        {carpoolDetails &&
          !carpoolDetails.canChat &&
          Boolean(carpoolDetails.reason) && (
            <View
              style={tw`mx-4 p-3 rounded-2xl mb-4 bg-dangerSoft dark:bg-[#4A1320] border border-danger/30 dark:border-[#F87171]/30`}
            >
              <Text style={tw`text-foreground dark:text-white text-center font-semibold`}>
                Chat Restricted: {carpoolDetails.reason}
              </Text>
            </View>
          )}

        <View style={tw`w-full flex-1 bg-chatBackground`}>
          <ChatBackdrop />
          {showLoader ? (
            <ActivityIndicator
              size="large"
              accessibilityLabel="Loading messages"
              style={tw`flex-1`}
            />
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
                <View
                  style={tw`flex-1 items-center justify-center py-12 px-5`}
                >
                  <View
                    style={tw`w-full rounded-[28px] bg-surface dark:bg-[#07143B] border border-border dark:border-[#1B2A50] p-6 items-center`}
                  >
                    <View
                      style={tw`w-16 h-16 rounded-2xl bg-accentFill/12 dark:bg-[#0FF1CF]/12 items-center justify-center border border-accent/20 dark:border-[#0FF1CF]/20`}
                    >
                      <Ionicons
                        name={rideIconName}
                        size={34}
                        color={color("#0FF1CF", "accent")}
                      />
                    </View>
                    <Text style={tw`text-foreground dark:text-white mt-4 font-semibold text-base`}>
                      {safetyCopy.emptyChatTitle}
                    </Text>
                    <Text
                      style={tw`text-secondary dark:text-[#A8BAE4] text-sm mt-2 text-center leading-5`}
                    >
                      {safetyCopy.emptyChatBody}
                    </Text>
                  </View>
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
            style={tw`absolute bottom-32 right-5 bg-accentFill dark:bg-[#0FF1CF] rounded-full h-11 w-11 flex-row items-center justify-center border border-borderStrong/20 dark:border-white/20`}
          >
            <Ionicons name="arrow-down" size={18} color={color("#01082E", "onAccent")} />
            {unreadCount > 0 && (
              <View
                style={tw`absolute -top-1 -right-1 rounded-full min-w-[18px] h-[18px] bg-surface dark:bg-white flex-row items-center justify-center`}
              >
                <Text style={tw`text-onAccent dark:text-[#350342] text-xs`}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        <View
          style={[
            tw`w-full min-h-28 p-5 bg-surface dark:bg-[#07143B] border-t border-border dark:border-[#1B2A50]`,
          ]}
        >
          {!showLoader && carpoolDetails?.canChat && (
            <ChatInput
              sending={sending}
              onSend={() => sendMessage(value)}
              onFocus={() => setRideVibeExpanded(false)}
              value={value}
              setValue={setValue}
              carpoolId={carpoolId}
              disabled={!carpoolDetails?.canChat}
            />
          )}

          {/* Show message if user can't chat */}
          {carpoolDetails && !carpoolDetails.canChat && (
            <View
              style={tw`bg-surface dark:bg-[#101C45] p-4 rounded-2xl border border-border dark:border-[#1B2A50]`}
            >
              <Text style={tw`text-foreground dark:text-white text-center`}>
                {carpoolDetails.reason ||
                  "Chat is not available for this carpool"}
              </Text>
            </View>
          )}
        </View>

        <VibeCheckModal
          visible={vibeCheckPrompt.visible}
          iconName={rideIconName}
          mascotStyle={rideVibeMascotStyle}
          rideLabel={rideLabel}
          roleLabel={roleLabel}
          safetySignal={safetySignal}
          vibeCheck={{
            completedCount: vibeCheckHandshake.completedCount,
            currentUserConfirmed: vibeCheckHandshake.currentUserConfirmed,
            isComplete: vibeCheckHandshake.isComplete,
            onConfirm: completeVibeCheck,
            passengerCount: vibeCheckHandshake.passengerCount,
            passengerHandshakes: vibeCheckHandshake.passengerHandshakes,
            poolerConfirmed: vibeCheckHandshake.poolerConfirmed,
            riderConfirmed: vibeCheckHandshake.riderConfirmed,
            role: vibeCheckHandshake.role,
            waitingForLabel: vibeCheckHandshake.waitingForLabel,
          }}
          onClose={vibeCheckPrompt.dismiss}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default ChatPage;
