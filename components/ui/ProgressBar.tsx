import { useAppTheme } from "@/hooks/useAppTheme";
import { View } from "react-native";

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
}

const ProgressBar = ({ progress, height = 12 }: ProgressBarProps) => {
  const { tw } = useAppTheme();
  return (
    <View style={[tw`bg-surfaceMuted dark:bg-[#1B2A50] rounded-full overflow-hidden`, { height }]}>
      <View
        style={[
          tw`bg-primary dark:bg-[#5669FF] rounded-full`,
          {
            width: `${Math.min(progress, 100)}%`,
            height,
          },
        ]}
      />
    </View>
  );
};

export default ProgressBar;
