import { useAppTheme } from "@/hooks/useAppTheme";
// components/feed/FeedCard.tsx
import type { FeedItem } from "@/hooks/useEventFeed";
import { Ionicons } from "@expo/vector-icons";
import { UserRound } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface FeedCardProps {
  feed: Pick<
    FeedItem,
    "id" | "type" | "title" | "content" | "user" | "metadata" | "actions" | "isPinned" | "createdAt"
  >;
  onHide?: (feedId: string) => void;
  onAction?: (action: any) => void;
  eventRegistrationFee?: number | null;
}

const getPositiveNumber = (value: unknown) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0
    ? numericValue
    : null;
};

const getFirstPositiveNumber = (metadata: any, keys: string[]) => {
  for (const key of keys) {
    const value = getPositiveNumber(metadata?.[key]);
    if (value !== null) {
      return value;
    }
  }

  return null;
};

const resolveFeedAmountInNaira = (
  feed: FeedCardProps["feed"],
  eventRegistrationFee?: number | null
) => {
  if (feed.type.includes("REGISTRATION")) {
    const trustedNairaAmount = getFirstPositiveNumber(feed.metadata, [
      "registrationFeeInNaira",
      "registrationAmountInNaira",
      "feeInNaira",
      "priceInNaira",
      "amountInNaira",
      "amountNaira",
      "amountMajor",
    ]);
    const legacyRegistrationAmount = getFirstPositiveNumber(feed.metadata, [
      "registrationFee",
      "registrationAmount",
      "fee",
      "price",
    ]);
    const eventFee = getPositiveNumber(eventRegistrationFee);
    const registrationAmounts = [
      trustedNairaAmount,
      eventFee,
      legacyRegistrationAmount,
    ].filter((amount): amount is number => amount !== null);

    if (registrationAmounts.length > 0) {
      return Math.max(...registrationAmounts);
    }
  }

  return getFirstPositiveNumber(feed.metadata, [
    "amountInNaira",
    "amountNaira",
    "amountMajor",
  ]);
};

const formatFeedAmount = (amount: number) =>
  amount.toLocaleString("en-NG", {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  });

const replaceRegistrationAmountText = (
  text: string | null | undefined,
  feed: FeedCardProps["feed"],
  amountInNaira: number | null
) => {
  if (!text || !feed.type.includes("REGISTRATION") || amountInNaira === null) {
    return text;
  }

  return text.replace(
    /(?:₦|NGN\s*)\s*\d+(?:,\d{3})*(?:\.\d+)?/gi,
    `₦${formatFeedAmount(amountInNaira)}`
  );
};

