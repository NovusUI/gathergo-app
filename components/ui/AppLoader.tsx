import { GOGO_PALETTE } from "@/constants/mascot";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { type ActivityIndicatorProps, StyleSheet, View } from "react-native";
import { GogoSpinnerArtwork } from "./GogoSpinnerArtwork";

const loaderColors = {
  accent: GOGO_PALETTE.body,
  dark: "#01082E",
  light: "#FFFFFF",
} as const;

type LoaderTone = keyof typeof loaderColors;

interface AppLoaderProps extends Omit<ActivityIndicatorProps, "color"> {
  tone?: LoaderTone;
  color?: string;
}

export default function AppLoader({
  tone = "accent",
  color,
  size = "small",
  animating = true,
  hidesWhenStopped = true,
  style,
  ...props
}: AppLoaderProps) {
  const reducedMotion = useReducedMotionPreference();
  const dimension =
    typeof size === "number" ? size : size === "large" ? 40 : 24;
  return (
    <View
      accessible={animating}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      accessibilityState={{ busy: animating }}
      {...props}
      style={[styles.container, style]}
    >
      {!animating && hidesWhenStopped ? (
        <View style={{ width: dimension, height: dimension }} />
      ) : (
        <GogoSpinnerArtwork
          size={dimension}
          animated={animating && !reducedMotion}
          ringColor={color ?? loaderColors[tone]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
});
