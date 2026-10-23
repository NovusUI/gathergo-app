import { useAppTheme } from "@/hooks/useAppTheme";
import { usePressGuard } from "@/hooks/usePressGuard";
import { pushWithLock } from "@/utils/navigation";
import { useLockedRouter } from "@/utils/navigation";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  title: string;
  link: string;
  iconColor?: string;
  isCurrent?: boolean;
}

const Shortcut = ({
  title,
  link,
  iconColor = "#FF932E",
  isCurrent = false,
}: Props) => {
  const { tw, color } = useAppTheme();
  const router = useLockedRouter();

  const resolveLink = (target: string) => {
    const normalized = target.replace(/^\/+/, "");

    if (
      normalized === "events/create" ||
      normalized === "create-event" ||
      normalized === "new-event"
    ) {
      return "/new-event";
    }

    if (normalized.startsWith("events/")) {
      const eventId = normalized.split("/")[1];
      return eventId ? `/event/${eventId}` : "/new-event";
    }

    if (normalized.startsWith("dashboard/")) {
      return `/${normalized}`;
    }

    return `/${normalized}`;
  };

  const handlePress = () => {
    pushWithLock(router, resolveLink(link));
  };
  const guardedPress = usePressGuard(handlePress);

  return (
    <TouchableOpacity
      style={[
        tw`p-3 rounded-full gap-2 flex-row items-center min-w-[120px]`,
        isCurrent
          ? tw`border-2 border-warning dark:border-[#F1D417] bg-surfaceMuted dark:bg-[#1B2A50]`
          : tw`bg-surfaceMuted dark:bg-[#1B2A50]`,
      ]}
      onPress={guardedPress}
    >
      <View
        style={[
          tw`flex-row justify-center items-center w-8 h-8 rounded-full`,
          { backgroundColor: isCurrent ? color("#F1D417", "warningFill") : iconColor },
        ]}
      >
        <Text style={tw`font-bold text-foreground dark:text-white capitalize`}>{title[0]}</Text>
      </View>
      <View style={tw`flex-1`}>
        <Text
          style={tw`text-foreground dark:text-white text-sm capitalize`}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default Shortcut;
