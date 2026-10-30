import { useAppTheme } from "@/hooks/useAppTheme";
import { useCarpoolRequestRes, useRemovePassenger } from "@/services/mutations";
import { QUERY_KEYS } from "@/services/queryKeys";
import type {
  CarpoolPassengerRequest,
  CarpoolRequestDecision,
} from "@/types/carpool";
import { CARPOOL_PREVIOUS_DECISION_LABELS } from "@/utils/carpoolRequests";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import CarpoolFollowBadge from "./CarpoolFollowBadge";

type RequestCardProps = Pick<
  CarpoolPassengerRequest,
  "isFollowingRequester" | "isFollowedByRequester"
> & {
  status: string;
  imageUrl?: string | { uri: string } | null;
  name: CarpoolPassengerRequest["user"]["username"];
  message: string;
  estimatedDistance?: string | null; // e.g. "5 km"
  note?: string | null;
  requestId: string;
  carpoolId: string;
  previousDecision?: CarpoolRequestDecision | null;
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
  previousDecision,
  isFollowingRequester,
  isFollowedByRequester,
}: RequestCardProps) {
  const { tw, color } = useAppTheme();
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
        cardBg: color("#071A33", "successSoft"),
        border: color("#1A5A52", "borderStrong"),
        badgeBg: color("#103B36", "accentSoft"),
        badgeText: color("#65F5C7", "success"),
        accent: color("#0FF1CF", "accent"),
      }
    : {
        cardBg: color("#091737", "surface"),
        border: color("#324978", "borderStrong"),
        badgeBg: color("#1B2C5A", "infoSoft"),
        badgeText: color("#BFD2FF", "info"),
        accent: color("#7DA7FF", "info"),
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
        <View style={tw`mr-3 w-[104px] shrink-0 items-center gap-2`}>
          <View
            style={tw`h-14 w-14 items-center justify-center overflow-hidden rounded-[20px] bg-surface dark:bg-[#122451]`}
          >
            {imageUrl ? (
              <Image source={imageUrl} contentFit="cover" style={tw`h-full w-full`} />
            ) : (
              <Feather name="user" color={statusTone.accent} size={26} />
            )}
          </View>
          <CarpoolFollowBadge
            isFollowing={isFollowingRequester}
            isFollowedBy={isFollowedByRequester}
          />
        </View>

        <View style={tw`flex-1 min-w-0`}>
          <View style={tw`items-start gap-2`}>
            <View style={tw`w-full`}>
              <Text style={tw`text-base font-semibold text-foreground dark:text-white`}>{name ?? "Ride member"}</Text>
              <Text style={tw`mt-1 text-xs leading-5 text-secondary dark:text-[#9FB0D8]`}>
                {statusCopy}
              </Text>
              {previousDecision ? (
                <Text style={tw`mt-1 text-xs font-semibold text-warning dark:text-[#F8D05C]`}>
                  {CARPOOL_PREVIOUS_DECISION_LABELS[previousDecision]}
                </Text>
              ) : null}
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

      <View style={tw`mt-4 rounded-[24px] border border-border dark:border-[#20355E] bg-surface dark:bg-[#0D1B44] px-4 py-4`}>
        <View style={tw`flex-row items-start justify-between gap-3`}>
          <View style={tw`flex-1`}>
            <View style={tw`flex-row items-center`}>
              <View style={tw`mr-3 h-8 w-8 items-center justify-center rounded-full bg-accentFill/14 dark:bg-[#0FF1CF]/14`}>
                <Ionicons name="location-outline" size={16} color={color("#0FF1CF", "accent")} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-[11px] uppercase tracking-[1px] text-muted dark:text-[#7387B7]`}>
                  Pickup spot
                </Text>
                <Text style={tw`mt-1 text-sm leading-5 text-foreground dark:text-white`}>
                  {locationText}
                </Text>
              </View>
            </View>
          </View>

          {distanceLabel && (
            <View style={tw`rounded-full bg-surface dark:bg-white/6 px-3 py-2`}>
              <View style={tw`flex-row items-center`}>
                <Ionicons name="navigate-outline" size={13} color={color("#9FB0D8", "secondary")} />
                <Text style={tw`ml-1 text-[11px] font-medium text-foreground dark:text-[#D5E1FF]`}>
                  {distanceLabel}
                </Text>
              </View>
            </View>
          )}
        </View>

        {trimmedNote ? (
          <View style={tw`mt-3 rounded-[22px] bg-surface dark:bg-white/6 px-4 py-3`}>
            <View style={tw`flex-row items-start`}>
              <View style={tw`mr-3 mt-0.5 h-7 w-7 items-center justify-center rounded-full bg-surface/7 dark:bg-white/7`}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={14}
                  color={color("#C5D4FF", "foreground")}
                />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-[11px] uppercase tracking-[1px] text-muted dark:text-[#7387B7]`}>
                  Passenger note
                </Text>
                <Text style={tw`mt-1 text-sm leading-5 text-foreground dark:text-[#E5EDFF]`}>
                  {displayNote}
                </Text>
                {noteNeedsToggle && (
                  <TouchableOpacity
                    onPress={() => setExpanded(!expanded)}
                    style={tw`mt-2 self-start`}
                  >
                    <Text style={tw`text-xs font-semibold text-accent dark:text-[#0FF1CF]`}>
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
            <View style={tw`flex-1 rounded-[20px] border border-border dark:border-[#1A5A52] bg-surface dark:bg-[#0D2A28] px-4 py-3`}>
              <Text style={tw`text-xs uppercase tracking-[1px] text-info dark:text-[#8DE7D1]`}>
                Riding with you
              </Text>
              <Text style={tw`mt-1 text-sm text-foreground dark:text-white`}>
                This seat is already confirmed.
              </Text>
            </View>

            <TouchableOpacity
              onPress={onRemovePassenger}
              activeOpacity={0.8}
              disabled={removePassengerPending}
              style={tw`rounded-[20px] border border-border dark:border-[#6B2533] bg-dangerSoft dark:bg-[#2A0F18] px-5 py-3`}
            >
              <Text style={tw`text-sm font-semibold text-danger dark:text-[#FF9AAF]`}>
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
              style={tw`flex-1 flex-row items-center justify-center rounded-[20px] bg-accentFill dark:bg-[#0FF1CF] px-4 py-3`}
            >
              <Ionicons name="checkmark" size={16} color={color("#01082E", "onAccent")} />
              <Text style={tw`ml-2 text-sm font-semibold text-onAccent dark:text-[#01082E]`}>
                {reqResPen ? "Accepting..." : "Accept"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => respondToCarpoolReq("DECLINED")}
              activeOpacity={0.8}
              disabled={reqResPen}
              style={tw`flex-1 flex-row items-center justify-center rounded-[20px] border border-border dark:border-[#6B2533] bg-dangerSoft dark:bg-[#24101A] px-4 py-3`}
            >
              <Ionicons name="close" size={16} color={color("#FF9AAF", "danger")} />
              <Text style={tw`ml-2 text-sm font-semibold text-danger dark:text-[#FF9AAF]`}>
                {reqResPen ? "Declining..." : "Decline"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}
