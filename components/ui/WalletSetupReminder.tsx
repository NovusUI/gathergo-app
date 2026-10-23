import { MascotMoment } from "@/components/gogo/mascot/MascotMoment";
import type { WalletOnboardingData } from "@/types/wallet";
import { Text, TouchableOpacity } from "react-native";
import tw from "twrnc";

type Props = Pick<WalletOnboardingData, "nextAction"> & { onPress: () => void };

export default function WalletSetupReminder({ nextAction, onPress }: Props) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Open wallet to finish setup"
      onPress={onPress}
    >
      <MascotMoment
        variant="pending"
        title="Let's finish your wallet"
        typing={false}
        message={
          nextAction === "ADD_SETTLEMENT_ACCOUNT"
            ? "Add your settlement account to unlock creator payouts."
            : nextAction === "COMPLETE_KYC"
              ? "Complete verification so your earnings can be settled."
              : "Finish wallet setup to enable ALAT transfer."
        }
      />
      <Text style={tw`text-[#0FF1CF] text-sm font-semibold mt-3 ml-3`}>
        Open wallet →
      </Text>
    </TouchableOpacity>
  );
}
