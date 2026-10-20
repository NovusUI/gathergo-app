import { numberWithCommas } from "@/utils/utils";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

const DontationProgress = (props: {
  donationTarget: number | null;
  totalDonations: number;
  onAction?: (action: { type: "DONATE" }) => void;
}) => {
  return (
    <TouchableOpacity
      style={tw`mb-3`}
      disabled={!props.onAction}
      accessibilityRole={props.onAction ? "button" : undefined}
      onPress={() => props.onAction?.({ type: "DONATE" })}
    >
      {props.donationTarget !== null ? (
        <>
          <Text style={tw`text-[#0FF1CF] font-bold text-lg mb-1`}>
            ₦{numberWithCommas(props.donationTarget / 100, false, null)} Goal
          </Text>
          <View style={tw`h-2 bg-gray-700 rounded-full overflow-hidden`}>
            <View
              style={[
                tw`h-full bg-[#0FF1CF] rounded-full`,
                {
                  width: `${Math.min(
                    (props.totalDonations / props.donationTarget) * 100,
                    100,
                  )}%`,
                },
              ]}
            />
          </View>
        </>
      ) : null}
      <Text style={tw`text-gray-400 text-xs mt-1`}>
        ₦{numberWithCommas(props.totalDonations / 100, false, null)} raised
      </Text>
    </TouchableOpacity>
  );
};

export default DontationProgress;
