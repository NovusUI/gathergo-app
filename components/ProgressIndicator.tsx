import { useAppTheme } from "@/hooks/useAppTheme";
import { View } from "react-native";

interface ProgressIndicatorProps {
  percentage: number; // Value between 0 and 100
}

const ProgressIndicator = ({ percentage }: ProgressIndicatorProps) => {
  const { tw } = useAppTheme();
  const height = 10; // Height of the container
  const filledHeight = (percentage / 100) * 40;

  return (
    <View
      style={tw`h-${height} w-1 rounded-full bg-surfaceMuted dark:bg-gray-700 overflow-hidden flex flex-col justify-end`}
    >
      <View
        style={[
          tw`w-full bg-warningFill dark:bg-[#FBBE47] rounded-full`,
          { height: `${filledHeight}`, minHeight: 0 },
        ]}
      />
    </View>
  );
};

export default ProgressIndicator;
