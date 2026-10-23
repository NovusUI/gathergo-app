import { useAppTheme } from "@/hooks/useAppTheme";
import { numberWithCommas } from "@/utils/utils";
import { Text, TouchableOpacity, View } from "react-native";

const DontationProgress = (props: {
  donationTarget: number | null;
  totalDonations: number;
  onAction?: (action: { type: "DONATE" }) => void;
}) => {
  const { tw } = useAppTheme();
  return (
    <TouchableOpacity
      style={tw`mb-3`}
      disabled={!props.onAction}
      accessibilityRole={props.onAction ? "button" : undefined}
      onPress={() => props.onAction?.({ type: "DONATE" })}
    >
      {props.donationTarget !== null ? (
        <>
          <Text style={tw`text-accent dark:text-[#0FF1CF] font-bold text-lg mb-1`}>
            ₦{numberWithCommas(props.donationTarget / 100, false, null)} Goal
          </Text>
          <View style={tw`h-2 bg-surfaceMuted dark:bg-gray-700 rounded-full overflow-hidden`}>
            <View
              style={[
                tw`h-full bg-accentFill dark:bg-[#0FF1CF] rounded-full`,
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
      <Text style={tw`text-muted dark:text-gray-400 text-xs mt-1`}>
        ₦{numberWithCommas(props.totalDonations / 100, false, null)} raised
      </Text>
    </TouchableOpacity>
  );
};

export default DontationProgress;
