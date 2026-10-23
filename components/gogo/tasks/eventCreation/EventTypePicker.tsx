import { GatherGoMascot } from "@/components/gogo/mascot/GatherGoMascot";
import { EVENT_CREATION_OPTIONS } from "@/components/gogo/tasks/eventCreation/options";
import type { Registration } from "@/types/auth";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

export default function EventTypePicker({
  onSelect,
}: {
  onSelect: (type: Registration) => void;
}) {
  return (
    <ScrollView contentContainerStyle={tw`grow justify-center gap-6 px-6 py-8`}>
      <GatherGoMascot
        variant="idle"
        size={96}
        showBadge={false}
        style={tw`self-center`}
      />
      <Text
        accessibilityRole="header"
        style={tw`text-center text-2xl font-semibold leading-8 text-white`}
      >
        How will people take part?
      </Text>
      <View style={tw`gap-3`}>
        {EVENT_CREATION_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.type}
            accessibilityRole="button"
            accessibilityLabel={option.title}
            onPress={() => onSelect(option.type)}
            style={tw`min-h-[80px] flex-row items-center gap-4 rounded-2xl border border-[#24345A] bg-[#101C45] p-4`}
          >
            <Ionicons name={option.icon} size={24} color="#0FF1CF" />
            <View style={tw`flex-1 gap-1`}>
              <Text style={tw`text-base font-semibold text-white`}>
                {option.title}
              </Text>
              <Text style={tw`text-sm text-[#AFC0F4]`}>{option.hint}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8FA1CB" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
