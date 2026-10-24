import { useAppTheme } from "@/hooks/useAppTheme";
import { ChevronRight, Mail, User } from "lucide-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface UserSearchResultProps {
  user: {
    id: string;
    email: string;
    username: string;
    fullName: string;
    profilePicUrl: string;
    profilePicUrlTN: string;
  };
  onSelect: () => void;
}

const UserSearchResult: React.FC<UserSearchResultProps> = ({
  user,
  onSelect,
}) => {
  const { tw, color } = useAppTheme();
  return (
    <TouchableOpacity
      style={tw`bg-surfaceMuted dark:bg-[#1B2A50] rounded-xl p-4 mb-3 flex-row items-center`}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      {/* Avatar */}
      {user.profilePicUrl || user.profilePicUrlTN ? (
        <Image
          source={{ uri: user.profilePicUrlTN || user.profilePicUrl }}
          style={tw`w-12 h-12 rounded-full`}
        />
      ) : (
        <View
          style={tw`w-12 h-12 rounded-full bg-primary dark:bg-[#5669FF] items-center justify-center`}
        >
          <User size={20} color={color("white", "onPrimary")} />
        </View>
      )}

      {/* User Info */}
      <View style={tw`flex-1 ml-4`}>
        <Text style={tw`text-foreground dark:text-white font-semibold`}>
          {user.fullName || user.username || "User"}
        </Text>
        {Boolean(user.username) && (
          <Text style={tw`text-muted dark:text-gray-400 text-sm`}>@{user.username}</Text>
        )}
        <View style={tw`flex-row items-center mt-1`}>
          <Mail size={12} color={color("#6B7280", "muted")} />
          <Text style={tw`text-muted dark:text-gray-400 text-xs ml-1`}>{user.email}</Text>
        </View>
      </View>

      {/* Select Indicator */}
      <ChevronRight size={20} color={color("#5669FF", "primary")} />
    </TouchableOpacity>
  );
};

export default UserSearchResult;
