import { Text, TouchableOpacity } from "react-native";
import { style as twStyle } from "twrnc";

interface Props {
  title: string;
  isActive: boolean;
  className?: string;
  onPress: () => void;
}

const Tab = ({ isActive, title, className = "", onPress }: Props) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={twStyle(
        `flex-row justify-center items-center rounded-xl h-10 px-3`,
        isActive ? "bg-[#0FF1CF]" : "bg-[#01082E]",
        className
      )}
    >
      <Text style={twStyle(isActive ? "text-black" : "text-[#0FF1CF]")}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default Tab;
