import type { EventFeedbackResult } from "@/types/preferences";
import { Text, View } from "react-native";
import tw from "twrnc";

export function SurveyMapChange({
  changes,
}: Pick<EventFeedbackResult, "changes">) {
  return (
    <View
      accessibilityLiveRegion="polite"
      style={tw`rounded-3xl border border-[#24345A] bg-[#101C45] p-4 gap-3`}
    >
      <Text
        accessibilityRole="header"
        style={tw`text-xs tracking-wider font-bold text-[#AFC0E7]`}
      >
        {changes.length ? "YOUR MAP JUST CHANGED" : "YOUR ANSWER IS SAVED"}
      </Text>
      {changes.slice(0, 3).map((topic) => (
        <View key={topic.id} style={tw`gap-1`}>
          <View style={tw`flex-row justify-between gap-2`}>
            <Text style={tw`text-sm font-semibold text-white`}>
              {topic.label}
            </Text>
            <Text style={tw`text-xs text-[#AFC0E7]`}>
              {topic.weight > topic.previousWeight ? "More" : "Less"} in your
              mix
            </Text>
          </View>
          <View
            accessible
            accessibilityLabel={`${topic.label}: ${topic.previousWeight} before, ${topic.weight} now`}
            style={tw`h-3 rounded-full overflow-hidden bg-[#24345A]`}
          >
            <View
              style={[
                tw`absolute left-0 top-0 bottom-0 rounded-full bg-[#304164]`,
                {
                  width: `${(topic.previousWeight / 8) * 100}%`,
                },
              ]}
            />
            <View
              style={[
                tw`absolute left-0 top-0 bottom-0 rounded-full`,
                {
                  width: `${(topic.weight / 8) * 100}%`,
                  backgroundColor: topic.accent,
                },
              ]}
            />
            <View
              style={[
                tw`absolute top-0 bottom-0 bg-white`,
                {
                  width: 2,
                  left: `${(topic.previousWeight / 8) * 100}%`,
                  marginLeft: -1,
                },
              ]}
            />
          </View>
        </View>
      ))}
      <Text style={tw`text-xs leading-5 text-[#AFC0E7]`}>
        {changes.length
          ? "The small marker shows where your map was before. Your chosen interests stay yours to edit."
          : "Thanks for telling me. Your feed will use this answer, even when the map’s topic bars stay the same."}
      </Text>
    </View>
  );
}
