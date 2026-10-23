import { useAppTheme } from "@/hooks/useAppTheme";
import AvatarGroup from "@/components/AvatarGroup";
import AvatarWithLabel from "@/components/AvatarWithLabel";
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import PoolingWithA from "@/components/PoolingWithA";
import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import ImpactPageLoader from "@/components/ui/ImpactPageLoader";
import {
  getCarpoolPassengerMessage,
  getCarpoolVehicleOption,
  getCarpoolVibeSafetyTips,
  type CarpoolVibeSafetyTip,
} from "@/constants/carpool";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import {
  useFollowUser,
  useLeaveCarpool,
  useRequestCarpoolAfterCancel,
} from "@/services/mutations";
import { useGetCarpoolDetails } from "@/services/queries";
import { QUERY_KEYS } from "@/services/queryKeys";
import {
  showGlobalError,
  showGlobalSuccess,
  showGlobalWarning,
} from "@/utils/globalErrorHandler";
import { isEventPastEnd } from "@/utils/dateTimeHandler";
import { safeGoBack, useLockedRouter } from "@/utils/navigation";
import { dummy, formatTo12Hour } from "@/utils/utils";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { MessagesSquareIcon } from "lucide-react-native";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import CancelCarpoolModal from "./CancelCarpoolModal";
import EditRideBS, { EditRideBSRef } from "./bottomSheets/EditRideBS";
import FlexrideBS, { FlexrideBSRef } from "./bottomSheets/FlexrideBS";
import SendRequestBS, { SendRequestBSRef } from "./bottomSheets/SendRequestBS";
import ShareRideLinkBS, {
  ShareRideBSRef,
} from "./bottomSheets/ShareRideLinkBS";
import ViewRequestBS, { ViewRequestBSRef } from "./bottomSheets/ViewRequestBS";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const formatRideDepartureTime = (departureTime?: string | null) => {
  const trimmed = departureTime?.trim();
  if (!trimmed) return "Time pending";

  const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    return formatTo12Hour(`${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`);
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

const formatRideStatus = (status?: string | null) =>
  status ? status.toLowerCase().replace(/_/g, " ") : "active";

const RidePill = ({
  iconName,
  label,
  value,
}: {
  iconName: IoniconName;
  label: string;
  value: string;
}) => {
  const { tw, color } = useAppTheme();
  return ((
  <View style={tw`flex-1 min-w-[125px] rounded-2xl bg-surface dark:bg-[#101C45] p-3`}>
    <View style={tw`flex-row items-center gap-2`}>
      <Ionicons name={iconName} size={15} color={color("#0FF1CF", "accent")} />
      <Text style={tw`text-secondary dark:text-[#8FA5E2] text-xs`}>{label}</Text>
    </View>
    <Text style={tw`text-foreground dark:text-white text-sm font-semibold mt-2`} numberOfLines={1}>
      {value}
    </Text>
  </View>
));
};

const RouteStop = ({
  accent,
  label,
  value,
}: {
  accent: string;
  label: string;
  value: string;
}) => {
  const { tw } = useAppTheme();
  return ((
  <View style={tw`flex-row gap-3`}>
    <View
      style={[tw`w-3 h-3 rounded-full mt-1`, { backgroundColor: accent }]}
    />
    <View style={tw`flex-1 min-w-0`}>
      <Text style={tw`text-secondary dark:text-[#8FA5E2] text-xs`}>{label}</Text>
      <Text style={tw`text-foreground dark:text-white text-sm leading-5`} numberOfLines={2}>
        {value}
      </Text>
    </View>
  </View>
));
};

const SafetyTipRow = ({ tip }: { tip: CarpoolVibeSafetyTip }) => {
  const { tw, color } = useAppTheme();
  return ((
  <View style={tw`flex-row gap-3`}>
    <View
      style={tw`w-9 h-9 rounded-full bg-accentFill/10 dark:bg-[#0FF1CF]/10 items-center justify-center`}
    >
      <Ionicons name={tip.iconName} size={17} color={color("#0FF1CF", "accent")} />
    </View>
    <View style={tw`flex-1 min-w-0`}>
      <Text style={tw`text-foreground dark:text-white text-sm font-semibold`}>{tip.title}</Text>
      <Text style={tw`text-secondary dark:text-[#A8BAE4] text-xs leading-5 mt-1`}>{tip.body}</Text>
    </View>
  </View>
));
};

const CarpoolPage = () => {
  const { tw, color } = useAppTheme();
  const { id } = useLocalSearchParams();
  const carpoolId = Array.isArray(id) ? id[0] : id;
  const router = useLockedRouter();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [existingCarpoolInfo, setExistingCarpoolInfo] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [requestFormData, setRequestFormData] = useState<{
    origin: string;
    note?: string;
    startPoint?: { lng: number; lat: number };
  } | null>(null);
  const [showFloatingChat, setShowFloatingChat] = useState(false);

  const queryClient = useQueryClient();

  const { data, isPending, error } = useGetCarpoolDetails(carpoolId);
  const { mutateAsync, isPending: leavingCarpool } = useLeaveCarpool(
    carpoolId,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.carpoolDetails, carpoolId],
        });
        showGlobalSuccess("Left carpool succesfully");
      },
      onError: () => {},
    }
  );

  const { mutateAsync: followPooler, isPending: isFollowing } = useFollowUser({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.carpoolDetails, carpoolId],
      });
      showGlobalSuccess("User followed");
    },
    onError: () => {},
  });

  const {
    mutateAsync: requestAfterCancel,
    isPending: requestAfterCancelPending,
  } = useRequestCarpoolAfterCancel(carpoolId, {
    onSuccess: (data) => {
      console.log(data);
      showGlobalSuccess("Existing carpool cancelled and new request sent!");
      setShowCancelModal(false);
      // Invalidate queries to refresh the carpool data
      setExistingCarpoolInfo(null);
      setRequestFormData(null);

      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.carpoolDetails, carpoolId],
      });
    },
    onError: (e) => {
      console.log(e);
      showGlobalError("Failed to cancel carpool and request ride");
    },
  });
  // Function to handle when user has an existing carpool
  const handleHasExistingCarpool = (response: any) => {
    setExistingCarpoolInfo(response);
    setShowCancelModal(true);

    console.log(response);

    // Store the form data for later use if they choose to cancel and request
    setRequestFormData({
      origin: response.data.targetCarpool?.origin || "",
      note: response.data.targetCarpool?.note || "",
      startPoint: response.data.targetCarpool?.startPoint,
    });
  };

  const handleCancelAndRequest = async () => {
    if (!existingCarpoolInfo?.data.existingCarpool?.id || !requestFormData) {
      console.log("preventin");
      return;
    }
    console.log("what's happening");
    const payload = {
      cancelCarpoolId: existingCarpoolInfo.data.existingCarpool.id,
      origin: requestFormData.origin,
      note: requestFormData.note,
      ...(requestFormData.startPoint
        ? { startPoint: requestFormData.startPoint }
        : {}),
    };
    console.log(payload);

    await requestAfterCancel(payload);
  };

  const handleKeepCarpool = () => {
    setShowCancelModal(false);
    setExistingCarpoolInfo(null);
    setRequestFormData(null);

    sendReqRef.current?.close();
  };

  //bottomsheets ref
  const editRideRef = useRef<EditRideBSRef>(null);
  const flexrideRef = useRef<FlexrideBSRef>(null);
  const requestBSRef = useRef<ViewRequestBSRef>(null);
  const sendReqRef = useRef<SendRequestBSRef>(null);
  const shareRideLinkRef = useRef<ShareRideBSRef>(null);
  const chatAnchorFrameRef = useRef<{ y: number; height: number } | null>(null);
  const scrollMetricsRef = useRef({ offsetY: 0, viewportHeight: 0 });

  const openChat = useCallback(() => {
    if (!carpoolId) return;

    router.replace(`/chat/${carpoolId}`);
  }, [carpoolId, router]);

  const syncFloatingChatVisibility = useCallback(() => {
    const frame = chatAnchorFrameRef.current;
    const { offsetY, viewportHeight } = scrollMetricsRef.current;

    if (!frame || viewportHeight <= 0) {
      setShowFloatingChat(false);
      return;
    }

    const viewportTop = offsetY;
    const viewportBottom = offsetY + viewportHeight;
    const isChatButtonVisible =
      frame.y + frame.height > viewportTop + 12 &&
      frame.y < viewportBottom - 12;

    setShowFloatingChat((current) =>
      current === !isChatButtonVisible ? current : !isChatButtonVisible
    );
  }, []);

  const handleScrollViewLayout = useCallback(
    (event: LayoutChangeEvent) => {
      scrollMetricsRef.current = {
        ...scrollMetricsRef.current,
        viewportHeight: event.nativeEvent.layout.height,
      };
      syncFloatingChatVisibility();
    },
    [syncFloatingChatVisibility]
  );

  const handleRideDetailsScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollMetricsRef.current = {
        offsetY: event.nativeEvent.contentOffset.y,
        viewportHeight: event.nativeEvent.layoutMeasurement.height,
      };
      syncFloatingChatVisibility();
    },
    [syncFloatingChatVisibility]
  );

  const handleChatAnchorLayout = useCallback(
    (event: LayoutChangeEvent) => {
      chatAnchorFrameRef.current = event.nativeEvent.layout;
      syncFloatingChatVisibility();
    },
    [syncFloatingChatVisibility]
  );

  const status = useMemo(() => {
    if (data && data?.data.passengers.length > 0) {
      const passenger = data?.data.passengers.find(
        (pass: any) => pass.user.id === user?.id
      );
      return passenger?.status ?? null;
    }
    return null;
  }, [data, user?.id]);

  useEffect(() => {
    console.log(data?.data);
  }, [data]);

  useEffect(() => {
    if (!socket || !carpoolId) return;

    const handleCarpoolUpdated = (payload: { carpoolId: string }) => {
      if (payload.carpoolId !== carpoolId) return;

      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.carpoolDetails, carpoolId],
      });
    };

    socket.on("carpoolUpdated", handleCarpoolUpdated);

    return () => {
      socket.off("carpoolUpdated", handleCarpoolUpdated);
    };
  }, [socket, carpoolId, queryClient]);

  const onAvaterClick = () => {
    if (owner) {
      requestBSRef.current?.open();
    } else {
      shareRideLinkRef.current?.open();
    }
  };

  if (isPending) {
    return (
      <ImpactPageLoader
        title="Mapping your ride"
        message="Loading the route, seats, vibe, and safety signals."
      />
    );
  }

  if (error || !data) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-background dark:bg-[#01082E]`}>
        <Text style={tw`text-foreground dark:text-white`}>Failed to load carpool</Text>
      </View>
    );
  }

  const carpool = data.data;
  const owner = carpool.driver.id === user?.id;
  const eventHasEnded = isEventPastEnd(
    carpool.event?.startDate,
    carpool.event?.endDate
  );
  const rideUnavailable = carpool.status !== "ACTIVE";
  const isFollowingDriver = carpool.isFollowingDriver;
  const isFollowedByDriver = carpool.isFollowedByDriver;
  const selectedVehicle = getCarpoolVehicleOption(carpool.vehicleIcon);
  const rideIconName = selectedVehicle?.iconName ?? "car-outline";
  const rideLabel = selectedVehicle?.label ?? "Shared ride";
  const departureTimeLabel = formatRideDepartureTime(carpool.departureTime);
  const destinationLabel =
    carpool.destination ?? carpool.event?.location ?? "Destination not set";
  const acceptedPassengerCount = carpool.passengers.filter(
    (passenger: any) => passenger.status === "ACCEPTED"
  ).length;
  const crewCount = acceptedPassengerCount + 1;
  const seatsLeft =
    typeof carpool.seatsLeft === "number"
      ? carpool.seatsLeft
      : carpool.availableSeats;
  const seatLabel =
    typeof seatsLeft === "number"
      ? `${seatsLeft} seat${seatsLeft === 1 ? "" : "s"} left`
      : `${crewCount} rider${crewCount === 1 ? "" : "s"}`;
  const priceLabel =
    Number(carpool.pricePerSeat) > 0 ? `₦${carpool.pricePerSeat}` : "Free";
  const rideCopy = selectedVehicle
    ? owner
      ? "This is the ride vibe riders see in chat and on carpool cards."
      : getCarpoolPassengerMessage(selectedVehicle.key)
    : owner
    ? "Pick a ride vibe so this carpool has a little more personality."
    : "This shared ride is ready for pickup details, timing, and quick confirmations.";
  const safetyTips = getCarpoolVibeSafetyTips(carpool.vehicleIcon);
  const followStatus = isFollowingDriver
    ? "Following"
    : isFollowedByDriver
    ? "Follow back"
    : "Follow";

  const onFollow = () => {
    if (["Follow back", "Follow"].includes(followStatus)) {
      followPooler({
        followingId: carpool.driver.id,
      });
    } else {
    }
  };
  const getButtonProps = () => {
    if (eventHasEnded) {
      return { title: "Event ended", disabled: true, action: null };
    }

    if (rideUnavailable) {
      return { title: "Unavailable", disabled: true };
    }

    switch (status) {
      case "PENDING":
        return { title: "Request Pending", disabled: true, action: null };
      case "ACCEPTED":
        return {
          title: confirmLeave ? "Are you sure ?" : "Leave Ride",
          disabled: false,
          action: () => {
            if (confirmLeave) {
              mutateAsync();
            } else {
              setConfirmLeave(true);
              showGlobalWarning("Are you sure you want to leave ?");
              setTimeout(() => {
                setConfirmLeave(false);
              }, 5000);
            }
          },
        };
      case "REJECTED":
        return { title: "Request Rejected", disabled: true, action: null };
      case "REMOVED":
        return { title: "Request Cancelled", disabled: true, action: null };
      case "CANCELLED":
        return { title: "Request Cancelled", disabled: true, action: null };
      case "LEFT":
        return { title: "You Left!", disabled: true, action: null };
      default:
        return {
          title: "Join Carpool",
          disabled: false,
          action: () => sendReqRef.current?.open(),
        };
    }
  };
  const { title, disabled, action } = getButtonProps();

  return (
    <View
      style={tw`flex-1 pt-10 pb-5 bg-background dark:bg-[#01082E] flex flex-col items-center w-full`}
    >
      <CustomView style={tw`px-5`}>
        <CustomeTopBarNav
          title={carpool.event?.title ?? "Carpool"}
          onClickBack={() => safeGoBack(router, "/")}
        />
      </CustomView>
      <ScrollView
        style={tw`w-full max-w-[500px]`}
        contentContainerStyle={tw`pb-4`}
        onLayout={handleScrollViewLayout}
        onScroll={handleRideDetailsScroll}
        scrollEventThrottle={16}
      >
        <View style={tw`px-4 pt-2 gap-4`}>
          <View
            style={tw`rounded-[28px] bg-surface dark:bg-[#07143B] border border-border dark:border-[#1B2A50] overflow-hidden`}
          >
            <View style={tw`h-1 flex-row`}>
              <View style={tw`flex-1 bg-accentFill dark:bg-[#0FF1CF]`} />
              <View style={tw`flex-1 bg-infoSoft dark:bg-[#31C6F6]`} />
              <View style={tw`flex-1 bg-warningFill dark:bg-[#F8D05C]`} />
            </View>

            <View style={tw`p-5 gap-4`}>
              <View style={tw`flex-row items-start justify-between gap-4`}>
                <View style={tw`flex-row items-center gap-3 flex-1 min-w-0`}>
                  <View
                    style={tw`w-16 h-16 rounded-3xl bg-accentFill/12 dark:bg-[#0FF1CF]/12 items-center justify-center border border-accent/20 dark:border-[#0FF1CF]/20`}
                  >
                    <Ionicons name={rideIconName} size={34} color={color("#0FF1CF", "accent")} />
                  </View>

                  <View style={tw`flex-1 min-w-0`}>
                    <Text style={tw`text-accent dark:text-[#0FF1CF] text-xs`} numberOfLines={1}>
                      {rideLabel} ride vibe
                    </Text>
                    <Text
                      style={tw`text-foreground dark:text-white text-xl font-semibold mt-1`}
                      numberOfLines={2}
                    >
                      {carpool.event?.title ?? "Carpool"}
                    </Text>
                  </View>
                </View>

                {owner ? (
                  <TouchableOpacity
                    activeOpacity={0.84}
                    onPress={() => editRideRef.current?.open()}
                    style={tw`px-3 py-2 rounded-full bg-accentFill/10 dark:bg-[#0FF1CF]/10 border border-accent/20 dark:border-[#0FF1CF]/20`}
                  >
                    <Text style={tw`text-xs font-semibold text-accent dark:text-[#0FF1CF]`}>
                      Edit
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <Text style={tw`text-secondary dark:text-[#A8BAE4] text-sm leading-5`}>
                {rideCopy}
              </Text>

              <View style={tw`flex-row flex-wrap gap-3`}>
                <RidePill
                  iconName="time-outline"
                  label="Departure"
                  value={departureTimeLabel}
                />
                <RidePill
                  iconName="people-outline"
                  label="Crew"
                  value={`${crewCount} rider${crewCount === 1 ? "" : "s"}`}
                />
                <RidePill
                  iconName="ticket-outline"
                  label="Seats"
                  value={seatLabel}
                />
                <RidePill
                  iconName="cash-outline"
                  label="Fare"
                  value={priceLabel}
                />
              </View>
            </View>
          </View>

          <View
            style={tw`rounded-[24px] bg-surface dark:bg-[#101C45] border border-border dark:border-[#1B2A50] p-5 gap-4`}
          >
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={tw`text-foreground dark:text-white text-base font-semibold`}>Route</Text>
              <View style={tw`px-3 py-1 rounded-full bg-infoSoft/10 dark:bg-[#31C6F6]/10`}>
                <Text style={tw`text-info dark:text-[#31C6F6] text-xs`}>
                  {formatRideStatus(carpool.status)}
                </Text>
              </View>
            </View>

            <View>
              <RouteStop
                accent="#0FF1CF"
                label="Pickup"
                value={carpool.origin || "Pickup point pending"}
              />
              <View style={tw`ml-1.5 h-7 w-px bg-surfaceMuted dark:bg-[#1B2A50]`} />
              <RouteStop
                accent="#31C6F6"
                label="Destination"
                value={destinationLabel}
              />
            </View>
          </View>

          <View
            onLayout={handleChatAnchorLayout}
            style={tw`rounded-[24px] bg-surface dark:bg-[#07143B] border border-border dark:border-[#1B2A50] p-4 flex-row justify-between items-center`}
          >
            <View style={tw`gap-2`}>
              <Text style={tw`text-secondary dark:text-[#8FA5E2] text-xs`}>Ride crew</Text>
              <AvatarGroup
                avatars={carpool.passengers}
                owner={owner}
                onAdd={() => onAvaterClick()}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.84}
              accessibilityRole="button"
              accessibilityLabel="Open carpool chat"
              onPress={openChat}
              style={tw`h-12 px-4 rounded-2xl bg-accentFill dark:bg-[#0FF1CF] flex-row items-center gap-2`}
            >
              <MessagesSquareIcon color={color("#01082E", "onAccent")} size={18} />
              <Text style={tw`text-onAccent dark:text-[#01082E] text-sm font-semibold`}>Chat</Text>
            </TouchableOpacity>
          </View>

          <View
            style={tw`rounded-[24px] bg-surface dark:bg-[#101C45] border border-border dark:border-[#1B2A50] p-5 gap-4`}
          >
            <View style={tw`flex-row items-start justify-between gap-3`}>
              <View style={tw`flex-row items-center gap-3 flex-1 min-w-0`}>
                <View
                  style={tw`w-11 h-11 rounded-2xl bg-warningFill/10 dark:bg-[#F8D05C]/10 items-center justify-center`}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={22}
                    color={color("#F8D05C", "warning")}
                  />
                </View>
                <View style={tw`flex-1 min-w-0`}>
                  <Text style={tw`text-foreground dark:text-white text-base font-semibold`}>
                    Ride safety tips
                  </Text>
                  <Text style={tw`text-secondary dark:text-[#A8BAE4] text-xs mt-1`}>
                    Keep the pickup calm, visible, and easy to verify before
                    anyone gets moving.
                  </Text>
                </View>
              </View>
            </View>

            <View style={tw`gap-4 pt-3 border-t border-border dark:border-[#1B2A50]`}>
              {safetyTips.map((tip) => (
                <SafetyTipRow key={tip.title} tip={tip} />
              ))}
            </View>
          </View>
        </View>

        <PoolingWithA
          description={data.data.description}
          vehicleIcon={data.data.vehicleIcon}
          owner={user?.id === data.data.driver.id}
          openSheet={() => flexrideRef.current?.open()}
        />

        <View style={tw`px-4`}>
          <View
            style={tw`rounded-[24px] bg-surface dark:bg-[#07143B] border border-border dark:border-[#1B2A50] p-5 gap-3`}
          >
            <View style={tw`flex-row items-center gap-2`}>
              <Ionicons
                name="chatbox-ellipses-outline"
                size={18}
                color={color("#F8D05C", "warning")}
              />
              <Text style={tw`text-foreground dark:text-white text-base font-semibold`}>
                Pooler&apos;s note
              </Text>
            </View>
            <Text style={tw`text-foreground dark:text-[#DDE6FF] text-sm leading-5`}>
              {carpool.note ?? "No notes provided"}
            </Text>
          </View>
        </View>
      </ScrollView>
      {/* Bottom bar */}
      <CustomView style={tw`px-5 pt-6 flex-row justify-between items-center`}>
        <AvatarWithLabel
          imageUrl={carpool.driver.profilePicUrlTN}
          username={carpool.driver.username}
          role="Pooler"
        />

        {user?.id !== carpool.driver.id && (
          <TouchableOpacity
            style={tw`p-3 rounded-lg bg-surface dark:bg-[#0c1447]`}
            onPress={onFollow}
            disabled={isFollowing}
          >
            <Text style={tw`text-foreground dark:text-white`}>
              {isFollowing ? "following..." : followStatus}
            </Text>
          </TouchableOpacity>
        )}
      </CustomView>

      <CustomView style={tw`px-5 pb-5`}>
        {owner ? (
          <CustomButton
            onPress={() => requestBSRef.current?.open()}
            buttonClassName="bg-accentFill dark:bg-[#0FF1CF] border-0 w-full max-w-[500px]"
            textClassName="!text-onAccent dark:text-black"
            arrowCircleColor="bg-accentFill dark:bg-[#0C7F7F]"
            title="View Requests"
          />
        ) : (
          <CustomButton
            onPress={action ?? (() => {})}
            buttonClassName="bg-accentFill dark:bg-[#0FF1CF] border-0 w-full max-w-[500px]"
            textClassName="!text-onAccent dark:text-black"
            arrowCircleColor="bg-accentFill dark:bg-[#0C7F7F]"
            disabled={disabled}
            title={leavingCarpool ? "Leaving carpool" : title}
          />
        )}
      </CustomView>
      {showFloatingChat ? (
        <TouchableOpacity
          activeOpacity={0.86}
          accessibilityRole="button"
          accessibilityLabel="Open carpool chat"
          onPress={openChat}
          style={[
            tw`absolute right-5 w-14 h-14 rounded-full bg-accentFill dark:bg-[#0FF1CF] border border-borderStrong/20 dark:border-white/20 items-center justify-center shadow-lg`,
            { bottom: 188 },
          ]}
        >
          <MessagesSquareIcon color={color("#01082E", "onAccent")} size={24} />
        </TouchableOpacity>
      ) : null}
      <CancelCarpoolModal
        visible={showCancelModal}
        onClose={handleKeepCarpool}
        onCancelAndRequest={handleCancelAndRequest}
        onKeepCarpool={handleKeepCarpool}
        existingCarpool={{
          eventTitle: existingCarpoolInfo?.existingCarpool?.eventTitle,
          passengerCount:
            existingCarpoolInfo?.existingCarpool?.passengerCount || 0,
          hasActivePassengers:
            existingCarpoolInfo?.existingCarpool?.hasActivePassengers || false,
        }}
        isLoading={requestAfterCancelPending}
      />

      <FlexrideBS
        carpoolId={carpoolId}
        vehicleIcon={data.data.vehicleIcon}
        ref={flexrideRef}
      />
      <EditRideBS
        ref={editRideRef}
        carpoolId={carpoolId}
        origin={data.data.origin}
        departureTime={data.data.departureTime}
        note={data.data.note}
      />
      <ViewRequestBS ref={requestBSRef} carpool={carpool} dummy={dummy} />
      <SendRequestBS
        carpoolId={carpoolId}
        ref={sendReqRef}
        onHasExistingCarpool={handleHasExistingCarpool}
        onRequestSuccess={(response) => {
          // Handle successful request (without existing carpool)
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.carpoolDetails, carpoolId],
          });
        }}
      />
      <ShareRideLinkBS ref={shareRideLinkRef} carpoolId={carpoolId} />
    </View>
  );
};

export default CarpoolPage;
