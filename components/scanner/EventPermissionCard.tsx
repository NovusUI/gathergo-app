import {
  Calendar,
  ChevronRight,
  Clock,
  Shield,
  Users,
} from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

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
    if (!permission.expiresAt) return { color: "#0FF1CF", text: "Active" };

    const date = new Date(permission.expiresAt);
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return { color: "#FF5757", text: "Expired" };
    if (diffDays <= 7) return { color: "#FF932E", text: "Expiring Soon" };
    return { color: "#0FF1CF", text: "Active" };
  };

  const status = getExpirationStatus();

  return (
    <TouchableOpacity
      style={tw`bg-[#1B2A50] rounded-xl p-4`}
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
        <ChevronRight size={20} color="#5669FF" />
      </View>

      {/* Details */}
      <View style={tw`space-y-2`}>
        <View style={tw`flex-row items-center`}>
          <Calendar size={16} color="#5669FF" />
          <Text style={tw`text-gray-400 text-sm ml-2`}>
            Event: {formatDate(permission.eventDate)}
          </Text>
        </View>

        {permission.eventLocation && (
          <View style={tw`flex-row items-center`}>
            <Clock size={16} color="#FF932E" />
            <Text style={tw`text-gray-400 text-sm ml-2`}>
              Location: {permission.eventLocation}
            </Text>
          </View>
        )}

        <View style={tw`flex-row items-center`}>
          <Users size={16} color="#0FF1CF" />
          <Text style={tw`text-gray-400 text-sm ml-2`}>
            Granted by: {permission.ownerName}
          </Text>
        </View>

        {permission.expiresAt && (
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
