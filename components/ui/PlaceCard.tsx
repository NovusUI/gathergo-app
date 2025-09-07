// components/PlaceCard.tsx
import { Image, Text, TouchableOpacity, View } from "react-native";

interface PlaceCardProps {
  name: string;
  description: string;
  imageUrl: string;
  onPress?: () => void;
}

export default function PlaceCard({ name, description, imageUrl, onPress }: PlaceCardProps) {
  return (
    <TouchableOpacity onPress={onPress} className="flex-row items-center bg-[#020A3D] rounded-xl p-4">
      <Image source={{ uri: imageUrl }} className="w-20 h-20 rounded-lg" />
      <View className="ml-4 flex-1">
        <Text className="text-white font-semibold">{name}</Text>
        <Text className="text-gray-400 text-sm">{description}</Text>
      </View>
    </TouchableOpacity>
  );
}
