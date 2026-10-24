import { useAppTheme } from "@/hooks/useAppTheme";
import {
    Calendar,
    ChevronRight,
    Clock,
    Shield,
    Users,
} from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface EventPermissionCardProps {
  permission: {
    eventId: string;
    eventDate: string;
    eventLocation?: string;
    ownerName?: string;
    expiresAt?: string;
  };
  onPress: () => void;
}

const EventPermissionCard: React.FC<EventPermissionCardProps> = ({
  permission,
  onPress,
}) => {
  const { tw, color } = useAppTheme();
  const formatDate = (dateString: string) => {
    if (!dateString) return "no expiration";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getExpirationStatus = () => {
    if (!permission.expiresAt) return { color: color("#0FF1CF", "accent"), text: "Active" };

    const date = new Date(permission.expiresAt);
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return { color: color("#FF5757", "danger"), text: "Expired" };
    if (diffDays <= 7) return { color: color("#FF932E", "warning"), text: "Expiring Soon" };
    return { color: color("#0FF1CF", "accent"), text: "Active" };
  };

  const status = getExpirationStatus();

  return (
    <TouchableOpacity
      style={tw`bg-surfaceMuted dark:bg-[#1B2A50] rounded-xl p-4`}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={tw`flex-row justify-between items-start mb-3`}>
        <View style={tw`flex-row items-center`}>
          <View
            style={[
              tw`w-3 h-3 rounded-full mr-2`,
              { backgroundColor: status.color },
            ]}
          />
          <Text style={[tw`text-sm font-semibold`, { color: status.color }]}>
            {status.text}
          </Text>
        </View>
        <ChevronRight size={20} color={color("#5669FF", "primary")} />
      </View>

      {/* Details */}
      <View style={tw`gap-2`}>
        <View style={tw`flex-row items-center`}>
          <Calendar size={16} color={color("#5669FF", "primary")} />
          <Text style={tw`text-muted dark:text-gray-400 text-sm ml-2`}>
            Event: {formatDate(permission.eventDate)}
          </Text>
        </View>

        {Boolean(permission.eventLocation) && (
          <View style={tw`flex-row items-center`}>
            <Clock size={16} color={color("#FF932E", "warning")} />
            <Text style={tw`text-muted dark:text-gray-400 text-sm ml-2`}>
              Location: {permission.eventLocation}
            </Text>
          </View>
        )}

        <View style={tw`flex-row items-center`}>
          <Users size={16} color={color("#0FF1CF", "accent")} />
          <Text style={tw`text-muted dark:text-gray-400 text-sm ml-2`}>
            Granted by: {permission.ownerName}
          </Text>
        </View>

        {Boolean(permission.expiresAt) && (
          <View style={tw`flex-row items-center`}>
            <Shield size={16} color={status.color} />
            <Text style={[tw`text-sm ml-2`, { color: status.color }]}>
              Expires: {formatDate(permission.expiresAt)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default EventPermissionCard;
