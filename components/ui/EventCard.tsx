import { EventArtworkFallback } from "@/components/ui/ArtworkFallback";
import { SdgGoalIcon } from "@/components/ui/SdgGoalIcon";
import { usePressGuard } from "@/hooks/usePressGuard";
import { normalizePersistedImpactMap } from "@/constants/impact";
import {
  SuggestedImpactCommitment,
  SuggestedImpactPath,
  SuggestedSdgGoal,
} from "@/types/impact";
import { Registration } from "@/types/auth";
import { formatShortDate } from "@/utils/dateTimeHandler";
import { numberWithCommas } from "@/utils/utils";
import { Image } from "expo-image";
import { HandHeart, MapPin, PenLine, Ticket } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

interface EventCardProps {
  id: string;
  title: string;
  description?: string | null;
  location: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  registrationType: Registration;
  registrationFee?: number;
  donationTarget?: number | null;
  lowestTicketPrice?: number | null;
  startDate: string;
  impactTitle?: string | null;
  impactDescription?: string | null;
  impactSdgGoals?: SuggestedSdgGoal[] | null;
  impactPaths?: SuggestedImpactPath[] | null;
  impactCommitments?: SuggestedImpactCommitment[] | null;
  impactMapSource?: string | null;
  tags?: string[] | null;
  onPress?: () => void;
}

export default function EventCard({
  id,
  title,
  description,
  location,
  imageUrl,
  thumbnailUrl,
  registrationType,
  registrationFee,
  donationTarget,
  lowestTicketPrice,
  startDate,
  impactTitle,
  impactSdgGoals,
  impactPaths,
  impactCommitments,
  onPress,
}: EventCardProps) {
  const eventTypeConfig =
    registrationType === "volunteer"
      ? { icon: <HandHeart size={18} color="#0FF1CF" /> }
      : registrationType === "ticket"
      ? { icon: <Ticket size={18} color="#0FF1CF" /> }
      : registrationType === "donation"
        ? {
            icon: <HandHeart size={18} color="#0FF1CF" />,
          }
        : {
            icon: <PenLine size={18} color="#0FF1CF" />,
          };

  const pricingMeta =
    registrationType === "volunteer"
      ? { label: "Take part", value: "Volunteer" }
      : registrationType === "ticket"
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
              value: numberWithCommas(donationTarget / 100, true, null),
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
  const persistedImpactMap = normalizePersistedImpactMap({
    impactSdgGoals,
    impactPaths,
    impactCommitments,
  });
  const [commitment] = persistedImpactMap.commitments;
  const [goal] = persistedImpactMap.sdgGoals;
  const [path] = persistedImpactMap.impactPaths;
  const impactSummary = commitment
    ? goal
      ? `${commitment.label} - ${goal.shortTitle}`
      : commitment.label
    : path && goal
      ? `${path.summaryLabel} - ${goal.shortTitle}`
      : path
        ? path.summaryLabel
        : impactTitle?.trim() || null;
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

        <View style={tw`ml-4 min-h-[84px] flex-1 gap-2`}>
          <Text style={tw`text-white font-semibold text-lg`} numberOfLines={2}>
            {title}
          </Text>
          {impactSummary ? (
            <View
              style={tw`flex-row items-center rounded-full bg-[#0FF1CF]/10 px-3 py-1.5 self-start`}
            >
              {goal ? (
                <View
                  style={[
                    tw`h-5 w-5 items-center justify-center rounded-full`,
                    { backgroundColor: goal.color || "#0FF1CF" },
                  ]}
                >
                  <SdgGoalIcon
                    number={goal.number}
                    color="white"
                    size={11}
                    strokeWidth={2.6}
                  />
                </View>
              ) : (
                <HandHeart size={12} color="#0FF1CF" />
              )}
              <Text
                style={tw`ml-2 text-xs font-medium text-[#B7FFF5]`}
                numberOfLines={1}
              >
                {impactSummary}
              </Text>
            </View>
          ) : description ? (
            <Text
              style={tw`text-xs leading-5 text-[#A8BAE4]`}
              numberOfLines={2}
            >
              {description}
            </Text>
          ) : null}
          {location ? (
            <View style={tw`flex-row items-center gap-1.5`}>
              <MapPin size={13} color="#8FA5C9" />
              <Text
                style={tw`flex-1 text-xs text-[#8FA5C9]`}
                numberOfLines={1}
              >
                {location}
              </Text>
            </View>
          ) : null}
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
