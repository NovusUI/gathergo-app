import { Shield } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import tw from "twrnc";

interface PermissionBadgeProps {
  eventName: string;
  expiresAt?: string;
}

const PermissionBadge: React.FC<PermissionBadgeProps> = ({
  eventName,
  expiresAt,
}) => {
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
  const isExpiringSoon = expiresAt
    ? new Date(expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    : false;

  const getBadgeColor = () => {
    if (isExpired) return "#FF5757";
    if (isExpiringSoon) return "#FF932E";
    return "#0FF1CF";
  };

  const formatExpiration = () => {
    if (!expiresAt) return "No expiration";

    const date = new Date(expiresAt);
    const now = new Date();
    const diffDays = Math.floor(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Expires today";
    if (diffDays === 1) return "Expires tomorrow";
    if (diffDays < 7) return `Expires in ${diffDays} days`;

    return `Expires ${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`;
  };

  return (
    <View
      style={[
        tw`px-3 py-2 rounded-lg flex-row items-center`,
        { backgroundColor: `${getBadgeColor()}20` },
      ]}
    >
      <Shield size={14} color={getBadgeColor()} />
      <View style={tw`ml-2`}>
        <Text
          style={[tw`text-sm font-medium`, { color: getBadgeColor() }]}
          numberOfLines={1}
        >
          {eventName}
        </Text>
        <Text style={tw`text-gray-400 text-xs`}>{formatExpiration()}</Text>
      </View>
    </View>
  );
};

export default PermissionBadge;
