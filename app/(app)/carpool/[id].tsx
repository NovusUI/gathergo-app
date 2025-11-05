import AvatarGroup from "@/components/AvatarGroup";
import AvatarWithLabel from "@/components/AvatarWithLabel";
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import PoolingWithA from "@/components/PoolingWithA";
import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import { useAuth } from "@/context/AuthContext";
import { useGetCarpoolDetails } from "@/services/queries";
import { dummy } from "@/utils/utils";

import { useFollowUser, useLeaveCarpool } from "@/services/mutations";
import { QUERY_KEYS } from "@/services/queryKeys";
import {
  showGlobalSuccess,
  showGlobalWarning,
} from "@/utils/globalErrorHandler";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MessagesSquareIcon } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Svg, { Line } from "react-native-svg";
import FlexrideBS, { FlexrideBSRef } from "./bottomSheets/FlexrideBS";
import SendRequestBS, { SendRequestBSRef } from "./bottomSheets/SendRequestBS";
import ShareRideLinkBS, {
  ShareRideBSRef,
} from "./bottomSheets/ShareRideLinkBS";
import ViewRequestBS, { ViewRequestBSRef } from "./bottomSheets/ViewRequestBS";

const VerticalDashedLine = () => (
  <Svg height="25" width="2">
    <Line
      x1="0"
      y1="0"
      x2="0"
      y2="100%"
      stroke="#31C6F6"
      strokeWidth="2"
      strokeDasharray="4,4" // dash length, gap length
    />
  </Svg>
);

const CarpoolPage = () => {
  const { id } = useLocalSearchParams();
  const carpoolId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { user } = useAuth();
  const [confirmLeave, setConfirmLeave] = useState(false);
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

  //bottomsheets ref
  const flexrideRef = useRef<FlexrideBSRef>(null);
  const requestBSRef = useRef<ViewRequestBSRef>(null);
  const sendReqRef = useRef<SendRequestBSRef>(null);
  const shareRideLinkRef = useRef<ShareRideBSRef>(null);

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

  const onAvaterClick = () => {
    if (owner) {
      requestBSRef.current?.open();
    } else {
      shareRideLinkRef.current?.open();
    }
  };

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-[#01082E]">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-[#01082E]">
        <Text className="text-white">Failed to load carpool</Text>
      </View>
    );
  }

  const carpool = data.data;
  const owner = carpool.driver.id === user?.id;
  const rideUnavailable = carpool.status !== "ACTIVE";
  const isFollowingDriver = carpool.isFollowingDriver;
  const isFollowedByDriver = carpool.isFollowedByDriver;
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
    <View className="flex-1 pt-20 pb-5 bg-[#01082E] flex flex-col items-center w-full">
      <CustomView className="px-5">
        <CustomeTopBarNav
          title={carpool.event?.title ?? "Carpool"}
          onClickBack={() => router.back()}
        />
      </CustomView>

      <ScrollView className="w-full max-w-500">
        {/* divider */}
        <CustomView className="!bg-[#1B2A50]/40 h-2 w-full" />

        <CustomView className="px-4">
          <CustomView>
            <Text className="text-lg text-white">CARPOOL DETAILS</Text>
            <Text className="text-[#ADADAD]">{carpool.departureTime}</Text>

            <CustomView className="my-5">
              <View className="flex-row gap-5 items-center">
                <View className="rounded-full w-4 h-4 bg-[#0FF1CF]" />
                <Text className="text-white">{carpool.origin}</Text>
              </View>
              <View className="w-4 flex-row justify-center items-center h-6">
                <VerticalDashedLine />
              </View>
              <View className="flex-row gap-5 items-center">
                <View className="rounded-full w-4 h-4 bg-[#31C6F6]" />
                <Text className="text-white">
                  {carpool.event.location ?? "Destination not set"}
                </Text>
              </View>
            </CustomView>

            <Text className="text-white">
              {carpool.pricePerSeat > 0 ? `$${carpool.pricePerSeat}` : "Free"}
            </Text>
          </CustomView>
        </CustomView>

        <CustomView className="!bg-[#1B2A50]/40 h-2 w-full" />

        <View className="px-10 py-5 flex-row justify-between items-center">
          <AvatarGroup
            avatars={carpool.passengers}
            onAdd={() => onAvaterClick()}
          />
          <TouchableOpacity>
            <MessagesSquareIcon color={"white"} />
          </TouchableOpacity>
        </View>

        <CustomView className="!bg-[#1B2A50]/40 h-2 w-full" />

        {/* <CustomView className="mx-5 gap-5">
          <Text className="text-lg text-white">Pooling with a</Text>
          <EventDetails title="car model" subtitle="Benz gle" />
          <EventDetails title="color" subtitle="Wine" />
        </CustomView> */}

        <PoolingWithA
          description={data.data.description}
          owner={user?.id === data.data.driver.id}
          openSheet={() => flexrideRef.current?.open()}
        />

        <CustomView className="!bg-[#1B2A50]/40 h-2 w-full" />

        <CustomView className="mx-5 gap-5">
          <Text className="text-lg text-white">Pooler's note</Text>
          <Text className="text-white mr-5">
            {carpool.note ?? "No notes provided"}
          </Text>
        </CustomView>
      </ScrollView>

      {/* Bottom bar */}
      <CustomView className="px-5 pt-6 flex-row justify-between items-center">
        <AvatarWithLabel
          imageUrl={carpool.driver.profilePicUrlTN}
          username={carpool.driver.username}
          role="Pooler"
        />
        {user?.id !== carpool.driver.id && (
          <TouchableOpacity
            className="p-3 rounded-lg bg-[#0c1447]"
            onPress={onFollow}
            disabled={isFollowing}
          >
            <Text className="text-white">
              {isFollowing ? "following..." : followStatus}
            </Text>
          </TouchableOpacity>
        )}
      </CustomView>

      <CustomView className="px-5 pb-5">
        {owner ? (
          <CustomButton
            onPress={() => requestBSRef.current?.open()}
            buttonClassName="bg-[#0FF1CF] border-0 w-full max-w-[500px]"
            textClassName="!text-black"
            arrowCircleColor="bg-[#0C7F7F]"
            title="View Requests"
          />
        ) : (
          <CustomButton
            onPress={action ?? (() => {})}
            buttonClassName="bg-[#0FF1CF] border-0 w-full max-w-[500px]"
            textClassName="!text-black"
            arrowCircleColor="bg-[#0C7F7F]"
            disabled={disabled}
            title={leavingCarpool ? "Leaving carpool" : title}
          />
        )}
      </CustomView>

      <FlexrideBS carpoolId={carpoolId} ref={flexrideRef} />
      <ViewRequestBS ref={requestBSRef} carpool={carpool} dummy={dummy} />
      <SendRequestBS carpoolId={carpoolId} ref={sendReqRef} />
      <ShareRideLinkBS ref={shareRideLinkRef} />
    </View>
  );
};

export default CarpoolPage;
