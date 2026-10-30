import { useAppTheme } from "@/hooks/useAppTheme";
import CarpoolFollowBadge from "@/components/carpool/CarpoolFollowBadge";
import CarpoolMembershipBadge from "@/components/carpool/CarpoolMembershipBadge";
import type { EventCarpoolListItem } from "@/types/carpool";
import { Ionicons } from "@expo/vector-icons";
import {
  getCarpoolVehicleOption,
  getRandomCarpoolVehicleIcon,
} from "@/constants/carpool";
import { formatShortDate } from "@/utils/dateTimeHandler";
import { formatTo12Hour } from "@/utils/utils";
import { Text, TouchableOpacity, View } from "react-native";

interface CarpoolCardProps
  extends Pick<EventCarpoolListItem, "isFollowingDriver" | "isFollowedByDriver" | "isMember"> {
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
  poolerUsername?: string | null;
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
  poolerUsername,
  isFollowingDriver,
  isFollowedByDriver,
  isMember,
  onPress,
}: CarpoolCardProps) {
  const { tw, color } = useAppTheme();
  const selectedVehicle =
    getCarpoolVehicleOption(vehicleIcon) ||
    getRandomCarpoolVehicleIcon(`${id}${title}`);

  return (
    <TouchableOpacity
      key={id}
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        tw`rounded-xl border p-4 w-full`,
        isMember
          ? tw`bg-infoSoft dark:bg-[#10264D] border-info/30 dark:border-[#38699D]`
          : tw`bg-background dark:bg-[#01082e] border-transparent`,
      ]}
    >
      <View style={tw`flex-row items-start`}>
        <View style={tw`w-24 shrink-0 items-center gap-1.5`}>
          <View style={tw`w-[91px] h-[84px] rounded-2xl bg-accentFill/12 dark:bg-[#0FF1CF]/12 items-center justify-center overflow-hidden`}>
            <View style={tw`h-14 w-14 rounded-full bg-accentFill/15 dark:bg-[#0FF1CF]/15 items-center justify-center`}>
              <Ionicons name={selectedVehicle.iconName} size={30} color={color("#0FF1CF", "accent")} />
            </View>
          </View>
          <CarpoolFollowBadge
            isFollowing={isFollowingDriver}
            isFollowedBy={isFollowedByDriver}
          />
        </View>

        <View style={tw`ml-3 flex-1 min-w-0`}>
          {isMember ? (
            <View style={tw`mb-2`}><CarpoolMembershipBadge /></View>
          ) : null}
          <Text style={tw`text-foreground dark:text-white font-semibold text-base`} numberOfLines={2}>
            {pickupLocation} - {title}
          </Text>

          {poolerUsername ? (
            <View style={tw`mt-2 flex-row items-center gap-1.5 min-w-0`}>
              <Ionicons name="person-circle-outline" size={14} color={color("#8FA5E2", "secondary")} />
              <Text style={tw`shrink text-secondary dark:text-[#8FA5E2] text-xs`} numberOfLines={1}>
                Pooler @{poolerUsername}
              </Text>
            </View>
          ) : null}

          <View style={tw`mt-2 flex-row items-center gap-1.5`}>
            <Ionicons name="time-outline" size={13} color={color("#8FA5E2", "secondary")} />
            <Text style={tw`shrink text-secondary dark:text-[#8FA5E2] text-xs`} numberOfLines={1}>
              Departs {formatTo12Hour(departureTime)}
            </Text>
          </View>
        </View>
      </View>

      <View style={tw`mt-3 flex-row items-center gap-2`}>
        {[
          formatShortDate(startDate),
          availableSeats ? `${availableSeats} seats` : "Shared ride",
          pricePerSeat && pricePerSeat > 0 ? `₦${pricePerSeat}` : "Free",
        ].map((label, index) => (
          <View key={index} style={tw`flex-1 min-w-0 items-center rounded-lg bg-accentFill/10 dark:bg-[#0FF1CF]/10 px-2 py-2`}>
            <Text numberOfLines={1} style={tw`text-accent dark:text-[#0FF1CF] text-xs`}>
              {label}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}
