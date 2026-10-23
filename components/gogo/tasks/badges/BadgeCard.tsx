import BadgeProgress from "./BadgeProgress";
import type { Badge } from "@/types/badge";
import {
  Check,
  Clock3,
  Gift,
  Handshake,
  Heart,
  LockKeyhole,
  PartyPopper,
  Sparkles,
  Sprout,
  Tent,
} from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { GatherCardBackground } from "./GatherArtwork";

const ICONS = {
  party: PartyPopper,
  sparkles: Sparkles,
  handshake: Handshake,
  clock: Clock3,
  tent: Tent,
  sprout: Sprout,
  gift: Gift,
  heart: Heart,
};

export const CATEGORY_LABELS: Record<Badge["category"], string> = {
  attending: "Attending",
  volunteering: "Volunteering",
  hosting: "Hosting",
  giving: "Giving",
};

export function BadgeEmblem({
  badge,
  size = 48,
}: {
  badge: Pick<Badge, "icon" | "status">;
  size?: number;
}) {
  const earned = badge.status === "earned";
  const Icon = ICONS[badge.icon];
  return (
    <View
      style={[
        tw`items-center justify-center rounded-2xl border`,
        {
          width: size,
          height: size,
          backgroundColor: earned ? "#193744" : "#152342",
          borderColor: earned ? "#0FF1CF" : "#304164",
        },
      ]}
    >
      <Icon size={size * 0.46} color={earned ? "#0FF1CF" : "#AFC0E7"} />
    </View>
  );
}

export default function BadgeCard({
  badge,
  onPress,
}: {
  badge: Badge;
  onPress: () => void;
}) {
  const earned = badge.status === "earned";
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${badge.name}. ${earned ? "Earned" : badge.progress.label}. View requirements`}
      onPress={onPress}
      style={[
        tw`relative overflow-hidden gap-3 rounded-3xl border bg-[#0A1739] p-4`,
        { borderColor: earned ? "#1C5C61" : "#24345A" },
      ]}
    >
      <GatherCardBackground />
      <View style={tw`flex-row items-center gap-3`}>
        <BadgeEmblem badge={badge} />
        <View style={tw`flex-1 gap-1`}>
          <Text
            style={tw`text-[10px] font-semibold uppercase tracking-widest text-[#8FA5E2]`}
          >
            {CATEGORY_LABELS[badge.category]}
          </Text>
          <Text style={tw`text-lg font-semibold text-white`}>{badge.name}</Text>
        </View>
        {earned ? (
          <Check size={20} color="#0FF1CF" />
        ) : badge.status === "locked" ? (
          <LockKeyhole size={16} color="#8FA5E2" />
        ) : null}
      </View>
      <Text style={tw`text-sm leading-5 text-[#AFC0E7]`}>
        {badge.description}
      </Text>
      <BadgeProgress badge={badge} />
      <View style={tw`flex-row justify-between gap-2`}>
        <Text style={tw`text-xs text-[#C9D5F5]`}>
          {earned ? "Earned" : badge.progress.label}
        </Text>
        <Text style={tw`text-xs text-[#0FF1CF]`}>
          {earned
            ? badge.isPublic
              ? "On your profile"
              : "Only you"
            : "How to earn →"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
