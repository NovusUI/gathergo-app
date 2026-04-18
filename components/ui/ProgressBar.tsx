import { View } from "react-native";
import tw from "twrnc";

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
}

const ProgressBar = ({ progress, height = 12 }: ProgressBarProps) => {
  return (
    <View style={[tw`bg-[#1B2A50] rounded-full overflow-hidden`, { height }]}>
      <View
        style={[
          tw`bg-[#5669FF] rounded-full`,
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
