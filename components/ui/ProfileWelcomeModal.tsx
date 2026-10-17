import CustomButton from "@/components/buttons/CustomBtn1";
import { getProfileWelcomeCopy } from "@/constants/mascot";
import type { User } from "@/types/auth";
import { Modal, ScrollView, Text, View } from "react-native";
import tw from "twrnc";
import { GatherGoMascot } from "./GatherGoMascot";
import { MascotMessage } from "./MascotMessage";

type ProfileWelcomeModalProps = {
  profile: Pick<User, "fullName" | "birthDate">;
  onContinue: () => void;
};

export default function ProfileWelcomeModal({
  profile,
  onContinue,
}: ProfileWelcomeModalProps) {
  const copy = getProfileWelcomeCopy(
    profile.birthDate
      ? new Date(`${profile.birthDate.slice(0, 10)}T00:00:00`)
      : null,
  );

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onContinue}>
      <View
        style={tw`flex-1 items-center justify-center bg-black/75 px-5 py-10`}
      >
        <View
          accessibilityViewIsModal
          style={tw`w-full max-w-[430px] max-h-[90%] overflow-hidden rounded-[32px] border border-[#0FF1CF]/25 bg-[#07143B]`}
        >
          <View style={tw`h-1.5 flex-row`}>
            <View style={tw`flex-1 bg-[#0FF1CF]`} />
            <View style={tw`flex-1 bg-[#F8D05C]`} />
            <View style={tw`flex-1 bg-[#31C6F6]`} />
          </View>
          <ScrollView
            contentContainerStyle={tw`items-center gap-5 p-6`}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={tw`text-xs font-semibold uppercase tracking-widest text-[#0FF1CF]`}
            >
              Look who just arrived
            </Text>
            <GatherGoMascot variant={copy.variant} size={154} />
            <View style={tw`w-full gap-2`}>
              <Text
                accessibilityRole="header"
                style={tw`text-center text-2xl font-bold text-white`}
              >
                {profile.fullName ? `You're in, ${profile.fullName}!` : "You're in!"}
              </Text>
              <Text style={tw`text-center text-sm text-[#8FA5E2]`}>
                Your interests are set. Let&apos;s find your next great plan.
              </Text>
            </View>
            <View
              style={tw`w-full gap-3 rounded-3xl border border-[#1B2A50] bg-[#0A173F] p-4`}
            >
              <Text style={tw`text-sm font-semibold text-[#0FF1CF]`}>
                {copy.title}
              </Text>
              <Text style={tw`text-sm leading-6 text-[#D9E2FF]`}>
                Hey, I&apos;m your GatherGo sidekick. I&apos;ll be around for
                the little nudges and the big &quot;you&apos;re in!&quot;
                moments.
              </Text>
              <MascotMessage message={copy.message} style={tw`leading-6`} />
            </View>
            <CustomButton
              onPress={onContinue}
              title="Let's find your people"
              showArrow={false}
              buttonClassName="bg-[#0FF1CF] border-0 !w-full"
              textClassName="!text-black"
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
