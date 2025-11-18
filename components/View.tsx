import { ReactNode } from "react";
import { View, ViewStyle } from "react-native";
import tw from "twrnc";

interface CustomViewProps {
  children?: ReactNode;
  className?: string; // still allowed
  style?: ViewStyle; // allows inline style merging
}

const CustomView = ({ children, className, style }: CustomViewProps) => {
  return (
    <View
      style={[
        tw`w-full max-w-125 my-2`,
        className ? tw`${className}` : {},
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default CustomView;
