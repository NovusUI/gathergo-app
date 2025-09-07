import { Text, View } from "react-native";

export default function StatsCard({eventsCount=0, followersCount=0,followingCount=0}:{eventsCount:number, followersCount:number,followingCount:number}) {
  return (
    <View className="flex-row  items-center justify-between bg-[#0B1532] rounded-2xl p-5 flex-1">
      {/* Events */}
      <View className="flex-1 items-center">
        <Text className="text-white text-2xl font-bold">{eventsCount}</Text>
        <Text className="text-gray-400 text-sm">Events</Text>
      </View>

      {/* Divider */}
      <View className="w-px bg-gray-600 mx-3 sm:mx-5 h-8" />

      {/* Followers */}
      <View className="flex-1 items-center">
        <Text className="text-white text-2xl font-bold">{followersCount}</Text>
        <Text className="text-gray-400 text-sm" numberOfLines={1} >Followers</Text>
      </View>

      {/* Divider */}
      <View className="w-px bg-gray-600 mx-3 sm:mx-5 h-8" />

      {/* Following */}
      <View className="flex-1 items-center">
        <Text className="text-white text-2xl font-bold" >{followingCount}</Text>
        <Text className="text-gray-400 text-sm text-ellipsis" numberOfLines={1}>Following</Text>
      </View>
    </View>
  );
}
