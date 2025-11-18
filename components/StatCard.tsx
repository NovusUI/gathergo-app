import { Text, View } from "react-native";
import tw from "twrnc";

export default function StatsCard({
  eventsCount = 0,
  followersCount = 0,
  followingCount = 0,
}: {
  eventsCount: number;
  followersCount: number;
  followingCount: number;
}) {
  return (
    <View
      style={tw`flex-row items-center justify-between bg-[#0B1532] rounded-2xl p-5 flex-1`}
    >
      {/* Events */}
      <View style={tw`flex-1 items-center`}>
        <Text style={tw`text-white text-2xl font-bold`}>{eventsCount}</Text>
        <Text style={tw`text-gray-400 text-xs`}>Events</Text>
      </View>

      {/* Divider */}
      <View style={tw`w-px bg-gray-600 mx-3 h-8`} />

      {/* Followers */}
      <View style={tw`flex-1 items-center`}>
        <Text style={tw`text-white text-2xl font-bold`}>{followersCount}</Text>
        <Text style={tw`text-gray-400 text-xs`} numberOfLines={1}>
          Followers
        </Text>
      </View>

      {/* Divider */}
      <View style={tw`w-px bg-gray-600 mx-3 h-8`} />

      {/* Following */}
      <View style={tw`flex-1 items-center`}>
        <Text style={tw`text-white text-2xl font-bold`}>{followingCount}</Text>
        <Text style={tw`text-gray-400 text-xs`} numberOfLines={1}>
          Following
        </Text>
      </View>
    </View>
  );
}
