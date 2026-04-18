import { View } from "react-native";
import tw from "twrnc";

interface ProgressIndicatorProps {
  percentage: number; // Value between 0 and 100
}

const ProgressIndicator = ({ percentage }: ProgressIndicatorProps) => {
  const height = 10; // Height of the container
  const filledHeight = (percentage / 100) * 40;

  return (
    <View
      style={tw`h-${height} w-1 rounded-full bg-gray-700 overflow-hidden flex flex-col justify-end`}
    >
      <View
        style={[
          tw`w-full bg-[#FBBE47] rounded-full`,
          { height: `${filledHeight}`, minHeight: 0 },
        ]}
      />
    </View>
  );
};

export default ProgressIndicator;
