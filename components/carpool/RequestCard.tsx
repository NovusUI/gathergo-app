import { Image } from "expo-image";
import { Text, TouchableOpacity, View } from "react-native";

type RequestCardProps = {
  imageUrl?: string | { uri: string };
  name: string;
  message: string;
  onAccept?: () => void;
  onDecline?: () => void;
};

export default function RequestCard({
  imageUrl,
  name,
  message,
  onAccept,
  onDecline,
}: RequestCardProps) {
  return (
    <View
      className="flex-row items-center p-3 rounded-xl border"
      style={{ borderColor: "#00F0FF" }}
    >
      {/* Avatar */}
      <View className="w-fit h-fit rounded-xl overflow-hidden mr-3">
        <Image
          source={imageUrl || "https://randomuser.me/api/portraits/men/32.jpg"}
          className="w-full h-full"
          contentFit="cover"
          style={{
            width: 70,
            height: 70,
            borderRadius: 10,
          }}
        />
      </View>

      {/* Info + Actions */}
      <View className="flex-1">
        <Text className="text-white font-semibold text-base">{name}</Text>
        <Text className="text-gray-300 text-sm mb-3">{message}</Text>

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={onAccept}
            activeOpacity={0.8}
            className="px-4 py-2 rounded-md bg-[#002C2C] "
          >
            <Text className="text-teal-400 font-semibold">Accept</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDecline}
            activeOpacity={0.8}
            className="px-4 py-2 rounded-md bg-[#2C0000] "
          >
            <Text className="text-red-500 font-semibold">Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
