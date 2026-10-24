import MessageDeliveryStatus, {
  type MessageDeliveryStatusProps,
} from "./MessageDeliveryStatus";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface Props extends MessageDeliveryStatusProps {
  message: string;
  rideIconName?: IoniconName;
}

const UserChatView = ({
  message,
  time,
  optimistic = false,
  error,
  onRetry,
  rideIconName = "car-outline",
}: Props) => {
  const { tw, color } = useAppTheme();
  return (
    <View
      style={tw`max-w-[84%] min-w-[112px] p-4 bg-chatOutgoing gap-3 rounded-t-2xl rounded-bl-2xl self-end m-2 border border-borderStrong/50 dark:border-[#0FF1CF]/20`}
    >
      <Text style={tw`text-foreground dark:text-white leading-5`}>
        {message?.trim()}
      </Text>
      <View style={tw`flex-row items-center self-end gap-2`}>
        <View
          style={tw`w-6 h-6 rounded-full bg-accentFill/15 dark:bg-[#0FF1CF]/15 items-center justify-center`}
        >
          <Ionicons
            name={rideIconName}
            size={12}
            color={color("#0FF1CF", "accent")}
          />
        </View>
        <MessageDeliveryStatus
          time={time}
          optimistic={optimistic}
          error={error}
          onRetry={onRetry}
        />
      </View>
    </View>
  );
};

export default UserChatView;
