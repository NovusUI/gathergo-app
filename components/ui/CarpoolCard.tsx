// components/CarpoolCard.tsx
import { Text, TouchableOpacity } from "react-native";

interface CarpoolCardProps {
  driverName: string;
  pickupLocation: string;
  dropLocation: string;
  availableSeats: number;
  departureTime: string;
  onPress?: () => void;
}

export default function CarpoolCard({
  driverName,
  pickupLocation,
  dropLocation,
  availableSeats,
  departureTime,
  onPress,
}: CarpoolCardProps) {
  return (
    <TouchableOpacity onPress={onPress} className="bg-[#020A3D] rounded-xl p-4">
      <Text className="text-white font-semibold">{driverName}</Text>
      <Text className="text-gray-400 text-sm">
        {pickupLocation} → {dropLocation}
      </Text>
      <Text className="text-gray-500 text-xs">
        Seats: {availableSeats} • {new Date(departureTime).toLocaleTimeString()}
      </Text>
    </TouchableOpacity>
  );
}
