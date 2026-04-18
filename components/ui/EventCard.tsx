import { EventArtworkFallback } from "@/components/ui/ArtworkFallback";
import { usePressGuard } from "@/hooks/usePressGuard";
import { formatImpactSummary } from "@/constants/impact";
import { Registration } from "@/types/auth";
import { formatShortDate } from "@/utils/dateTimeHandler";
import { numberWithCommas } from "@/utils/utils";
import { Image } from "expo-image";
import { HandHeart, PenLine, Sparkles, Ticket } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

interface EventCardProps {
  id: string;
  title: string;
  location: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  registrationType: Registration;
  registrationFee?: number;
  donationTarget?: number | null;
  lowestTicketPrice?: number | null;
  startDate: string;
  impactTitle?: string | null;
  impactPercentage?: number | null;
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
  donationTarget,
  lowestTicketPrice,
  startDate,
  impactTitle,
  impactPercentage,
  onPress,
}: EventCardProps) {
  const eventTypeConfig =
    registrationType === "ticket"
      ? { icon: <Ticket size={18} color="#0FF1CF" /> }
      : registrationType === "donation"
      ? {
          icon: <HandHeart size={18} color="#0FF1CF" />,
        }
      : {
          icon: <PenLine size={18} color="#0FF1CF" />,
        };

  const pricingMeta =
    registrationType === "ticket"
      ? lowestTicketPrice && lowestTicketPrice > 0
        ? {
            label: "From",
            value: numberWithCommas(lowestTicketPrice, true, null),
          }
        : {
            label: "Access",
            value: "Tickets",
          }
      : registrationType === "donation"
      ? donationTarget && donationTarget > 0
        ? {
            label: "Target",
            value: numberWithCommas(donationTarget, true, null),
          }
        : {
            label: "Support",
            value: "Donate",
          }
      : registrationFee && registrationFee > 0
      ? {
          label: "Fee",
          value: numberWithCommas(registrationFee, true, null),
        }
      : {
          label: "Fee",
          value: "Free",
        };
  const impactSummary = formatImpactSummary({
    impactTitle,
    impactPercentage,
    registrationType,
  });
  const [showImage, setShowImage] = useState(Boolean(imageUrl));

  useEffect(() => {
    setShowImage(Boolean(imageUrl));
  }, [imageUrl]);
  const guardedPress = usePressGuard(onPress);

  return (
    <TouchableOpacity
      onPress={guardedPress}
      activeOpacity={0.9}
      style={tw`bg-[#01082e] rounded-xl p-4`}
    >
      <View style={tw`flex-row items-start`}>
        {showImage ? (
          <View
            style={tw`w-[91px] h-[84px] rounded-2xl overflow-hidden relative`}
          >
            <Image
              source={imageUrl}
              placeholder={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
              cachePolicy="disk"
              style={{ width: 91, height: 84, borderRadius: 16 }}
              contentFit="cover"
              transition={500}
              onError={() => setShowImage(false)}
            />
            <View
              style={tw`absolute top-1 left-1 p-1 bg-[#0FF1CF]/80 rounded-t-lg rounded-br-lg`}
            >
              <Text style={tw`text-white text-xs`}>
                {formatShortDate(startDate)}
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={tw`w-[91px] h-[84px] rounded-2xl overflow-hidden relative`}
          >
            <EventArtworkFallback
              registrationType={registrationType}
              compact
              height={84}
              borderRadius={16}
            />
            <View
              style={tw`absolute top-1 left-1 p-1 bg-[#0FF1CF]/80 rounded-t-lg rounded-br-lg`}
            >
              <Text style={tw`text-white text-xs`}>
                {formatShortDate(startDate)}
              </Text>
            </View>
          </View>
        )}

        <View style={tw`ml-4 min-h-[84px] flex-1 justify-between`}>
          <Text style={tw`text-white font-semibold text-lg`} numberOfLines={2}>
            {title}
          </Text>
          {Boolean(impactSummary) && (
            <View
              style={tw`mt-2 flex-row items-center rounded-full bg-[#0FF1CF]/10 px-3 py-1.5 self-start`}
            >
              <Sparkles size={12} color="#0FF1CF" />
              <Text
                style={tw`ml-2 text-xs font-medium text-[#B7FFF5]`}
                numberOfLines={1}
              >
                {impactSummary}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={tw`mt-3 flex-row items-stretch gap-3`}>
        <View
          style={tw`min-w-[52px] px-4 bg-[#0FF1CF]/10 rounded-lg items-center justify-center`}
        >
          {eventTypeConfig.icon}
        </View>

        <View
          style={tw`flex-1 px-3 py-3 bg-[#0FF1CF]/10 rounded-lg flex-row items-center justify-between gap-3`}
        >
          <Text
            style={tw`text-[#7CEBDB] text-[11px] uppercase tracking-wide shrink-0`}
          >
            {pricingMeta.label}
          </Text>
          <Text
            style={tw`flex-1 text-[#0FF1CF] font-semibold leading-6 text-right text-base`}
          >
            {pricingMeta.value}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
