import { GogoOnboardingCarpoolArtwork } from "@/components/gogo/mascot/GogoOnboardingCarpoolArtwork";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { useIsFocused } from "@react-navigation/native";
import { ArrowUpRight } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

export default function ShareCarToEventCard({
  onPress,
}: {
  onPress: () => void;
}) {
  const { tw, color } = useAppTheme();
  const reducedMotion = useReducedMotionPreference();
  const focused = useIsFocused();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Share your car to event?"
      accessibilityHint="Opens the carpool creation sheet for this event"
      activeOpacity={0.9}
      onPress={onPress}
      style={tw`mt-4 overflow-hidden rounded-[28px] border border-border dark:border-[#24545B] bg-surfaceMuted dark:bg-[#071E38] p-4 gap-3`}
    >
      <View style={tw`flex-row items-center gap-2`}>
        <View style={tw`flex-1 min-w-0 gap-3`}>
          <View style={tw`self-start rounded-full bg-accentSoft dark:bg-[#123E45] px-3 py-1.5`}>
            <Text style={tw`text-[10px] font-bold uppercase tracking-wider text-accent dark:text-[#0FF1CF]`}>
              Go together
            </Text>
          </View>
          <Text style={tw`text-2xl leading-7 font-bold text-foreground dark:text-white`}>
            Got a spare seat?
          </Text>
        </View>
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={tw`shrink-0`}
        >
          <GogoOnboardingCarpoolArtwork
            width={132}
            height={139}
            animated={focused && !reducedMotion}
          />
        </View>
      </View>
      <Text style={tw`text-sm leading-5 text-secondary dark:text-[#C8E4E6]`}>
        Heading to the event? Make room for good company.
      </Text>
      <View style={tw`min-h-[52px] flex-row items-center gap-2 rounded-2xl bg-accentFill dark:bg-[#0FF1CF] px-3.5 py-3`}>
        <Text style={tw`flex-1 text-sm leading-5 font-bold text-onAccent dark:text-[#01082E]`}>
          Share your car to event?
        </Text>
        <View style={tw`h-8 w-8 shrink-0 items-center justify-center rounded-full bg-onAccent/10 dark:bg-[#01082E]/10`}>
          <ArrowUpRight size={18} color={color("#01082E", "onAccent")} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
