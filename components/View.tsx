import { useAppTheme } from "@/hooks/useAppTheme";
import { ReactNode } from "react";
import { View, ViewStyle } from "react-native";

interface CustomViewProps {
  children?: ReactNode;
  className?: string; // still allowed
  style?: ViewStyle; // allows inline style merging
}

const CustomView = ({ children, className, style }: CustomViewProps) => {
  const { tw } = useAppTheme();
  return (
    <View
      style={[
        tw`w-full my-2`,
        className ? tw`${className}` : {},
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default CustomView;
