import { useAppTheme } from "@/hooks/useAppTheme";
import CustomButton from "@/components/buttons/CustomBtn1";
import { getProfileWelcomeCopy } from "@/components/gogo/mascot/constants";
import type { User } from "@/types/auth";
import { Modal, ScrollView, Text, View } from "react-native";

import { GatherGoMascot } from "@/components/gogo/mascot/GatherGoMascot";
import { MascotMessage } from "@/components/gogo/mascot/MascotMessage";

type ProfileWelcomeModalProps = {
  profile: Pick<User, "fullName" | "birthDate">;
  onContinue: () => void;
};

export default function ProfileWelcomeModal({
  profile,
  onContinue,
}: ProfileWelcomeModalProps) {
  const { tw } = useAppTheme();
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
          style={tw`w-full max-w-[430px] max-h-[90%] overflow-hidden rounded-[32px] border border-accent/25 dark:border-[#0FF1CF]/25 bg-surface dark:bg-[#07143B]`}
        >
          <View style={tw`h-1.5 flex-row`}>
            <View style={tw`flex-1 bg-accentFill dark:bg-[#0FF1CF]`} />
            <View style={tw`flex-1 bg-warningFill dark:bg-[#F8D05C]`} />
            <View style={tw`flex-1 bg-infoSoft dark:bg-[#31C6F6]`} />
          </View>
          <ScrollView
            contentContainerStyle={tw`items-center gap-5 p-6`}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={tw`text-xs font-semibold uppercase tracking-widest text-accent dark:text-[#0FF1CF]`}
            >
              Look who just arrived
            </Text>
            <GatherGoMascot variant={copy.variant} size={154} />
            <View style={tw`w-full gap-2`}>
              <Text
                accessibilityRole="header"
                style={tw`text-center text-2xl font-bold text-foreground dark:text-white`}
              >
                {profile.fullName ? `You're in, ${profile.fullName}!` : "You're in!"}
              </Text>
              <Text style={tw`text-center text-sm text-secondary dark:text-[#8FA5E2]`}>
                Your interests are set. Let&apos;s find your next great plan.
              </Text>
            </View>
            <View
              style={tw`w-full gap-3 rounded-3xl border border-border dark:border-[#1B2A50] bg-surface dark:bg-[#0A173F] p-4`}
            >
              <Text style={tw`text-sm font-semibold text-accent dark:text-[#0FF1CF]`}>
                {copy.title}
              </Text>
              <Text style={tw`text-sm leading-6 text-foreground dark:text-[#D9E2FF]`}>
                Hi, I&apos;m Gogo, your GatherGo guide. I&apos;ll help you find
                events, join in and celebrate every contribution.
              </Text>
              <MascotMessage message={copy.message} style={tw`leading-6`} />
            </View>
            <CustomButton
              onPress={onContinue}
              title="Let's find your people"
              showArrow={false}
              buttonClassName="bg-accentFill dark:bg-[#0FF1CF] border-0 !w-full"
              textClassName="!text-onAccent dark:text-black"
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
