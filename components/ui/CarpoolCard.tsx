import { Ionicons } from "@expo/vector-icons";
import {
  getCarpoolVehicleOption,
  getRandomCarpoolVehicleIcon,
} from "@/constants/carpool";
import { formatShortDate } from "@/utils/dateTimeHandler";
import { formatTo12Hour } from "@/utils/utils";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

interface CarpoolCardProps {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  startDate: string;
  pickupLocation: string;
  onPress?: () => void;
  departureTime: string;
  availableSeats?: number;
  pricePerSeat?: number;
  vehicleIcon?: string | null;
}

export default function CarpoolCard({
  id,
  title,
  startDate,
  pickupLocation,
  departureTime,
  availableSeats,
  pricePerSeat,
  vehicleIcon,
  onPress,
}: CarpoolCardProps) {
  const selectedVehicle =
    getCarpoolVehicleOption(vehicleIcon) ||
    getRandomCarpoolVehicleIcon(`${id}${title}`);

  return (
    <TouchableOpacity
      key={id}
      onPress={onPress}
      activeOpacity={0.9}
      style={tw`flex-row items-center bg-[#01082e] rounded-xl p-4`}
    >
      <View style={tw`w-[91px] h-[84px] rounded-2xl bg-[#0FF1CF]/12 items-center justify-center relative overflow-hidden`}>
        <View style={tw`h-14 w-14 rounded-full bg-[#0FF1CF]/15 items-center justify-center`}>
          <Ionicons name={selectedVehicle.iconName} size={30} color="#0FF1CF" />
        </View>
        <View
          style={tw`absolute top-1 left-1 p-1 bg-[#0FF1CF]/80 rounded-t-lg rounded-br-lg`}
        >
          <Text style={tw`text-white text-xs`}>{formatShortDate(startDate)}</Text>
        </View>
      </View>

      <View style={tw`ml-4 flex-1`}>
        <Text style={tw`text-white font-semibold text-base`} numberOfLines={2}>
          {pickupLocation} - {title}
        </Text>

        <View style={tw`mt-3 flex-row justify-between items-center`}>
          <View style={tw`flex-row gap-2`}>
            <View style={tw`p-2 bg-[#0FF1CF]/10 rounded-lg`}>
              <Text style={tw`text-[#0FF1CF] text-xs`}>
                {formatTo12Hour(departureTime)}
              </Text>
            </View>
            <View style={tw`p-2 bg-[#0FF1CF]/10 rounded-lg`}>
              <Text style={tw`text-[#0FF1CF] text-xs`}>
                {availableSeats ? `${availableSeats} seats` : "Shared ride"}
              </Text>
            </View>
          </View>
          <View style={tw`p-2 bg-[#0FF1CF]/10 rounded-lg`}>
            <Text style={tw`text-[#0FF1CF] text-xs`}>
              {pricePerSeat && pricePerSeat > 0 ? `₦${pricePerSeat}` : "Free"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
