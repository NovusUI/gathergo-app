import { useAppTheme } from "@/hooks/useAppTheme";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

export interface MessageDeliveryStatusProps {
  time: string;
  optimistic?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function MessageDeliveryStatus({
  time,
  optimistic,
  error,
  onRetry,
}: MessageDeliveryStatusProps) {
  const { tw, color } = useAppTheme();
  if (error)
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Retry sending message"
        onPress={onRetry}
        style={tw`py-2 self-end shrink`}
      >
        <Text style={tw`text-danger text-xs`}>{error}</Text>
        <Text style={tw`text-danger text-xs font-semibold mt-1`}>
          Not sent · Tap to retry
        </Text>
      </TouchableOpacity>
    );
  if (optimistic)
    return (
      <View
        accessibilityLabel="Message waiting for confirmation"
        style={tw`flex-row items-center gap-1 self-end`}
      >
        <Ionicons
          name="time-outline"
          color={color("#DDE6FF", "secondary")}
          size={14}
        />
        <Text style={tw`text-secondary text-xs`}>Pending</Text>
      </View>
    );
  return (
    <Text style={tw`text-secondary dark:text-[#DDE6FF] text-xs self-end`}>
      {time}
    </Text>
  );
}
