import { usePressGuard } from "@/hooks/usePressGuard";
import { ChevronLeft } from "lucide-react-native";
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
  const guardedBackPress = usePressGuard(onClickBack);
  const guardedRightPress = usePressGuard(onClickRight);

  return (
    <View
      style={tw`flex-row justify-between items-center w-full max-w-[500px]`}
    >
      {/* Left Section */}
      <View style={tw`flex-row items-center gap-2`}>
        <TouchableOpacity onPress={guardedBackPress} style={tw`p-2`}>
          <ChevronLeft color={"white"} />
        </TouchableOpacity>
        <Text style={tw`text-white text-lg font-semibold`}>{title}</Text>
      </View>

      {/* Right Section */}
      <TouchableOpacity
        onPress={guardedRightPress}
        style={tw`flex-row items-center gap-2`}
      >
        {rightIcon && <Image source={rightIcon} style={tw`w-6 h-6`} />}
        {Boolean(rightText) && (
          <Text style={tw`text-white text-base`}>{rightText}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default CustomeTopBarNav;
