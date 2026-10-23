import { useAppTheme } from "@/hooks/useAppTheme";
import { Ionicons } from "@expo/vector-icons";
import {
  getCarpoolVehicleOption,
  getRandomCarpoolVehicleIcon,
} from "@/constants/carpool";
import { formatBadgeCount, formatMessageTimestamp } from "@/utils/utils";
import { UserRound } from "lucide-react-native";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface ConversationProps {
  title?: string;
  lastMessage: {
    imgUrl?: string | null;
    text?: string | null;
    date?: string | null;
  };
  carpoolId?: string;
  driverImgUrl?: string;
  passengerImgUrls?: string[];
  onClick: () => void;
  unreadCount?: number;
  vehicleIcon?: string | null;
}

const ConversationView = ({
  onClick,
  title,
  lastMessage,
  carpoolId,
  unreadCount = 0,
  vehicleIcon,
}: ConversationProps) => {
  const { tw, color } = useAppTheme();
  const selectedVehicle =
    getCarpoolVehicleOption(vehicleIcon) ||
    getRandomCarpoolVehicleIcon(`${carpoolId || ""}${title || ""}`);
  const previewText = lastMessage?.text?.trim() || "No messages yet";
  const hasUnread = unreadCount > 0;

  return (
    <TouchableOpacity
      style={tw`p-4 bg-surface dark:bg-[#07143B] rounded-2xl border border-border dark:border-[#1B2A50] overflow-hidden`}
      onPress={onClick}
      activeOpacity={0.86}
    >
      <View style={tw`absolute top-0 left-0 right-0 h-1 flex-row`}>
        <View style={tw`flex-1 bg-accentFill dark:bg-[#0FF1CF]`} />
        <View style={tw`flex-1 bg-infoSoft dark:bg-[#31C6F6]`} />
        <View style={tw`flex-1 bg-surfaceMuted dark:bg-[#8FA5E2]`} />
      </View>

      <View style={tw`flex-row gap-3`}>
        <View
          style={tw`w-14 h-14 rounded-2xl bg-accentFill/12 dark:bg-[#0FF1CF]/12 items-center justify-center border border-accent/20 dark:border-[#0FF1CF]/20`}
        >
          <Ionicons name={selectedVehicle.iconName} size={28} color={color("#0FF1CF", "accent")} />
        </View>

        <View style={tw`flex-1 min-w-0`}>
          <View style={tw`flex-row items-start justify-between gap-3`}>
            <Text
              style={tw`text-foreground dark:text-white font-semibold flex-1`}
              numberOfLines={1}
            >
              {title || "Carpool chat"}
            </Text>
            {lastMessage?.date ? (
              <Text style={tw`text-secondary dark:text-[#A8BAE4] text-xs`}>
                {formatMessageTimestamp(lastMessage.date)}
              </Text>
            ) : null}
          </View>

          <View style={tw`mt-1 flex-row items-center gap-2`}>
            <Text style={tw`text-accent dark:text-[#0FF1CF] text-xs`} numberOfLines={1}>
              {selectedVehicle.label}
            </Text>
            <View style={tw`w-1 h-1 rounded-full bg-surfaceMuted dark:bg-[#8FA5E2]`} />
            <Text style={tw`text-secondary dark:text-[#A8BAE4] text-xs`}>Carpool</Text>
          </View>

          <View style={tw`flex-row items-center mt-3 gap-2`}>
            {lastMessage?.imgUrl ? (
              <Image
                source={{ uri: lastMessage.imgUrl }}
                style={tw`w-6 h-6 rounded-full bg-surface dark:bg-white`}
              />
            ) : (
              <View
                style={tw`w-6 h-6 rounded-full bg-surfaceMuted dark:bg-[#1B2A50] items-center justify-center`}
              >
                <UserRound size={12} color={color("#8FA5E2", "secondary")} />
              </View>
            )}

            <Text
              style={tw`text-xs text-foreground dark:text-[#DDE6FF] flex-1`}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {previewText}
            </Text>

            {hasUnread && (
              <View
                style={tw`min-w-[22px] h-[22px] px-2 rounded-full bg-accentFill dark:bg-[#0FF1CF] items-center justify-center`}
              >
                <Text style={tw`text-onAccent dark:text-[#01082E] text-xs font-semibold`}>
                  {formatBadgeCount(unreadCount)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ConversationView;
