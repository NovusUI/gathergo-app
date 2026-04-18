import { Calendar, Clock, Mail, Power, Shield } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

interface PermissionCardProps {
  permission: {
    id: string;
    scannerName: string;
    scannerEmail: string;
    eventName: string;
    expiresAt?: string;
    isActive: boolean;
    createdAt: string;
  };
  onRevoke: () => void;

  onToggleActive: () => void;
  isEventOwner: boolean;
}

const PermissionCard: React.FC<PermissionCardProps> = ({
  permission,
  onRevoke,

  onToggleActive,
  isEventOwner,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No expiration";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getExpirationStatus = () => {
    if (!permission.expiresAt) return "active";
    const date = new Date(permission.expiresAt);
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return "expired";
    if (diffDays <= 7) return "expiring";
    return "active";
  };

  const getStatusColor = () => {
    const status = getExpirationStatus();
    if (status === "expired") return "#FF5757";
    if (status === "expiring") return "#FF932E";
    return permission.isActive ? "#0FF1CF" : "#6B7280";
  };

  const getStatusText = () => {
    const status = getExpirationStatus();
    if (status === "expired") return "Expired";
    if (status === "expiring") return "Expiring Soon";
    return permission.isActive ? "Active" : "Inactive";
  };

  return (
    <View style={tw`bg-[#1B2A50] rounded-xl p-4`}>
      {/* Header */}
      <View style={tw`flex-row justify-between items-start mb-3`}>
        <View style={tw`flex-row items-center`}>
          <View
            style={[
              tw`w-3 h-3 rounded-full mr-2`,
              { backgroundColor: getStatusColor() },
            ]}
          />
          <Text
            style={[tw`text-sm font-semibold`, { color: getStatusColor() }]}
          >
            {getStatusText()}
          </Text>
        </View>
        <View style={tw`flex-row gap-2`}>
          {isEventOwner && (
            <>
              <TouchableOpacity onPress={onToggleActive}>
                <Power
                  size={18}
                  color={permission.isActive ? "#0FF1CF" : "#6B7280"}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={onRevoke}>
                <Shield size={18} color="#FF932E" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* User Info */}
      <View style={tw`flex-row items-center mb-3`}>
        <View
          style={tw`w-10 h-10 rounded-full bg-[#5669FF] items-center justify-center`}
        >
          <Text style={tw`text-white font-bold`}>
            {permission.scannerName?.[0] || permission.scannerEmail?.[0] || "U"}
          </Text>
        </View>
        <View style={tw`ml-3 flex-1`}>
          <Text style={tw`text-white font-semibold`}>
            {permission.scannerName || "User"}
          </Text>
          <View style={tw`flex-row items-center mt-1`}>
            <Mail size={12} color="#6B7280" />
            <Text style={tw`text-gray-400 text-xs ml-1`}>
              {permission.scannerEmail}
            </Text>
          </View>
        </View>
      </View>

      {/* Event Info */}
      <View style={tw`mb-3`}>
        <Text style={tw`text-white text-sm font-medium mb-1`}>Event</Text>
        <Text style={tw`text-gray-400 text-sm`}>{permission.eventName}</Text>
      </View>

      {/* Expiration Info */}
      <View style={tw`flex-row justify-between items-center`}>
        <View style={tw`flex-row items-center`}>
          <Calendar size={14} color="#5669FF" />
          <Text style={tw`text-gray-400 text-xs ml-2`}>
            {permission.expiresAt
              ? `Expires: ${formatDate(permission.expiresAt)}`
              : "No expiration"}
          </Text>
        </View>
        <View style={tw`flex-row items-center`}>
          <Clock size={14} color="#5669FF" />
          <Text style={tw`text-gray-400 text-xs ml-2`}>
            {new Date(permission.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default PermissionCard;
