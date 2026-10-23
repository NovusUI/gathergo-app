import { usePressGuard } from "@/hooks/usePressGuard";
import type { EventDetails } from "@/types/event";
import { canRecruitVolunteers } from "@/utils/volunteer";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

export default function EventVolunteering({
  event,
  owner,
  onPress,
}: {
  event: EventDetails;
  owner: boolean;
  onPress: () => void;
}) {
  const guardedOnPress = usePressGuard(onPress);
  const visible =
    canRecruitVolunteers(event) && (owner || event.volunteerRoles.length > 0);
  if (!visible) return null;
  const roleCount = event.volunteerRoles.length;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Give your time"
      accessibilityHint="Open the list of volunteer roles"
      onPress={guardedOnPress}
      activeOpacity={0.85}
      style={tw`overflow-hidden rounded-3xl border border-[#0FF1CF]/35 bg-[#082A35] p-5`}
    >
      <View style={tw`flex-row items-center gap-3`}>
        <View
          style={tw`h-12 w-12 items-center justify-center rounded-2xl border border-[#0FF1CF]/25 bg-[#0FF1CF]/15`}
        >
          <Ionicons name="people-outline" size={26} color="#0FF1CF" />
        </View>
        <View style={tw`flex-1 gap-1`}>
          <Text
            style={tw`text-[10px] font-bold uppercase tracking-widest text-[#7FEBD9]`}
          >
            Volunteer in person
          </Text>
          <Text style={tw`text-xl font-semibold text-white`}>
            Give your time
          </Text>
        </View>
      </View>
      <Text style={tw`mt-3 text-sm leading-5 text-[#C1DFDF]`}>
        Bring your energy. Make a difference together.
      </Text>
      <View
        style={tw`mt-4 flex-row items-center justify-between gap-3 border-t border-[#0FF1CF]/15 pt-3`}
      >
        <Text style={tw`flex-1 text-xs text-[#A4CBC9]`}>
          {roleCount === 0
            ? "Set up volunteer roles"
            : `${roleCount} ${roleCount === 1 ? "role" : "roles"} to explore`}
        </Text>
        <View style={tw`flex-row items-center gap-2`}>
          <Text style={tw`text-sm font-semibold text-[#0FF1CF]`}>
            View roles
          </Text>
          <View
            style={tw`h-8 w-8 items-center justify-center rounded-full bg-[#0FF1CF]`}
          >
            <Ionicons name="arrow-forward" size={17} color="#082A35" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
