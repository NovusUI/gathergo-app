import { useAppTheme } from "@/hooks/useAppTheme";
import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Text, TouchableOpacity, type TouchableOpacityProps } from "react-native";

interface Props extends Pick<TouchableOpacityProps, "accessibilityActions" | "onAccessibilityAction"> {
  title: string;
  isActive: boolean;
  className?: string;
  onPress: () => void;
  iconContent?: ReactNode;
  icon?:
    | { library: "Ionicons"; name: keyof typeof Ionicons.glyphMap }
    | { library: "Feather"; name: keyof typeof Feather.glyphMap }
    | { library: "FontAwesome5"; name: keyof typeof FontAwesome5.glyphMap };
}

const Tab = ({
  isActive,
  title,
  className = "",
  icon,
  iconContent,
  onPress,
  accessibilityActions,
  onAccessibilityAction,
}: Props) => {
  const { tw, color } = useAppTheme();
  const twStyle = tw.style;
  const renderIcon = () => {
    if (!icon) return null;

    const iconSize = 18;
    const iconColor = isActive ? color("#01082E", "onAccent") : color("#0FF1CF", "accent");

    switch (icon.library) {
      case "Ionicons":
        return (
          <Ionicons name={icon.name as any} size={iconSize} color={iconColor} />
        );
      case "Feather":
        return (
          <Feather name={icon.name as any} size={iconSize} color={iconColor} />
        );
      case "FontAwesome5":
        return (
          <FontAwesome5
            name={icon.name as any}
            size={iconSize}
            color={iconColor}
          />
        );
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}
      style={twStyle(
        `flex-row justify-center items-center rounded-xl min-h-11 py-2 px-3 gap-x-2`,
        isActive ? "bg-accentFill dark:bg-[#0FF1CF]" : "bg-background dark:bg-[#01082E]",
        className
      )}
    >
      {iconContent ?? renderIcon()}
      <Text
        style={twStyle(
          "shrink text-center",
          isActive ? "text-onAccent dark:text-[#01082E] font-medium" : "text-accent dark:text-[#0FF1CF]"
        )}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default Tab;
