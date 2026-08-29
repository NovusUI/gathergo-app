import { Ionicons } from "@expo/vector-icons";
import type {
  CarpoolVibeSafetySignal,
  CarpoolVibeSafetyTip,
} from "@/constants/carpool";
import { getCarpoolVibeSafetyRoleCopy } from "@/constants/carpool";
import type { ComponentProps } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface RideVibeChatCardProps {
  expanded: boolean;
  iconName: IoniconName;
  isTyping: boolean;
  label: string;
  message: string;
  onOpenVibeCheck?: () => void;
  onToggle: () => void;
  destinationLabel: string;
  departureTimeLabel?: string | null;
  expiryLabel?: string | null;
  origin?: string | null;
  roleLabel: string;
  safetySignal: CarpoolVibeSafetySignal;
  safetyTips: CarpoolVibeSafetyTip[];
  seatLabel?: string | null;
  statusLabel: string;
  vibeCheckButtonLabel?: string;
}

export default function RideVibeChatCard({
  expanded,
  iconName,
  isTyping,
  label,
  message,
  onOpenVibeCheck,
  onToggle,
  destinationLabel,
  departureTimeLabel,
  expiryLabel,
  origin,
  roleLabel,
  safetySignal,
  safetyTips,
  seatLabel,
  statusLabel,
  vibeCheckButtonLabel = "Complete signal",
}: RideVibeChatCardProps) {
  const safetyCopy = getCarpoolVibeSafetyRoleCopy(
    safetySignal,
    roleLabel,
    label
  );

  return (
    <View
      style={tw`bg-[#07143B] rounded-3xl border border-[#1B2A50] overflow-hidden`}
    >
      {expanded && (
        <View style={tw`absolute top-0 left-0 right-0 h-1 flex-row`}>
          <View style={tw`flex-1 bg-[#0FF1CF]`} />
          <View style={tw`flex-1 bg-[#31C6F6]`} />
          <View style={tw`flex-1 bg-[#8FA5E2]`} />
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.9}
        accessibilityRole="button"
        onPress={onToggle}
        style={[tw`flex-row gap-3 p-4`, expanded ? tw`pt-5` : null]}
      >
        <View
          style={tw`w-12 h-12 rounded-2xl bg-[#0FF1CF]/12 items-center justify-center border border-[#0FF1CF]/20`}
        >
          <Ionicons name={iconName} size={26} color="#0FF1CF" />
        </View>

        <View style={tw`flex-1 min-w-0`}>
          <Text style={tw`text-[#0FF1CF] text-xs`} numberOfLines={1}>
            {label} ride vibe
          </Text>
          <Text
            style={[
              tw`text-white text-sm leading-5 mt-1`,
              { minHeight: expanded ? 60 : 40 },
            ]}
            numberOfLines={expanded ? 3 : 2}
          >
            {message}
            <Text style={tw`text-[#0FF1CF]`}>{isTyping ? " |" : ""}</Text>
          </Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={tw`px-4 pb-4 gap-3`}>
          <View style={tw`flex-row flex-wrap gap-2`}>
            <View style={tw`px-3 py-1 rounded-full bg-[#0FF1CF]/10`}>
              <Text style={tw`text-[#0FF1CF] text-xs`}>{roleLabel}</Text>
            </View>
            <View style={tw`px-3 py-1 rounded-full bg-[#31C6F6]/10`}>
              <Text style={tw`text-[#31C6F6] text-xs`}>{statusLabel}</Text>
            </View>
            {Boolean(seatLabel) && (
              <View style={tw`px-3 py-1 rounded-full bg-[#8FA5E2]/10`}>
                <Text style={tw`text-[#DDE6FF] text-xs`}>{seatLabel}</Text>
              </View>
            )}
          </View>

          <View style={tw`pt-3 border-t border-[#1B2A50] gap-3`}>
            <View style={tw`flex-row items-center gap-3`}>
              <View
                style={tw`w-8 h-8 rounded-full bg-[#0FF1CF]/10 items-center justify-center`}
              >
                <Ionicons name="location-outline" size={15} color="#0FF1CF" />
              </View>
              <View style={tw`flex-1 min-w-0`}>
                <Text style={tw`text-[#8FA5E2] text-xs`}>Pickup</Text>
                <Text style={tw`text-white text-xs`} numberOfLines={1}>
                  {origin || "Pickup point pending"}
                </Text>
              </View>
            </View>

            <View style={tw`flex-row items-center gap-3`}>
              <View
                style={tw`w-8 h-8 rounded-full bg-[#31C6F6]/10 items-center justify-center`}
              >
                <Ionicons name="flag-outline" size={15} color="#31C6F6" />
              </View>
              <View style={tw`flex-1 min-w-0`}>
                <Text style={tw`text-[#8FA5E2] text-xs`}>Destination</Text>
                <Text style={tw`text-white text-xs`} numberOfLines={1}>
                  {destinationLabel}
                </Text>
              </View>
            </View>

            <View style={tw`flex-row items-center gap-3`}>
              <View
                style={tw`w-8 h-8 rounded-full bg-[#F8D05C]/10 items-center justify-center`}
              >
                <Ionicons name="time-outline" size={15} color="#F8D05C" />
              </View>
              <View style={tw`flex-1 min-w-0`}>
                <Text style={tw`text-[#8FA5E2] text-xs`}>Departure</Text>
                <Text style={tw`text-white text-xs`} numberOfLines={1}>
                  {departureTimeLabel || "Time pending"}
                </Text>
              </View>
            </View>
          </View>

          <View style={tw`pt-3 border-t border-[#1B2A50] gap-3`}>
            <View style={tw`flex-row items-center gap-2`}>
              <View
                style={tw`w-8 h-8 rounded-full bg-[#F8D05C]/10 items-center justify-center`}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color="#F8D05C"
                />
              </View>
              <View style={tw`flex-1 min-w-0`}>
                <Text style={tw`text-white text-sm font-semibold`}>
                  Ride safety
                </Text>
                <Text style={tw`text-[#A8BAE4] text-xs`} numberOfLines={2}>
                  {safetyCopy.description}
                </Text>
              </View>
            </View>

            <View style={tw`flex-row flex-wrap gap-2`}>
              <View style={tw`px-3 py-2 rounded-2xl bg-[#0FF1CF]/10`}>
                <Text style={tw`text-[#0FF1CF] text-xs`}>
                  {safetyCopy.primarySignalLabel}:{" "}
                  {safetyCopy.primarySignalValue}
                </Text>
              </View>
              <View style={tw`px-3 py-2 rounded-2xl bg-[#31C6F6]/10`}>
                <Text style={tw`text-[#31C6F6] text-xs`}>
                  {safetyCopy.secondarySignalLabel}:{" "}
                  {safetyCopy.secondarySignalValue}
                </Text>
              </View>
            </View>

            <View style={tw`gap-2`}>
              {safetyTips.slice(0, 2).map((tip) => (
                <View key={tip.title} style={tw`flex-row gap-3`}>
                  <Ionicons name={tip.iconName} size={16} color="#0FF1CF" />
                  <View style={tw`flex-1 min-w-0`}>
                    <Text style={tw`text-white text-xs font-semibold`}>
                      {tip.title}
                    </Text>
                    <Text style={tw`text-[#A8BAE4] text-xs leading-4`}>
                      {tip.body}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {onOpenVibeCheck && (
            <TouchableOpacity
              activeOpacity={0.86}
              accessibilityRole="button"
              onPress={onOpenVibeCheck}
              style={tw`flex-row items-center justify-center gap-2 rounded-2xl bg-[#F8D05C]/10 border border-[#F8D05C]/20 py-3`}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={17}
                color="#F8D05C"
              />
              <Text style={tw`text-[#F8D05C] text-sm font-semibold`}>
                {vibeCheckButtonLabel}
              </Text>
            </TouchableOpacity>
          )}

          {expiryLabel && (
            <View
              style={tw`self-start px-3 py-1 rounded-full bg-[#F8D05C]/10`}
            >
              <Text style={tw`text-[#F8D05C] text-xs`}>
                Chat expires {expiryLabel}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
