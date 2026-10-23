import { useAppTheme } from "@/hooks/useAppTheme";
import type { ThemeColor } from "@/constants/theme";
import { usePressGuard } from "@/hooks/usePressGuard";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export default function SkipOnboardingButton({
  onPress,
}: {
  onPress: () => void;
}) {
  const { color } = useAppTheme();
  const styles = createStyles(color);
  const guardedOnPress = usePressGuard(onPress);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Skip onboarding"
      onPress={guardedOnPress}
      style={styles.button}
    >
      <Text style={styles.label}>Skip</Text>
    </TouchableOpacity>
  );
}

const createStyles = (color: ThemeColor) => StyleSheet.create({
  button: {
    minHeight: 44,
    minWidth: 64,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: color("#C5D0F7", "secondary"),
    fontSize: 15,
    fontWeight: "600",
  },
});
