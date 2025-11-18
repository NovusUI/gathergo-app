import { useCarpoolRequestRes, useRemovePassenger } from "@/services/mutations";
import { QUERY_KEYS } from "@/services/queryKeys";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { Feather } from "@expo/vector-icons";
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
      style={tw`flex-row items-start p-3 rounded-xl border`}
      // conditional border color
    >
      {/* Avatar */}
      <View style={tw`w-[70px] h-[70px] rounded-xl overflow-hidden mr-3`}>
        {imageUrl ? (
          <Image
            source={imageUrl}
            contentFit="cover"
            style={tw`w-full h-full rounded-xl`}
          />
        ) : (
          <Feather name="user" color="teal" size={70} />
        )}
      </View>

      {/* Info + Actions */}
      <View style={tw`flex-1`}>
        <Text style={tw`text-white font-semibold text-base`}>{name}</Text>
        <Text style={tw`text-gray-300 text-sm mb-1`}>{message}</Text>

        {/* Estimated distance (always shown if available) */}
        {estimatedDistance && (
          <Text style={tw`text-teal-400 text-xs mb-2`}>
            {expanded
              ? `${estimatedDistance} from where you created the pool`
              : estimatedDistance}
          </Text>
        )}

        {/* Note (only if exists) */}
        {note && (
          <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            {expanded ? (
              <Text style={tw`text-gray-400 text-sm mb-2`}>{note}</Text>
            ) : (
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={tw`text-gray-500 text-xs italic mb-2`}
              >
                {note}
              </Text>
            )}
            <Text style={tw`text-blue-400 text-xs`}>
              {expanded ? "Collapse ▲" : "Expand ▼"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Actions */}
        <View style={tw`flex-row gap-3 mt-2`}>
          {isAccepted ? (
            <TouchableOpacity
              onPress={onRemovePassenger}
              activeOpacity={0.8}
              disabled={removePassengerPending}
              style={tw`px-4 py-2 rounded-md ${
                removePassengerPending ? "bg-[#4a1a1a]" : "bg-[#2C0000]"
              }`}
            >
              <Text style={tw`text-red-500 font-semibold`}>
                {removePassengerPending ? "Removing..." : "Remove"}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => respondToCarpoolReq("ACCEPTED")}
                activeOpacity={0.8}
                disabled={reqResPen}
                style={tw`px-4 py-2 rounded-md ${
                  reqResPen ? "bg-[#123232]" : "bg-[#002C2C]"
                }`}
              >
                <Text style={tw`text-teal-400 font-semibold`}>
                  {reqResPen ? "Accepting..." : "Accept"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => respondToCarpoolReq("DECLINED")}
                activeOpacity={0.8}
                disabled={reqResPen}
                style={tw`px-4 py-2 rounded-md ${
                  reqResPen ? "bg-[#4a1a1a]" : "bg-[#2C0000]"
                }`}
              >
                <Text style={tw`text-red-500 font-semibold`}>
                  {reqResPen ? "Declining..." : "Decline"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
