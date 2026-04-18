import { useCarpoolRequestRes, useRemovePassenger } from "@/services/mutations";
import { QUERY_KEYS } from "@/services/queryKeys";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

type RequestCardProps = {
  status: string;
  imageUrl?: string | { uri: string };
  name: string;
  message: string;
  estimatedDistance?: string | null; // e.g. "5 km"
  note?: string | null;
  requestId: string;
  carpoolId: string;
};

export default function RequestCard({
  status,
  imageUrl,
  name,
  message,
  estimatedDistance,
  note,
  requestId,
  carpoolId,
}: RequestCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isAccepted = status === "ACCEPTED";
  const locationText = message?.trim() || "Pickup point not shared yet";
  const trimmedNote = note?.trim() || "";
  const noteNeedsToggle = trimmedNote.length > 110;
  const displayNote =
    !trimmedNote || expanded || !noteNeedsToggle
      ? trimmedNote
      : `${trimmedNote.slice(0, 110).trimEnd()}...`;
  const statusTone = isAccepted
    ? {
        cardBg: "#071A33",
        border: "#1A5A52",
        badgeBg: "#103B36",
        badgeText: "#65F5C7",
        accent: "#0FF1CF",
      }
    : {
        cardBg: "#091737",
        border: "#324978",
        badgeBg: "#1B2C5A",
        badgeText: "#BFD2FF",
        accent: "#7DA7FF",
      };
  const statusLabel = isAccepted ? "Approved" : "Pending";
  const statusCopy = isAccepted
    ? "This rider already has a seat with you."
    : "Give them a quick yes or no before the ride fills up.";
  const distanceLabel =
    estimatedDistance && estimatedDistance.trim().length > 0
      ? estimatedDistance
      : null;
  const queryClient = useQueryClient();

  const { mutateAsync: reqRes, isPending: reqResPen } = useCarpoolRequestRes(
    requestId,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.carpoolDetails, carpoolId],
        });
        showGlobalSuccess("Request updated successfully");
      },
      onError: () => {
        showGlobalError("Error responding to request");
      },
    }
  );

  const { mutateAsync: removePassenger, isPending: removePassengerPending } =
    useRemovePassenger(requestId, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.carpoolDetails, carpoolId],
        });
        showGlobalSuccess("Passenger removed successfully");
      },
      onError: (error: any) => {
        showGlobalError(error?.message || "Error removing passenger");
      },
    });

  const respondToCarpoolReq = (respStatus: "ACCEPTED" | "DECLINED") => {
    reqRes(respStatus);
  };

  const onRemovePassenger = () => {
    removePassenger();
  };

  return (
    <View
      style={[
        tw`rounded-[28px] border px-4 py-4`,
        {
          backgroundColor: statusTone.cardBg,
          borderColor: statusTone.border,
        },
      ]}
    >
      <View style={tw`flex-row items-start`}>
        <View
          style={tw`mr-3 h-14 w-14 items-center justify-center overflow-hidden rounded-[20px] bg-[#122451]`}
        >
          {imageUrl ? (
            <Image source={imageUrl} contentFit="cover" style={tw`h-full w-full`} />
          ) : (
            <Feather name="user" color={statusTone.accent} size={26} />
          )}
        </View>

        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-start justify-between gap-3`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-base font-semibold text-white`}>{name}</Text>
              <Text style={tw`mt-1 text-xs leading-5 text-[#9FB0D8]`}>
                {statusCopy}
              </Text>
            </View>

            <View
              style={[
                tw`rounded-full px-3 py-1`,
                { backgroundColor: statusTone.badgeBg },
              ]}
            >
              <Text
                style={[
                  tw`text-[10px] font-semibold uppercase tracking-[1px]`,
                  { color: statusTone.badgeText },
                ]}
              >
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={tw`mt-4 rounded-[24px] border border-[#20355E] bg-[#0D1B44] px-4 py-4`}>
        <View style={tw`flex-row items-start justify-between gap-3`}>
          <View style={tw`flex-1`}>
            <View style={tw`flex-row items-center`}>
              <View style={tw`mr-3 h-8 w-8 items-center justify-center rounded-full bg-[#0FF1CF]/14`}>
                <Ionicons name="location-outline" size={16} color="#0FF1CF" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-[11px] uppercase tracking-[1px] text-[#7387B7]`}>
                  Pickup spot
                </Text>
                <Text style={tw`mt-1 text-sm leading-5 text-white`}>
                  {locationText}
                </Text>
              </View>
            </View>
          </View>

          {distanceLabel && (
            <View style={tw`rounded-full bg-white/6 px-3 py-2`}>
              <View style={tw`flex-row items-center`}>
                <Ionicons name="navigate-outline" size={13} color="#9FB0D8" />
                <Text style={tw`ml-1 text-[11px] font-medium text-[#D5E1FF]`}>
                  {distanceLabel}
                </Text>
              </View>
            </View>
          )}
        </View>

        {trimmedNote ? (
          <View style={tw`mt-3 rounded-[22px] bg-white/6 px-4 py-3`}>
            <View style={tw`flex-row items-start`}>
              <View style={tw`mr-3 mt-0.5 h-7 w-7 items-center justify-center rounded-full bg-white/7`}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={14}
                  color="#C5D4FF"
                />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-[11px] uppercase tracking-[1px] text-[#7387B7]`}>
                  Passenger note
                </Text>
                <Text style={tw`mt-1 text-sm leading-5 text-[#E5EDFF]`}>
                  {displayNote}
                </Text>
                {noteNeedsToggle && (
                  <TouchableOpacity
                    onPress={() => setExpanded(!expanded)}
                    style={tw`mt-2 self-start`}
                  >
                    <Text style={tw`text-xs font-semibold text-[#0FF1CF]`}>
                      {expanded ? "Show less" : "Read more"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ) : null}
      </View>

      <View style={tw`mt-4 flex-row items-center gap-3`}>
        {isAccepted ? (
          <>
            <View style={tw`flex-1 rounded-[20px] border border-[#1A5A52] bg-[#0D2A28] px-4 py-3`}>
              <Text style={tw`text-xs uppercase tracking-[1px] text-[#8DE7D1]`}>
                Riding with you
              </Text>
              <Text style={tw`mt-1 text-sm text-white`}>
                This seat is already confirmed.
              </Text>
            </View>

            <TouchableOpacity
              onPress={onRemovePassenger}
              activeOpacity={0.8}
              disabled={removePassengerPending}
              style={tw`rounded-[20px] border border-[#6B2533] bg-[#2A0F18] px-5 py-3`}
            >
              <Text style={tw`text-sm font-semibold text-[#FF9AAF]`}>
                {removePassengerPending ? "Removing..." : "Remove"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => respondToCarpoolReq("ACCEPTED")}
              activeOpacity={0.8}
              disabled={reqResPen}
              style={tw`flex-1 flex-row items-center justify-center rounded-[20px] bg-[#0FF1CF] px-4 py-3`}
            >
              <Ionicons name="checkmark" size={16} color="#041130" />
              <Text style={tw`ml-2 text-sm font-semibold text-[#041130]`}>
                {reqResPen ? "Accepting..." : "Accept"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => respondToCarpoolReq("DECLINED")}
              activeOpacity={0.8}
              disabled={reqResPen}
              style={tw`flex-1 flex-row items-center justify-center rounded-[20px] border border-[#6B2533] bg-[#24101A] px-4 py-3`}
            >
              <Ionicons name="close" size={16} color="#FF9AAF" />
              <Text style={tw`ml-2 text-sm font-semibold text-[#FF9AAF]`}>
                {reqResPen ? "Declining..." : "Decline"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}
