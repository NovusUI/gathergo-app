import { Text, View } from "react-native";
import tw from "twrnc";

export default function StatsCard({
  eventsCount,
  followersCount,
  followingCount,
}: {
  eventsCount: number;
  followersCount: number;
  followingCount: number;
}) {
  const stats = [
    { label: "Events", value: eventsCount },
    { label: "Followers", value: followersCount },
    { label: "Following", value: followingCount },
  ];
  return (
    <View style={tw`flex-1 flex-row items-center`}>
      {stats.map(({ label, value }) => (
        <View
          key={label}
          accessible
          accessibilityLabel={`${value} ${label.toLowerCase()}`}
          style={tw`flex-1 items-center gap-1`}
        >
          <Text style={tw`text-lg font-bold text-white`}>{value}</Text>
          <Text style={tw`text-[11px] text-[#AFC0E7]`} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}
