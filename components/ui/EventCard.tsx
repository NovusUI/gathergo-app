import { Registration } from "@/types/auth";
import { spacing } from "@/constants/spacing";
import { formatShortDate } from "@/utils/dateTimeHandler";
import { numberWithCommas } from "@/utils/utils";
import { Image } from "expo-image";
import { HandHeart, PenLine, Ticket } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

interface EventCardProps {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  thumbnailUrl?: string;
  registrationType: Registration;
  registrationFee?: number;
  startDate: string;
  onPress?: () => void;
}

export default function EventCard({
  id,
  title,
  location,
  imageUrl,
  thumbnailUrl,
  registrationType,
  registrationFee,
  startDate,
  onPress,
}: EventCardProps) {
  const eventTypeConfig =
    registrationType === "ticket"
      ? { label: "Ticket", icon: <Ticket size={14} color="#0FF1CF" /> }
      : registrationType === "donation"
      ? {
          label: "Donation",
          icon: <HandHeart size={14} color="#0FF1CF" />,
        }
      : {
          label: "Registration",
          icon: <PenLine size={14} color="#0FF1CF" />,
        };

  const priceLabel =
    registrationType === "ticket"
      ? "Tickets"
      : registrationType === "donation"
      ? "Donate"
      : numberWithCommas(registrationFee, true, null);

  return (
    <TouchableOpacity
      key={id}
      onPress={onPress}
      style={[tw`flex-row items-center bg-[#01082e] rounded-xl`, styles.card]}
    >
      {imageUrl ? (
        <View style={tw`w-[91px] h-[84px] rounded-lg overflow-hidden relative`}>
          <Image
            source={imageUrl}
            placeholder={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
            cachePolicy="disk"
            style={{ width: 91, height: 84, borderRadius: 8 }}
            contentFit="cover"
            transition={500}
          />
          <View style={[tw`absolute bg-[#0FF1CF]/80 rounded-t-lg rounded-br-lg`, styles.dateBadge]}>
            <Text style={tw`text-white text-xs`}>
              {formatShortDate(startDate)}
            </Text>
          </View>
        </View>
      ) : (
        <View
          style={tw`w-20 h-20 rounded-lg bg-slate-300 flex justify-center items-center`}
        >
          <Text style={tw`-rotate-45 text-slate-400 text-xs`}>
            Party Animal
          </Text>
        </View>
      )}

      <View style={[tw`flex-1 flex flex-col justify-between h-full`, styles.content]}>
        <Text style={tw`text-white font-semibold text-lg`}>{title}</Text>

        <View style={tw`flex-row justify-between`}>
          <View style={tw`flex-row gap-3`}>
            <View style={[tw`bg-[#0FF1CF]/10 rounded-lg flex-row`, styles.tag]}>
              {eventTypeConfig.icon}
              <Text style={tw`text-[#0FF1CF] ml-1`}>{eventTypeConfig.label}</Text>
            </View>
          </View>
          <View style={[tw`bg-[#0FF1CF]/10 rounded-lg`, styles.tag]}>
            <Text style={tw`text-[#0FF1CF]`}>{priceLabel}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    minHeight: 112,
  },
  dateBadge: {
    top: spacing.xs,
    left: spacing.xs,
    padding: spacing.xs,
  },
  content: {
    marginLeft: spacing.lg,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
});
