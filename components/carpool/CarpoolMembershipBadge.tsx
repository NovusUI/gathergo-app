import { useAppTheme } from "@/hooks/useAppTheme";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function CarpoolMembershipBadge() {
  const { tw, color } = useAppTheme();

  return (
    <View
      accessible
      accessibilityLabel="Your ride. You are part of this carpool"
      style={tw`flex-row items-center gap-1.5`}
    >
      <Ionicons
        name="checkmark-circle"
        size={13}
        color={color("#8FCBFF", "info")}
        accessible={false}
      />
      <Text style={tw`text-xs font-semibold text-info dark:text-[#8FCBFF]`}>
        Your ride
      </Text>
    </View>
  );
}
