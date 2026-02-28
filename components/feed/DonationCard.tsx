// components/feed/DonationCard.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import tw from "twrnc";
import FeedCard, { FeedCardProps } from "./FeedCard";

const DonationCard: React.FC<FeedCardProps> = ({ feed, ...props }) => {
  const waveAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (feed.metadata?.percentage && feed.metadata.percentage >= 0.9) {
      // Liquid wave animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glow animation for high percentages
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [feed.metadata?.percentage]);

  // Custom render for donation progress
  const renderDonationProgress = () => {
    if (!feed.metadata?.percentage) return null;

    const percentage = feed.metadata.percentage * 100;
    const isHighPercentage = percentage >= 90;
    const isMilestone = feed.type.includes("PERCENT");

    return (
      <View style={tw`mt-3 mb-2`}>
        {/* Progress label */}
        <View style={tw`flex-row justify-between items-center mb-1`}>
          <View style={tw`flex-row items-center`}>
            <Ionicons
              name={isMilestone ? "trophy" : "heart"}
              size={16}
              color={isHighPercentage ? "#FF6B6B" : "#9B51E0"}
            />
            <Text style={tw`text-xs text-gray-400 ml-2`}>
              {isMilestone ? "Milestone Reached!" : "Fundraising Progress"}
            </Text>
          </View>
          <View style={tw`flex-row items-center`}>
            {feed.metadata.amountInNaira && (
              <Text
                style={tw`text-xs font-bold mr-2`}
                style={{
                  color: isHighPercentage ? "#FF6B6B" : "#9B51E0",
                  textShadowColor: isHighPercentage
                    ? "rgba(255, 107, 107, 0.5)"
                    : "transparent",
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: isHighPercentage ? 4 : 0,
                }}
              >
                ₦{feed.metadata.amountInNaira.toLocaleString()}
              </Text>
            )}
            <Text
              style={tw`text-xs font-bold`}
              style={{
                color: isHighPercentage ? "#FF6B6B" : "#9B51E0",
                fontSize: isMilestone ? 16 : 14,
              }}
            >
              {Math.round(percentage)}%
            </Text>
          </View>
        </View>

        {/* Liquid progress bar */}
        <View style={tw`h-4 bg-black/30 rounded-full overflow-hidden relative`}>
          {/* Liquid fill */}
          <View
            style={[
              tw`h-full absolute top-0 left-0 rounded-full`,
              {
                width: `${percentage}%`,
                backgroundColor: isHighPercentage ? "#FF6B6B" : "#9B51E0",
                opacity: 0.9,
              },
            ]}
          />

          {/* Wave effect for high percentages */}
          {isHighPercentage && (
            <Animated.View
              style={[
                tw`absolute top-0 left-0 right-0 h-full`,
                {
                  transform: [
                    {
                      translateX: waveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["-100%", "100%"],
                      }),
                    },
                  ],
                  backgroundColor: "transparent",
                  backgroundImage:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                },
              ]}
            />
          )}

          {/* Milestone markers */}
          {isMilestone && (
            <View
              style={tw`absolute top-0 bottom-0 left-0 right-0 flex-row justify-between px-1`}
            >
              {[25, 50, 75, 100].map((marker) => (
                <View
                  key={marker}
                  style={[
                    tw`w-px h-full`,
                    {
                      backgroundColor:
                        percentage >= marker ? "white" : "transparent",
                      opacity: 0.3,
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Goal and celebration */}
        <View style={tw`flex-row justify-between items-center mt-1`}>
          {feed.metadata.targetInNaira ? (
            <Text style={tw`text-xs text-gray-500`}>
              Goal: ₦{feed.metadata.targetInNaira.toLocaleString()}
            </Text>
          ) : (
            <View />
          )}

          {isMilestone && (
            <View style={tw`flex-row items-center`}>
              <Animated.View
                style={{
                  opacity: glowAnim,
                  transform: [
                    {
                      scale: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.2],
                      }),
                    },
                  ],
                }}
              >
                <Ionicons name="sparkles" size={12} color="#FFD700" />
              </Animated.View>
              <Text style={tw`text-xs text-yellow-300 ml-1`}>Milestone!</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <FeedCard
      feed={feed}
      theme="donation"
      {...props}
      customContent={renderDonationProgress()}
    />
  );
};

export default DonationCard;
