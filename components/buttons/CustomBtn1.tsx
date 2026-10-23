import { useAppTheme } from "@/hooks/useAppTheme";
import { usePressGuard } from "@/hooks/usePressGuard";
import { Text, TouchableOpacity, View } from "react-native";

interface CustomButtonProps {
  onPress: () => void | Promise<void>;
  title?: string;
  showArrow?: boolean;
  arrowCircleColor?: string;
  buttonClassName?: string;
  textClassName?: string;
  arrowClassName?: string;
  arrowText?: string;
  disabled?: boolean; // new prop
}

const CustomButton: React.FC<CustomButtonProps> = ({
  onPress,
  title = "GET STARTED",
  showArrow = true,
  arrowCircleColor = "bg-surface dark:bg-white",
  buttonClassName = "",
  textClassName = "",
  arrowClassName = "",
  arrowText = "→",
  disabled = false,
}: CustomButtonProps) => {
  const { tw, color } = useAppTheme();
  const guardedOnPress = usePressGuard(onPress);
  const hasTealButtonBackground = buttonClassName.includes("bg-accentFill dark:bg-[#0FF1CF]");
  const hasTealArrowBackground =
    arrowCircleColor.includes("bg-accentFill dark:bg-[#0FF1CF]") ||
    arrowClassName.includes("bg-accentFill dark:bg-[#0FF1CF]");
  const tealTextStyle = hasTealButtonBackground ? { color: color("#01082E", "onAccent") } : null;
  const tealArrowTextStyle = hasTealArrowBackground
    ? { color: color("#01082E", "onAccent") }
    : null;

  return (
    <TouchableOpacity
      style={tw.style(
        `flex-row justify-center items-center border border-borderStrong dark:border-white rounded-xl w-[300px] p-5 max-w-[500px]`,
        buttonClassName,
        disabled ? "opacity-50" : "opacity-100"
      )}
      onPress={!disabled ? guardedOnPress : undefined}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <Text
        style={tw.style(
          `text-foreground dark:text-white font-bold mr-2 uppercase`,
          textClassName,
          tealTextStyle
        )}
      >
        {title}
      </Text>

      {showArrow && (
        <View
          style={tw.style(
            `rounded-full justify-center items-center absolute right-5`,
            arrowCircleColor,
            arrowClassName,
            { width: 32, height: 32 } // equivalent to w-8 h-8
          )}
        >
          <Text
            style={tw.style(
              `text-foreground dark:text-white text-lg`,
              tealArrowTextStyle
            )}
          >
            {arrowText}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default CustomButton;
