import MessageDeliveryStatus, {
  type MessageDeliveryStatusProps,
} from "@/components/ui/MessageDeliveryStatus";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface VibeCheckMessageCardProps extends MessageDeliveryStatusProps {
  actorLabel: string;
  isComplete: boolean;
  needsConfirmation: boolean;
  rideIconName: IoniconName;
  signalAction: string;
  signalTitle: string;
  onPress?: () => void;
}

export default function VibeCheckMessageCard({
  actorLabel,
  isComplete,
  needsConfirmation,
  rideIconName,
  signalAction,
  signalTitle,
  time,
  optimistic,
  error,
  onRetry,
  onPress,
}: VibeCheckMessageCardProps) {
  const { tw, color } = useAppTheme();
  const card = (
    <View
      style={[
        tw`my-2 mx-3 rounded-3xl border p-4 gap-3`,
        needsConfirmation
          ? tw`bg-warningFill/10 dark:bg-[#F8D05C]/10 border-warning/25 dark:border-[#F8D05C]/25`
          : tw`bg-surface dark:bg-[#07143B] border-border dark:border-[#1B2A50]`,
      ]}
    >
      <View style={tw`flex-row items-start gap-3`}>
        <View
          style={[
            tw`w-11 h-11 rounded-2xl items-center justify-center border`,
            needsConfirmation
              ? tw`bg-warningFill/10 dark:bg-[#F8D05C]/10 border-warning/25 dark:border-[#F8D05C]/25`
              : tw`bg-accentFill/10 dark:bg-[#0FF1CF]/10 border-accent/20 dark:border-[#0FF1CF]/20`,
          ]}
        >
          <Ionicons
            name={needsConfirmation ? "shield-checkmark-outline" : rideIconName}
            size={23}
            color={
              needsConfirmation
                ? color("#F8D05C", "warning")
                : color("#0FF1CF", "accent")
            }
          />
        </View>

        <View style={tw`flex-1 min-w-0`}>
          <Text
            style={tw`text-foreground dark:text-white text-sm font-semibold`}
          >
            {signalTitle}
          </Text>
          <Text
            style={tw`text-foreground dark:text-[#DDE6FF] text-xs leading-5 mt-1`}
          >
            {actorLabel} says {signalAction}
          </Text>
          <Text
            style={[
              tw`text-xs font-semibold mt-2`,
              needsConfirmation
                ? tw`text-warning dark:text-[#F8D05C]`
                : tw`text-secondary dark:text-[#8FA5E2]`,
            ]}
          >
            {needsConfirmation
              ? "Tap to complete your side"
              : isComplete
                ? "Handshake complete"
                : "Waiting for the other side"}
          </Text>
        </View>
      </View>

      <MessageDeliveryStatus
        time={time}
        optimistic={optimistic}
        error={error}
        onRetry={onRetry}
      />
    </View>
  );

  if (!needsConfirmation || !onPress) return card;

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      accessibilityRole="button"
      onPress={onPress}
    >
      {card}
    </TouchableOpacity>
  );
}
