import CustomButton from "@/components/buttons/CustomBtn1";
import GgCircleArtwork from "@/components/ui/GgCircleArtwork";
import LocalSvgAsset, {
  LocalSvgAssetName,
} from "@/components/ui/LocalSvgAsset";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import tw from "twrnc";

type OnboardingSlideProps = {
  artwork?: Extract<
    LocalSvgAssetName,
    "ggcircle" | "onboarding1" | "onboarding2"
  >;
  eyebrow?: string;
  title: string;
  description: string;
  proofLine?: string;
  chips?: string[];
  actionCards?: string[];
  stats?: string[];
  accentFrom?: string;
  accentTo?: string;
  buttonText?: string;
  showSwipeCue?: boolean;
  onPress: () => void;
  showButton?: boolean;
};

const FloatingChip = ({
  label,
  accentColor,
  delay,
}: {
  label: string;
  accentColor: string;
  delay: number;
}) => {
  const translateY = useRef(new Animated.Value(8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.chip,
        {
          borderColor: accentColor,
          backgroundColor: `${accentColor}22`,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={[styles.chipText, { color: accentColor }]}>{label}</Text>
    </Animated.View>
  );
};

export default function OnboardingSlide({
  artwork,
  eyebrow,
  title,
  description,
  proofLine,
  chips,
  actionCards,
  stats,
  accentFrom = "#0FF1CF",
  accentTo = "#8CEB5A",
  buttonText = "Get started",
  showSwipeCue = false,
  onPress,
  showButton = false,
}: OnboardingSlideProps) {
  const { height } = useWindowDimensions();
  const isCompact = height < 760;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(18)).current;
  const pulse = useRef(new Animated.Value(0.95)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const imageFloat = useRef(new Animated.Value(0)).current;
  const statCardLift = useRef(new Animated.Value(0)).current;
  const swipeCueX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.95,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(imageFloat, {
          toValue: -8,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(imageFloat, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    if (showSwipeCue) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(swipeCueX, {
            toValue: 12,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(swipeCueX, {
            toValue: 0,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    if (stats?.length) {
      Animated.parallel([
        Animated.timing(progressWidth, {
          toValue: 78,
          duration: 900,
          delay: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.timing(statCardLift, {
            toValue: -6,
            duration: 650,
            delay: 220,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(statCardLift, {
            toValue: 0,
            duration: 650,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [
    contentOpacity,
    contentTranslateY,
    imageFloat,
    progressWidth,
    pulse,
    statCardLift,
    stats?.length,
    showSwipeCue,
    swipeCueX,
  ]);

  return (
    <View
      style={[
        tw`flex-1 bg-[#01082E] justify-center items-center px-6`,
        { paddingTop: isCompact ? 32 : 52, paddingBottom: isCompact ? 118 : 132 },
      ]}
    >
      <Animated.View
        style={[
          styles.heroGlow,
          {
            backgroundColor: accentFrom,
            opacity: 0.16,
            transform: [{ scale: pulse }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.heroGlowSecondary,
          {
            backgroundColor: accentTo,
            opacity: 0.12,
            transform: [{ scale: pulse }],
          },
        ]}
      />

      <Animated.View
        style={{
          opacity: contentOpacity,
          transform: [{ translateY: contentTranslateY }],
          width: "100%",
          alignItems: "center",
          maxWidth: 500,
        }}
      >
        <View
          style={[
            styles.heroCard,
            {
              paddingHorizontal: isCompact ? 16 : 20,
              paddingTop: isCompact ? 18 : 24,
              paddingBottom: isCompact ? 14 : 18,
              marginBottom: isCompact ? 18 : 24,
            },
          ]}
        >
          {artwork === "ggcircle" ? (
            <Animated.View style={{ transform: [{ translateY: imageFloat }] }}>
              <GgCircleArtwork
                width={isCompact ? 198 : 250}
                height={isCompact ? 154 : 210}
              />
            </Animated.View>
          ) : artwork ? (
            <Animated.View style={{ transform: [{ translateY: imageFloat }] }}>
              <LocalSvgAsset
                name={artwork}
                width={isCompact ? 198 : 250}
                height={isCompact ? 154 : 210}
              />
            </Animated.View>
          ) : null}

          {!!chips?.length && (
            <View style={styles.chipsWrap}>
              {chips.map((chip, index) => (
                <FloatingChip
                  key={chip}
                  label={chip}
                  accentColor={accentFrom}
                  delay={120 + index * 90}
                />
              ))}
            </View>
          )}

          {!!actionCards?.length && (
            <View style={[styles.actionCards, { marginTop: isCompact ? 10 : 12 }]}>
              {actionCards.map((card, index) => (
                <View
                  key={card}
                  style={[
                    styles.actionCard,
                    {
                      paddingHorizontal: isCompact ? 12 : 14,
                      paddingVertical: isCompact ? 11 : 14,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.actionBadge,
                      { backgroundColor: index === 0 ? accentFrom : `${accentTo}DD` },
                    ]}
                  />
                  <Text style={styles.actionCardText}>{card}</Text>
                </View>
              ))}
            </View>
          )}

          {!!stats?.length && (
            <Animated.View
              style={[
                styles.statsCard,
                {
                  marginTop: isCompact ? 10 : 14,
                  transform: [{ translateY: statCardLift }],
                },
              ]}
            >
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Live momentum</Text>
                <Text style={[styles.progressValue, { color: accentFrom }]}>
                  78%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressWidth.interpolate({
                        inputRange: [0, 100],
                        outputRange: ["0%", "100%"],
                      }),
                      backgroundColor: accentFrom,
                    },
                  ]}
                />
              </View>
              <View style={styles.statsGrid}>
                {stats.map((stat, index) => (
                  <View key={stat} style={styles.statPill}>
                    <Text
                      style={[
                        styles.statText,
                        { color: index === 3 ? accentFrom : "#E3EBFF" },
                      ]}
                    >
                      {stat}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}
        </View>

        {!!eyebrow && (
          <Text
            style={[
              styles.eyebrow,
              {
                marginBottom: isCompact ? 10 : 12,
                fontSize: isCompact ? 11 : 12,
              },
            ]}
          >
            {eyebrow}
          </Text>
        )}

        <Text
          style={[
            styles.title,
            {
              fontSize: isCompact ? 25 : 31,
              lineHeight: isCompact ? 31 : 38,
              marginBottom: isCompact ? 10 : 12,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.description,
            {
              fontSize: isCompact ? 14 : 15,
              lineHeight: isCompact ? 21 : 23,
              marginBottom: isCompact ? 12 : 16,
            },
          ]}
        >
          {description}
        </Text>

        {!!proofLine && (
          <View
            style={[
              styles.proofCard,
              {
                paddingHorizontal: isCompact ? 14 : 16,
                paddingVertical: isCompact ? 12 : 14,
              },
            ]}
          >
            <Text style={styles.proofText}>{proofLine}</Text>
          </View>
        )}

        {showSwipeCue && (
          <Animated.View
            style={[
              styles.swipeCue,
              {
                marginTop: isCompact ? 14 : 18,
                transform: [{ translateX: swipeCueX }],
              },
            ]}
          >
             <Text style={styles.swipeCueArrow}>{"<<<"}</Text>
            <Text style={styles.swipeCueText}>Swipe to continue</Text>
          </Animated.View>
        )}

        {showButton && (
          <View style={[styles.ctaWrap, { marginTop: isCompact ? 18 : 24 }]}>
            <CustomButton
              onPress={onPress}
              title={buttonText}
              buttonClassName="!w-full bg-[#0FF1CF] border-0"
              textClassName="!text-black"
              arrowCircleColor="bg-[#0C7F7F]"
              showArrow={false}
            />
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroGlow: {
    position: "absolute",
    top: 110,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  heroGlowSecondary: {
    position: "absolute",
    top: 170,
    right: 16,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  heroCard: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#07164F",
    borderColor: "#183379",
    borderWidth: 1,
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    marginBottom: 24,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 18,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  actionCards: {
    width: "100%",
    gap: 10,
    marginTop: 12,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B1F66",
    borderWidth: 1,
    borderColor: "#2748C4",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  actionBadge: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 10,
  },
  actionCardText: {
    color: "#F4F7FF",
    fontSize: 14,
    fontWeight: "700",
  },
  statsCard: {
    width: "100%",
    backgroundColor: "#0B1F66",
    borderWidth: 1,
    borderColor: "#2748C4",
    borderRadius: 20,
    padding: 14,
    marginTop: 14,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressLabel: {
    color: "#E3EBFF",
    fontSize: 13,
    fontWeight: "700",
  },
  progressValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  progressTrack: {
    height: 10,
    backgroundColor: "#142B7F",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  statPill: {
    backgroundColor: "#10296F",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statText: {
    fontSize: 12,
    fontWeight: "700",
  },
  eyebrow: {
    color: "#0FF1CF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginBottom: 12,
  },
  title: {
    color: "white",
    fontSize: 31,
    fontWeight: "800",
    lineHeight: 38,
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    color: "#C5D0F7",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  proofCard: {
    backgroundColor: "#101C45",
    borderColor: "#1B2A50",
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  proofText: {
    color: "#E5EDFF",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
  },
  swipeCue: {
    flexDirection: "row",
    alignItems: "center",
  },
  swipeCueText: {
    color: "#C5D0F7",
    fontSize: 13,
    fontWeight: "700",
  },
  swipeCueArrow: {
    color: "#0FF1CF",
    fontSize: 17,
    fontWeight: "800",
    marginLeft: 8,
  },
  ctaWrap: {
    width: "100%",
    marginTop: 24,
    alignItems: "center",
  },
});
