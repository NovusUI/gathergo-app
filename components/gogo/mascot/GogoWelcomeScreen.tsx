import SkipOnboardingButton from "@/components/buttons/SkipOnboardingButton";
import CustomButton from "@/components/buttons/CustomBtn1";
import {
  GOGO_STARTUP_BACKGROUND,
  GOGO_STARTUP_SIZE,
} from "@/components/gogo/mascot/startup";
import { useGogoStartupMotion } from "@/components/gogo/mascot/motion/useGogoStartupMotion";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { useCallback, useState } from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GogoStartupArtwork } from "@/components/gogo/mascot/GogoStartupArtwork";

export default function GogoWelcomeScreen({
  onContinue,
  onSkip,
}: {
  onContinue: () => void;
  onSkip: () => void;
}) {
  const reducedMotion = useReducedMotionPreference();
  const [laidOut, setLaidOut] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const handleLayout = useCallback(() => setLaidOut(true), []);
  const completeAnimation = useCallback(() => setAnimationComplete(true), []);
  const progress = useGogoStartupMotion(
    !reducedMotion,
    completeAnimation,
    laidOut,
  );

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={GOGO_STARTUP_BACKGROUND}
      />
      <View style={styles.header}>
        <SkipOnboardingButton onPress={onSkip} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.introduction}>
          <View
            accessible
            accessibilityLabel="Gogo welcomes you to GatherGo"
            accessibilityState={{ busy: !animationComplete }}
            onLayout={handleLayout}
          >
            <GogoStartupArtwork
              progress={progress}
              animated={!reducedMotion}
              size={GOGO_STARTUP_SIZE}
            />
          </View>
          <Text accessibilityRole="header" style={styles.title}>
            Impact begins here
          </Text>
        </View>
        <View style={styles.action}>
          <CustomButton
            title="Let’s get started"
            onPress={onContinue}
            showArrow={false}
            buttonClassName="w-full self-center bg-[#0FF1CF] border-0"
            textClassName="text-[#01082E] mr-0"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GOGO_STARTUP_BACKGROUND,
  },
  header: {
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  introduction: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    maxWidth: 420,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 24,
  },
  action: {
    alignItems: "center",
    width: "100%",
    maxWidth: 420,
    paddingTop: 24,
  },
});
