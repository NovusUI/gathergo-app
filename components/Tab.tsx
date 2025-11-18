import { Text, TouchableOpacity } from "react-native";
import tw from "twrnc";

interface Props {
  title: string;
  isActive: boolean;
  className?: string;
  onPress: () => void;
  key?: number;
}

const Tab = ({ isActive, title, className = "", onPress }: Props) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={tw.style(
        `flex-row justify-center items-center rounded-xl h-10 px-3`,
        isActive ? "bg-[#0FF1CF]" : "bg-[#01082E]",
        className
      )}
    >
      <Text style={tw.style(isActive ? "text-black" : "text-[#0FF1CF]")}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default Tab;
