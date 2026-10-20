import CustomButton from "@/components/buttons/CustomBtn1";
import { usePressGuard } from "@/hooks/usePressGuard";
import { Ionicons } from "@expo/vector-icons";
import { canRecruitVolunteers } from "@/utils/volunteer";
import type { EventDetails } from "@/types/event";
import { Text, TouchableOpacity } from "react-native";
import tw from "twrnc";

export default function VolunteerButton({
  event,
  hasEventEnded,
  onPress,
  variant = "compact",
  purpose = "volunteer",
}: {
  event: Pick<
    EventDetails,
    | "volunteerRoles"
    | "isPhysicalEvent"
    | "registrationType"
    | "impactTitle"
    | "impactDescription"
  >;
  hasEventEnded: boolean;
  onPress: () => void;
  variant?: "primary" | "compact" | "icon";
  purpose?: "volunteer" | "manage";
}) {
  const guardedOnPress = usePressGuard(onPress);
  const eligible = canRecruitVolunteers(event);
  const manage = purpose === "manage";
  const title = manage ? "Manage volunteers" : "Volunteer";
  if (
    manage
      ? !eligible && event.volunteerRoles.length === 0
      : hasEventEnded || event.volunteerRoles.length === 0 || !eligible
  )
    return null;

  if (variant === "primary") {
    return (
      <CustomButton
        title={title}
        showArrow={false}
        buttonClassName="w-full bg-[#0FF1CF] border-0"
        textClassName="!text-[#01082E]"
        onPress={onPress}
      />
    );
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={
        manage
          ? "Open volunteer roles, applications and attendance"
          : "View available volunteer roles"
      }
      onPress={guardedOnPress}
      style={
        variant === "icon"
          ? tw`h-11 w-11 items-center justify-center rounded-lg bg-[#0c1447]`
          : tw`min-h-[44px] self-center flex-row items-center justify-center gap-1.5 rounded-full border border-[#0FF1CF]/30 bg-[#101C45] px-3 py-2`
      }
    >
      <Ionicons
        name="people-outline"
        size={variant === "icon" ? 21 : 17}
        color="#0FF1CF"
      />
      {variant === "compact" ? (
        <Text
          numberOfLines={1}
          style={tw`text-xs font-semibold text-[#0FF1CF]`}
        >
          {title}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}
