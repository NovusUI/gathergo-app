import { Registration } from "@/types/auth";
import { numberWithCommas } from "@/utils/utils";
import { Image } from "expo-image";
import { Text, TouchableOpacity, View } from "react-native";

interface EventCardProps {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  thumbnailUrl?: string;
  registrationType: Registration;
  registrationFee?: number;
  onPress?: () => void;
}

export default function EventCard({
  id,
  title,
  location,
  imageUrl,
  thumbnailUrl,
  registrationType,
  registrationFee,
  onPress,
}: EventCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center bg-[#01082e] rounded-xl p-5 h-28 max-h-40"
    >
      {imageUrl ? (
        <View className="w-20 h-20 rounded-lg overflow-hidden">
          <Image
            source={imageUrl}
            placeholder={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
            cachePolicy="disk" // ensures caching on disk
            style={{ width: 80, height: 80, borderRadius: 8 }}
            contentFit="cover" // equivalent to resizeMode="cover"
            transition={500} // fade-in duration (ms)
          />
        </View>
      ) : (
        <View className="w-20 h-20 rounded-lg bg-slate-300 flex justify-center items-center">
          <Text className="-rotate-45 text-slate-400">Party Animal</Text>
        </View>
      )}

      <View className="ml-4 flex-1 flex flex-col justify-between h-full">
        <Text className="text-white font-semibold">{title}</Text>

        <View className="flex flex-row justify-between">
          <View className="flex flex-row gap-3">
            <View className="p-2 bg-[#0FF1CF]/10 rounded-lg w-auto">
              <Text className="text-[#0FF1CF]">Direction</Text>
            </View>
            <View className="p-2 bg-[#0FF1CF]/10 rounded-lg w-auto">
              <Text className="text-[#0FF1CF]">Share</Text>
            </View>
          </View>
          <View className="p-2 bg-[#0FF1CF]/10 rounded-lg w-auto">
            <Text className="text-[#0FF1CF]">
              {registrationType === "ticket"
                ? "Tickets"
                : numberWithCommas(registrationFee, true, null)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
