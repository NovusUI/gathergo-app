import { usePressGuard } from "@/hooks/usePressGuard";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import tw from "twrnc";

export default function SheetCloseButton({
  onPress,
  accessibilityLabel = "Close sheet",
  disabled = false,
}: {
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
}) {
  const guardedOnPress = usePressGuard(onPress);
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={disabled ? undefined : guardedOnPress}
      style={[
        tw`h-11 w-11 items-center justify-center`,
        disabled ? tw`opacity-40` : null,
      ]}
    >
      <Ionicons name="close" size={24} color="#9FB0D8" />
    </TouchableOpacity>
  );
}
