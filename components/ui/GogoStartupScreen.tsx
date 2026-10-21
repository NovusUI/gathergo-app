import {
  GOGO_STARTUP_BACKGROUND,
  GOGO_STARTUP_SIZE,
} from "@/constants/gogoStartup";
import { useGogoStartupMotion } from "@/hooks/useGogoStartupMotion";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { useCallback, useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { GogoStartupArtwork } from "./GogoStartupArtwork";

export default function GogoStartupScreen({
  onComplete,
  onLayout,
}: {
  onComplete: () => void;
  onLayout: () => void;
}) {
  const reducedMotion = useReducedMotionPreference();
  const [laidOut, setLaidOut] = useState(false);
  const handleLayout = useCallback(() => {
    onLayout();
    setLaidOut(true);
  }, [onLayout]);
  const progress = useGogoStartupMotion(!reducedMotion, onComplete, laidOut);
  return (
    <View
      accessible
      accessibilityLabel="Starting GatherGo"
      accessibilityState={{ busy: true }}
      onLayout={handleLayout}
      style={styles.screen}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={GOGO_STARTUP_BACKGROUND}
      />
      <GogoStartupArtwork
        progress={progress}
        animated={!reducedMotion}
        size={GOGO_STARTUP_SIZE}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GOGO_STARTUP_BACKGROUND,
  },
});
