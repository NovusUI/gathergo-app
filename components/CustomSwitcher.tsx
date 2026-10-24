import { Switch, View } from "react-native";

interface Props {
  isEnabled: boolean;
  setIsEnabled: (isEnabled: boolean) => void;
  accessibilityLabel?: string;
  disabled?: boolean;
}
const CustomSwitcher = ({
  isEnabled,
  setIsEnabled,
  accessibilityLabel,
  disabled,
}: Props) => {
  return (
    <View className="flex-row items-center">
      <Switch
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        trackColor={{ false: "#e5e7eb", true: "#1B2A50" }} // Tailwind gray-200 / blue-500
        thumbColor={isEnabled ? "#0FF1CF" : "#555"}
        value={isEnabled}
        onValueChange={setIsEnabled}
      />
    </View>
  );
};

export default CustomSwitcher;
