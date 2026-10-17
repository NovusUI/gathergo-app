import { numberWithCommas } from "@/utils/utils";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

const DontationProgress = (props: {
  donationTarget: number;
  totalDonations: number;
  onAction?: (action: any) => void;
}) => {
  return (
    <TouchableOpacity
      style={tw`mb-3`}
      onPress={() => props.onAction?.({ type: "DONATE" })}
    >
      <Text style={tw`text-[#0FF1CF] font-bold text-lg mb-1`}>
        ₦{numberWithCommas(props.donationTarget, false, null)} Goal
      </Text>
      <View style={tw`h-2 bg-gray-700 rounded-full overflow-hidden`}>
        <View
          style={[
            tw`h-full bg-[#0FF1CF] rounded-full`,
            {
              width: `${Math.min(
                ((props.totalDonations / 100 || 0) / props.donationTarget) *
                  100,
                100
              )}%`,
            },
          ]}
        />
      </View>
      <Text style={tw`text-gray-400 text-xs mt-1`}>
        ₦{numberWithCommas((props.totalDonations || 0) / 100, false, null)}{" "}
        raised
      </Text>
    </TouchableOpacity>
  );
};

export default DontationProgress;
