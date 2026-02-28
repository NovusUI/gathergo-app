// components/feed/FeedCard.tsx
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
import tw from "twrnc";
import LiquidProgressBar from "./LiquidProgressBar";

export interface FeedCardProps {
  feed: {
    id: string;
    type: string;
    title: string;
    content?: string | null;
    user?: {
      id: string;
      username: string | null;
      profilePicUrlTN: string | null;
    } | null;
    metadata: any;
    actions: any[];
    isPinned: boolean;
    createdAt: string;
  };
  onHide?: (feedId: string) => void;
  onAction?: (action: any) => void;
}

const FeedCard: React.FC<FeedCardProps> = ({ feed, onHide, onAction }) => {
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
    if (feed.type.includes("FRENZY")) {
      Animated.loop(
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
      ).start();
    }
  }, []);

  // Get theme configuration based on feed type
  const getThemeConfig = () => {
    const type = feed.type;

    if (type.includes("TICKET")) {
      return {
        bgColor: "#0C1447",
        borderColor: "#0C7F7F",
        accentColor: "#0FF1CF",
        icon: "ticket-outline",
        iconColor: "#0FF1CF",
      };
    }

    if (type.includes("DONATION")) {
      const isHighPercentage = feed.metadata?.percentage >= 0.9;
      const isMilestone = type.includes("PERCENT");

      return {
        bgColor: "#1A0C3C",
        borderColor: isHighPercentage ? "#FF6B6B" : "#9B51E0",
        accentColor: isHighPercentage ? "#FF6B6B" : "#9B51E0",
        icon: isMilestone ? "trophy-outline" : "heart-outline",
        iconColor: isHighPercentage ? "#FF6B6B" : "#9B51E0",
      };
    }

    if (type.includes("REGISTRATION")) {
      return {
        bgColor: "#0C2A47",
        borderColor: "#2D9CDB",
        accentColor: "#2D9CDB",
        icon: "person-add-outline",
        iconColor: "#2D9CDB",
      };
    }

    if (type.includes("FRENZY")) {
      const intensity = feed.metadata?.intensity;
      const frenzyColor =
        intensity === "HIGH"
          ? "#FF6B6B"
          : intensity === "MEDIUM"
          ? "#FF9800"
          : "#4CAF50";

      return {
        bgColor: "#3C0C0C",
        borderColor: frenzyColor,
        accentColor: frenzyColor,
        icon: "flame-outline",
        iconColor: frenzyColor,
      };
    }

    if (type.includes("MILESTONE")) {
      return {
        bgColor: "#1C3C0C",
        borderColor: "#6BFF6B",
        accentColor: "#6BFF6B",
        icon: "trophy-outline",
        iconColor: "#6BFF6B",
      };
    }

    if (type.includes("EVENT_CREATED")) {
      return {
        bgColor: "#4C0C3C",
        borderColor: "#E040FB",
        accentColor: "#E040FB",
        icon: "add-circle-outline",
        iconColor: "#E040FB",
      };
    }

    // Default theme
    return {
      bgColor: "#101C45",
      borderColor: "#374151",
      accentColor: "#0FF1CF",
      icon: "chatbubble-outline",
      iconColor: "#0FF1CF",
    };
  };

  const theme = getThemeConfig();

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
    const converted = numeric <= 1 ? numeric * 100 : numeric;
    return Math.max(0, Math.min(converted, 100));
  };

  // Render progress visualization
  const renderProgress = () => {
    const percentage = getNormalizedPercentage();
    if (percentage === null) return null;

    const isDonation = feed.type.includes("DONATION");
    const showWave = isDonation && percentage >= 90;

    return (
      <View style={tw`mt-2 mb-1`}>
        <View style={tw`flex-row justify-between items-center mb-1.5`}>
          <Text style={tw`text-xs text-gray-400`}>
            {isDonation ? "Fundraising" : "Progress"}
          </Text>
          <View style={tw`flex-row items-center`}>
            {feed.metadata.amountInNaira !== null &&
              feed.metadata.amountInNaira !== undefined && (
              <Text
                style={[
                  tw`text-xs font-bold mr-2`,
                  { color: theme.accentColor },
                ]}
              >
                ₦{feed.metadata.amountInNaira.toLocaleString()}
              </Text>
            )}
            <Text
              style={[
                tw`text-xs font-bold`,
                {
                  color: theme.accentColor,
                  fontSize: percentage >= 100 ? 16 : 14,
                },
              ]}
            >
              {Math.round(percentage)}%
            </Text>
          </View>
        </View>

        <LiquidProgressBar
          percentage={percentage}
          color={theme.accentColor}
          height={isDonation ? 10 : 7}
          showWave={showWave}
        />

        {feed.metadata.targetInNaira && (
          <Text style={tw`text-xs text-gray-500 mt-1 text-right`}>
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
          <Ionicons name="sparkles" size={14} color="#FFD700" />
          <Text style={tw`text-xs text-yellow-300 ml-1`}>
            🎉 Target Achieved! 🎉
          </Text>
        </View>
      );
    }

    if (percentage >= 90) {
      return (
        <View style={tw`flex-row items-center mt-2`}>
          <Ionicons name="flash" size={14} color="#FF6B6B" />
          <Text style={tw`text-xs text-red-300 ml-1`}>Almost there! 🔥</Text>
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
      LOW: { color: "#4CAF50", icon: "flame-outline" },
      MEDIUM: { color: "#FF9800", icon: "flame" },
      HIGH: { color: "#FF6B6B", icon: "flame" },
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
          tw`absolute -top-1.5 -right-1.5 rounded-full px-1.5 py-0.5 z-10`,
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
    <Animated.View
      style={[
        tw`p-3 mb-2 rounded-xl border relative`,
        {
          backgroundColor: theme.bgColor,
          borderColor: theme.borderColor,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        feed.isPinned && {
          borderLeftWidth: 4,
          borderLeftColor: theme.accentColor,
        },
      ]}
    >
      {/* Pinned indicator */}
      {feed.isPinned && (
        <View style={tw`absolute -left-1 top-3`}>
          <Ionicons name="pin" size={13} color={theme.accentColor} />
        </View>
      )}

      {/* Count badge */}
      {renderCountBadge()}

      <View style={tw`flex-row items-start`}>
        {/* Animated icon container */}
        <View style={tw`mr-2.5`}>
          <Animated.View
            style={[
              tw`w-10 h-10 rounded-lg items-center justify-center`,
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
              size={20}
              color={theme.iconColor}
            />
          </Animated.View>
        </View>

        {/* Content */}
        <View style={tw`flex-1`}>
          {/* Header */}
          <View style={tw`flex-row justify-between items-start mb-0.5`}>
            <Text
              numberOfLines={1}
              style={[
                tw`text-white font-semibold text-sm flex-1 mr-2`,
                { color: theme.accentColor },
              ]}
            >
              {feed.title}
            </Text>
            <Text style={tw`text-xs text-gray-500`}>
              {timeAgo(feed.createdAt)}
            </Text>
          </View>

          {/* User info */}
          {feed.user && (
            <View style={tw`flex-row items-center mb-1`}>
              {feed.user.profilePicUrlTN ? (
                <Image
                  source={{ uri: feed.user.profilePicUrlTN }}
                  style={tw`w-5 h-5 rounded-full mr-2`}
                />
              ) : (
                <View
                  style={tw`w-5 h-5 rounded-full bg-gray-700 mr-2 justify-center items-center`}
                >
                  <UserRound size={10} color="white" />
                </View>
              )}
              <Text numberOfLines={1} style={tw`text-gray-300 text-xs`}>
                {feed.user.username}
              </Text>
            </View>
          )}

          {/* Content text */}
          {feed.content && (
            <Text numberOfLines={2} style={tw`text-white text-xs mb-2`}>
              {feed.content}
            </Text>
          )}

          {/* Progress visualization */}
          {renderProgress()}

          {/* Frenzy intensity */}
          {renderFrenzyIntensity()}

          {/* Celebration for milestones */}
          {renderCelebration()}

          {/* Actions */}
          {feed.actions && feed.actions.length > 0 && (
            <View style={tw`flex-row mt-2 flex-wrap gap-1.5`}>
              {feed.actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    tw`px-2.5 py-1.5 rounded-md flex-row items-center`,
                    {
                      backgroundColor: theme.accentColor,
                      minWidth: 84,
                    },
                  ]}
                  onPress={() => onAction?.(action)}
                >
                  <Text
                    numberOfLines={1}
                    style={tw`text-black text-xs font-medium text-center flex-1`}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Footer */}
          <View
            style={tw`flex-row justify-between items-center mt-2 pt-2 border-t border-gray-800`}
          >
            <Text
              style={[tw`text-xs capitalize`, { color: theme.accentColor }]}
            >
              {feed.type.replace(/_/g, " ").toLowerCase()}
            </Text>

            <TouchableOpacity
              onPress={() => onHide?.(feed.id)}
              style={tw`flex-row items-center`}
            >
              <Ionicons name="eye-off-outline" size={12} color="#666" />
              <Text style={tw`text-xs text-gray-500 ml-1`}>Hide</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

export default FeedCard;
