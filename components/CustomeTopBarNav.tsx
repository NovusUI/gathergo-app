import { useAppTheme } from "@/hooks/useAppTheme";
import type { ReactNode } from "react";
import { usePressGuard } from "@/hooks/usePressGuard";
import { ChevronLeft } from "lucide-react-native";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface Props {
  title: string;
  onClickBack: () => void;
  rightIcon?: any;
  rightText?: string;
  rightNode?: ReactNode;
  onClickRight?: () => void;
}

const CustomeTopBarNav = ({
  title,
  onClickBack,
  onClickRight,
  rightIcon,
  rightNode,
  rightText,
}: Props) => {
  const { tw, color } = useAppTheme();
  const guardedBackPress = usePressGuard(onClickBack);
  const guardedRightPress = usePressGuard(onClickRight);

  return (
    <View
      style={tw`flex-row justify-between items-center w-full max-w-[500px] gap-3`}
    >
      {/* Left Section */}
      <View style={tw`flex-row items-center gap-2 flex-1 min-w-0`}>
        <TouchableOpacity onPress={guardedBackPress} style={tw`p-2`}>
          <ChevronLeft color={color("white", "foreground")} />
        </TouchableOpacity>
        <Text
          style={tw`text-foreground dark:text-white text-lg font-semibold flex-1`}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      {/* Right Section */}
      {rightNode ? (
        <View style={tw`flex-row items-center`}>{rightNode}</View>
      ) : rightIcon || rightText ? (
        <TouchableOpacity
          onPress={guardedRightPress}
          style={tw`flex-row items-center gap-2`}
        >
          {rightIcon && <Image source={rightIcon} style={tw`w-6 h-6`} />}
          {Boolean(rightText) && (
            <Text style={tw`text-foreground dark:text-white text-base`}>{rightText}</Text>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default CustomeTopBarNav;
