import { useAppTheme } from "@/hooks/useAppTheme";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface PlaceCardProps {
  name: string;
  description: string;
  imageUrl: string;
  onPress?: () => void;
}

export default function PlaceCard({
  name,
  description,
  imageUrl,
  onPress,
}: PlaceCardProps) {
  const { tw } = useAppTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={tw`flex-row items-center bg-surface dark:bg-[#020A3D] rounded-xl p-4`}
    >
      <Image source={{ uri: imageUrl }} style={tw`w-20 h-20 rounded-lg`} />
      <View style={tw`ml-4 flex-1`}>
        <Text style={tw`text-foreground dark:text-white font-semibold`}>{name}</Text>
        <Text style={tw`text-muted dark:text-gray-400 text-sm`}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
}
