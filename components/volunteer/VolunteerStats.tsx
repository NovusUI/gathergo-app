import { useAppTheme } from "@/hooks/useAppTheme";
import type { VolunteerSummary } from "@/types/volunteer";
import { Text, View } from "react-native";

export default function VolunteerStats({
  summary,
}: {
  summary: VolunteerSummary;
}) {
  const { tw } = useAppTheme();
  const items = [
    {
      label: "Confirmed places",
      value: `${summary.confirmedPlaces}/${summary.capacity}`,
    },
    { label: "Awaiting approval", value: String(summary.counts.APPLIED) },
    { label: "Attended", value: String(summary.attended) },
    {
      label: "Confirmed hours",
      value: summary.confirmedHours.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      }),
    },
  ];
  return (
    <View style={tw`flex-row flex-wrap gap-3`}>
      {items.map((item) => (
        <View
          key={item.label}
          style={tw`min-w-[130px] flex-1 rounded-2xl bg-surface dark:bg-[#101C45] p-4`}
        >
          <Text style={tw`text-xl font-bold text-accent dark:text-[#0FF1CF]`}>{item.value}</Text>
          <Text style={tw`mt-1 text-xs text-secondary dark:text-[#A8BAE4]`}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
