import { ArrowLeft } from "lucide-react-native";
import { Image, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

interface Props {
  title: string;
  onClickBack: () => void;
  rightIcon?: any;
  rightText?: string;
  onClickRight?: () => void;
}

const CustomeTopBarNav = ({
  title,
  onClickBack,
  onClickRight,
  rightIcon,
  rightText,
}: Props) => {
  return (
    <View
      style={tw`flex-row justify-between items-center w-full max-w-[500px]`}
    >
      {/* Left Section */}
      <View style={tw`flex-row items-center gap-2`}>
        <TouchableOpacity onPress={onClickBack} style={tw`p-2`}>
          <ArrowLeft color="white" />
        </TouchableOpacity>
        <Text style={tw`text-white text-lg font-semibold`}>{title}</Text>
      </View>

      {/* Right Section */}
      <TouchableOpacity
        onPress={onClickRight}
        style={tw`flex-row items-center gap-2`}
      >
        {rightIcon && <Image source={rightIcon} style={tw`w-6 h-6`} />}
        {rightText && <Text style={tw`text-white text-base`}>{rightText}</Text>}
      </TouchableOpacity>
    </View>
  );
};

export default CustomeTopBarNav;
