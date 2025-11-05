import { formatShortDate } from "@/utils/dateTimeHandler";
import { formatTo12Hour } from "@/utils/utils";
import { Image } from "expo-image";
import { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface CarpoolCardProps {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  startDate: string;
  pickupLocation: string;
  onPress?: () => void;
  departureTime: string;
}

export default function CarpoolCard({
  id,
  title,
  imageUrl,
  thumbnailUrl,
  startDate,
  pickupLocation,
  departureTime,
  onPress,
}: CarpoolCardProps) {
  useEffect(() => {
    console.log(startDate, "startdate");

    console.log(formatShortDate(startDate));
  }, [startDate]);
  return (
    <TouchableOpacity
      key={id}
      onPress={onPress}
      className="flex-row items-center bg-[#01082e] rounded-xl p-5"
    >
      {imageUrl ? (
        <View className="w-[91px] h-[84px] rounded-lg overflow-hidden relative">
          <Image
            source={imageUrl}
            placeholder={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
            cachePolicy="disk" // ensures caching on disk
            style={{ width: 91, height: 84, borderRadius: 8 }}
            contentFit="cover" // equivalent to resizeMode="cover"
            transition={500} // fade-in duration (ms)
          />
          <View className="absolute top-1 left-1 p-1 bg-[#0FF1CF]/80 rounded-t-lg rounded-br-lg">
            <Text className="text-white">{formatShortDate(startDate)}</Text>
          </View>
        </View>
      ) : (
        <View className="w-20 h-20 rounded-lg bg-slate-300 flex justify-center items-center">
          <Text className="-rotate-45 text-slate-400">Party Animal</Text>
        </View>
      )}

      <View className="ml-4 flex-1 flex flex-col justify-between h-full">
        <Text className="text-white font-semibold text-lg">
          {pickupLocation} - {title}
        </Text>

        <View className="flex flex-row justify-between">
          <View className="flex flex-row gap-3">
            <View className="p-2 bg-[#0FF1CF]/10 rounded-lg w-auto">
              <Text className="text-[#0FF1CF]">
                {formatTo12Hour(departureTime)}
              </Text>
            </View>
            <View className="p-2 bg-[#0FF1CF]/10 rounded-lg w-auto">
              <Text className="text-[#0FF1CF]">Share</Text>
            </View>
          </View>
          <View className="p-2 bg-[#0FF1CF]/10 rounded-lg w-auto">
            <Text className="text-[#0FF1CF]">Free</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
