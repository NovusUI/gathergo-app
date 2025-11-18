import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

interface CustomButtonProps {
  onPress: () => void;
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
  arrowCircleColor = "bg-white",
  buttonClassName = "",
  textClassName = "",
  arrowClassName = "",
  arrowText = "→",
  disabled = false,
}: CustomButtonProps) => {
  return (
    <TouchableOpacity
      style={tw.style(
        `flex-row justify-center items-center border border-white rounded-xl w-[300px] p-5 max-w-[500px]`,
        buttonClassName,
        disabled ? "opacity-50" : "opacity-100"
      )}
      onPress={!disabled ? onPress : undefined}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <Text
        style={tw.style(`text-white font-bold mr-2 uppercase`, textClassName)}
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
          <Text style={tw`text-white text-lg`}>{arrowText}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default CustomButton;
