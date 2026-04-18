import { usePressGuard } from "@/hooks/usePressGuard";
import { pushWithLock } from "@/utils/navigation";
import { useLockedRouter } from "@/utils/navigation";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

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
          ? tw`border-2 border-[#F1D417] bg-[#1B2A50]`
          : tw`bg-[#1B2A50]`,
      ]}
      onPress={guardedPress}
    >
      <View
        style={[
          tw`flex-row justify-center items-center w-8 h-8 rounded-full`,
          { backgroundColor: isCurrent ? "#F1D417" : iconColor },
        ]}
      >
        <Text style={tw`font-bold text-white capitalize`}>{title[0]}</Text>
      </View>
      <View style={tw`flex-1`}>
        <Text
          style={tw`text-white text-sm capitalize`}
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
