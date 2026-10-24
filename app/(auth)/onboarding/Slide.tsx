import { useAppTheme } from "@/hooks/useAppTheme";
import type { ThemeColor } from "@/constants/theme";
import { GogoOnboardingCarpoolArtwork } from "@/components/gogo/mascot/GogoOnboardingCarpoolArtwork";
import GgCircleArtwork from "@/components/ui/GgCircleArtwork";
import LocalSvgAsset, {
  type LocalSvgAssetName,
} from "@/components/ui/LocalSvgAsset";
import { useReducedMotionPreference } from "@/hooks/useReducedMotionPreference";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

export type OnboardingSlideProps = {
  artwork: Extract<
    LocalSvgAssetName,
    "ggcircle" | "onboarding1" | "onboarding2"
  >;
  title: string;
  active: boolean;
};

export default function OnboardingSlide({
  artwork,
  title,
  active,
}: OnboardingSlideProps) {
  const { color } = useAppTheme();
  const styles = createStyles(color);
  const { height } = useWindowDimensions();
  const reducedMotion = useReducedMotionPreference();
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    reveal.setValue(reducedMotion ? 1 : 0);
    if (!active || reducedMotion) return;
    const animation = Animated.timing(reveal, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [active, reducedMotion, reveal]);
  const compact = height < 760;
  const artworkWidth = compact ? 220 : 280;
  const artworkHeight = compact ? 180 : 230;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? "auto" : "no-hide-descendants"}
    >
      <View style={styles.introduction}>
        <View style={styles.artwork}>
          {artwork === "ggcircle" ? (
            <GgCircleArtwork width={artworkWidth} height={artworkHeight} />
          ) : artwork === "onboarding2" ? (
            <GogoOnboardingCarpoolArtwork
              width={artworkWidth}
              height={artworkHeight}
              animated={active && !reducedMotion}
            />
          ) : (
            <LocalSvgAsset
              name={artwork}
              width={artworkWidth}
              height={artworkHeight}
            />
          )}
        </View>
        <Animated.Text
          accessibilityRole="header"
          style={[
            styles.title,
            {
              opacity: reducedMotion ? 1 : reveal,
              transform: [
                {
                  translateY: reducedMotion
                    ? 0
                    : reveal.interpolate({
                        inputRange: [0, 1],
                        outputRange: [14, 0],
                      }),
                },
              ],
            },
          ]}
        >
          {title}
        </Animated.Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (color: ThemeColor) => StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  introduction: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
  },
  artwork: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    color: color("#FFFFFF", "foreground"),
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "800",
    textAlign: "center",
  },
});
