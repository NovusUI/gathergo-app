import { useAppTheme } from "@/hooks/useAppTheme";
import { Text, View } from "react-native";

export default function StatsCard({
  eventsCount,
  followersCount,
  followingCount,
}: {
  eventsCount: number;
  followersCount: number;
  followingCount: number;
}) {
  const { tw } = useAppTheme();
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
          <Text style={tw`text-lg font-bold text-foreground dark:text-white`}>{value}</Text>
          <Text style={tw`text-[11px] text-secondary dark:text-[#AFC0E7]`} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}