const FeedCard: React.FC<FeedCardProps> = ({
  feed,
  onAction,
  eventRegistrationFee,
}) => {
  const { tw, color } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation for card
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle icon rotation for frenzy feeds
    let rotationLoop: Animated.CompositeAnimation | null = null;
    if (feed.type.includes("FRENZY")) {
      rotationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(iconRotateAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(iconRotateAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      rotationLoop.start();
    }

    return () => {
      rotationLoop?.stop();
    };
  }, [feed.type, iconRotateAnim, opacityAnim, scaleAnim]);

  // Keep each activity recognizable within the shared ticket-style card.
  const getIconConfig = () => {
    const type = feed.type;

    if (type.includes("TICKET")) {
      return {
        icon: "ticket-outline",
        iconColor: color("#0FF1CF", "accent"),
      };
    }

    if (type.includes("DONATION")) {
      const isHighPercentage = feed.metadata?.percentage >= 0.9;
      const isMilestone = type.includes("PERCENT");

      return {
        icon: isMilestone ? "trophy-outline" : "heart-outline",
        iconColor: isHighPercentage ? color("#FF6B6B", "danger") : "#9B51E0",
      };
    }

    if (type.includes("REGISTRATION")) {
      return {
        icon: "person-add-outline",
        iconColor: color("#2D9CDB", "info"),
      };
    }

    if (type.includes("FRENZY")) {
      const intensity = feed.metadata?.intensity;
      const frenzyColor =
        intensity === "HIGH"
          ? color("#FF6B6B", "danger")
          : intensity === "MEDIUM"
          ? color("#FF9800", "danger")
          : "#4CAF50";

      return {
        icon: "flame-outline",
        iconColor: frenzyColor,
      };
    }

    if (type.includes("MILESTONE")) {
      return {
        icon: "trophy-outline",
        iconColor: "#6BFF6B",
      };
    }

    if (type.includes("EVENT_CREATED")) {
      return {
        icon: "add-circle-outline",
        iconColor: "#E040FB",
      };
    }

    return {
      icon: "chatbubble-outline",
      iconColor: color("#0FF1CF", "accent"),
    };
  };

  const theme = {
    bgColor: color("#0C1447", "surface"),
    borderColor: color("#0C7F7F", "borderStrong"),
    accentColor: color("#0FF1CF", "accent"),
    ...getIconConfig(),
  };

  // Icon rotation for frenzy feeds
  const iconRotation = iconRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "10deg"],
  });

  const getNormalizedPercentage = () => {
    const raw = feed.metadata?.percentage;
    if (raw === null || raw === undefined) return null;
    const numeric = Number(raw);
    if (Number.isNaN(numeric)) return null;
    return Math.max(0, Math.min(numeric * 100, 100));
  };
  const normalizedPercentage = getNormalizedPercentage();
  const displayAmountInNaira = resolveFeedAmountInNaira(
    feed,
    eventRegistrationFee
  );
  const primaryAction = feed.actions?.[0];
  const supportMessage =
    feed.metadata?.supportMessage ||
    feed.metadata?.message ||
    feed.metadata?.donationMessage ||
    null;
  const displayTitle =
    replaceRegistrationAmountText(feed.title, feed, displayAmountInNaira) ||
    feed.title;
  const displayContent = replaceRegistrationAmountText(
    feed.content,
    feed,
    displayAmountInNaira
  );
  const displaySupportMessage = replaceRegistrationAmountText(
    supportMessage,
    feed,
    displayAmountInNaira
  );

  const renderProgress = () => {
    const percentage = normalizedPercentage;
    if (percentage === null) return null;

    const isDonation = feed.type.includes("DONATION");

    return (
      <View style={tw`mt-2`}>
        <View style={tw`flex-row items-center justify-between`}>
          <Text style={tw`text-[11px] text-muted dark:text-gray-400`}>
            {isDonation ? "Fundraising" : "Progress"}
          </Text>
          <View style={tw`flex-row items-center`}>
            {displayAmountInNaira !== null && (
              <Text
                style={[
                  tw`text-[11px] font-bold mr-2`,
                  { color: theme.accentColor },
                ]}
              >
                ₦{formatFeedAmount(displayAmountInNaira)}
              </Text>
            )}
            <Text
              style={[
                tw`text-[11px] font-bold`,
                {
                  color: theme.accentColor,
                  fontSize: percentage >= 100 ? 15 : 13,
                },
              ]}
            >
              {Math.round(percentage)}%
            </Text>
          </View>
        </View>

        {feed.metadata?.targetInNaira && (
          <Text style={tw`mt-1 text-[11px] text-muted dark:text-gray-500`}>
            Goal: ₦{feed.metadata.targetInNaira.toLocaleString()}
          </Text>
        )}
      </View>
    );
  };

  // Render celebration for milestones
  const renderCelebration = () => {
    if (!feed.type.includes("PERCENT") || !feed.metadata?.percentage)
      return null;

    const percentage = feed.metadata.percentage * 100;

    if (percentage >= 100) {
      return (
        <View style={tw`flex-row items-center mt-2`}>
          <Ionicons name="trophy-outline" size={14} color={color("#FFD700", "warning")} />
          <Text style={tw`text-xs text-warning dark:text-yellow-300 ml-1`}>
            🎉 Target Achieved! 🎉
          </Text>
        </View>
      );
    }

    if (percentage >= 90) {
      return (
        <View style={tw`flex-row items-center mt-2`}>
          <Ionicons name="flash" size={14} color={color("#FF6B6B", "danger")} />
          <Text style={tw`text-xs text-danger dark:text-red-300 ml-1`}>Almost there! 🔥</Text>
        </View>
      );
    }

    return null;
  };

  // Render frenzy intensity
  const renderFrenzyIntensity = () => {
    if (!feed.type.includes("FRENZY") || !feed.metadata?.intensity) return null;

    const intensity = feed.metadata.intensity;
    const intensityColors = {
      LOW: { color: color("#4CAF50", "success"), icon: "flame-outline" },
      MEDIUM: { color: color("#FF9800", "danger"), icon: "flame" },
      HIGH: { color: color("#FF6B6B", "danger"), icon: "flame" },
    };

    const config =
      intensityColors[intensity as keyof typeof intensityColors] ||
      intensityColors.LOW;

    return (
      <View style={tw`flex-row items-center mt-2`}>
        <Ionicons name={config.icon as any} size={14} color={config.color} />
        <Text style={[tw`text-xs font-bold ml-1`, { color: config.color }]}>
          {intensity} Intensity • {feed.metadata.count || 0} in{" "}
          {feed.metadata.timeframe || "recently"}
        </Text>
      </View>
    );
  };

  // Render count badge for ticket/registration milestones
  const renderCountBadge = () => {
    if (!feed.metadata?.currentCount) return null;

    const count = feed.metadata.currentCount;
    let label = "";

    if (feed.type.includes("TICKET")) label = "tickets";
    if (feed.type.includes("REGISTRATION")) label = "registrations";
    if (feed.type.includes("DONATION")) label = "donations";

    if (!label) return null;

    return (
      <View
        style={[
          tw`self-start mt-2 rounded-full px-1.5 py-0.5 z-10`,
          { backgroundColor: `${theme.accentColor}20` },
        ]}
      >
        <Text style={[tw`text-xs font-bold`, { color: theme.accentColor }]}>
          {count} {label}
        </Text>
      </View>
    );
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <TouchableOpacity
      activeOpacity={primaryAction ? 0.9 : 1}
      disabled={!primaryAction}
      onPress={() => primaryAction && onAction?.(primaryAction)}
    >
      <Animated.View
        style={[
          tw`mb-2 mx-4 overflow-hidden rounded-2xl border relative`,
          {
            backgroundColor: theme.bgColor,
            borderColor: theme.borderColor,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {feed.type.includes("DONATION") && normalizedPercentage !== null ? (
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Fundraising progress"
            accessibilityValue={{ min: 0, max: 100, now: normalizedPercentage }}
            pointerEvents="none"
            style={[
              tw`absolute inset-y-0 left-0`,
              {
                width: `${normalizedPercentage}%`,
                backgroundColor: `${theme.iconColor}22`,
              },
            ]}
          />
        ) : null}
        <View style={tw`flex-row items-start p-3`}>
          <View style={tw`mr-2.5`}>
            <Animated.View
              style={[
                tw`h-9 w-9 rounded-xl items-center justify-center`,
                {
                  backgroundColor: `${theme.accentColor}20`,
                  transform: [
                    {
                      rotate: feed.type.includes("FRENZY")
                        ? iconRotation
                        : "0deg",
                    },
                  ],
                },
              ]}
            >
              <Ionicons
                name={theme.icon as any}
                size={18}
                color={theme.iconColor}
              />
            </Animated.View>
          </View>

          <View style={tw`flex-1`}>
            <View style={tw`flex-row items-start justify-between mb-1`}>
              <Text
                numberOfLines={1}
                style={[
                  tw`mr-3 flex-1 text-sm font-semibold text-foreground dark:text-white`,
                  { color: theme.accentColor },
                ]}
              >
                {displayTitle}
              </Text>
              <Text style={tw`text-[11px] text-muted dark:text-gray-500`}>
                {timeAgo(feed.createdAt)}
              </Text>
            </View>

            {feed.user && (
              <View style={tw`mb-1.5 flex-row items-center`}>
                {feed.user.profilePicUrlTN ? (
                  <Image
                    source={{ uri: feed.user.profilePicUrlTN }}
                    style={tw`mr-2 h-5 w-5 rounded-full`}
                  />
                ) : (
                  <View
                    style={tw`mr-2 h-5 w-5 rounded-full bg-surfaceMuted dark:bg-gray-700 justify-center items-center`}
                  >
                    <UserRound size={10} color={color("white", "foreground")} />
                  </View>
                )}
                <Text numberOfLines={1} style={tw`text-[11px] text-secondary dark:text-gray-300`}>
                  {feed.user.username}
                </Text>
              </View>
            )}

            {Boolean(displayContent) && (
              <Text numberOfLines={2} style={tw`text-xs leading-5 text-foreground dark:text-white`}>
                {displayContent}
              </Text>
            )}

            {displaySupportMessage && (
              <View style={tw`mt-2 rounded-2xl bg-surface dark:bg-white/6 px-3 py-2`}>
                <Text style={tw`text-[11px] leading-5 text-foreground dark:text-[#E5EDFF]`}>
                  {`"${displaySupportMessage}"`}
                </Text>
              </View>
            )}

            <View style={tw`mt-2`}>
              {renderCountBadge()}
              {renderProgress()}
              {renderFrenzyIntensity()}
              {renderCelebration()}
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default FeedCard;
