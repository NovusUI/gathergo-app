import { useAppTheme } from "@/hooks/useAppTheme";
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
  const { tw, color } = useAppTheme();
  const earned = badge.status === "earned";
  const Icon = ICONS[badge.icon];
  return (
    <View
      style={[
        tw`items-center justify-center rounded-2xl border`,
        {
          width: size,
          height: size,
          backgroundColor: earned ? color("#193744", "accentSoft") : color("#152342", "surfaceMuted"),
          borderColor: earned ? color("#0FF1CF", "accent") : color("#304164", "border"),
        },
      ]}
    >
      <Icon size={size * 0.46} color={earned ? color("#0FF1CF", "accent") : color("#AFC0E7", "secondary")} />
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
  const { tw, color } = useAppTheme();
  const earned = badge.status === "earned";
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${badge.name}. ${earned ? "Earned" : badge.progress.label}. View requirements`}
      onPress={onPress}
      style={[
        tw`relative overflow-hidden gap-3 rounded-3xl border bg-surface dark:bg-[#0A1739] p-4`,
        { borderColor: earned ? color("#1C5C61", "border") : color("#24345A", "border") },
      ]}
    >
      <GatherCardBackground />
      <View style={tw`flex-row items-center gap-3`}>
        <BadgeEmblem badge={badge} />
        <View style={tw`flex-1 gap-1`}>
          <Text
            style={tw`text-[10px] font-semibold uppercase tracking-widest text-secondary dark:text-[#8FA5E2]`}
          >
            {CATEGORY_LABELS[badge.category]}
          </Text>
          <Text style={tw`text-lg font-semibold text-foreground dark:text-white`}>{badge.name}</Text>
        </View>
        {earned ? (
          <Check size={20} color={color("#0FF1CF", "accent")} />
        ) : badge.status === "locked" ? (
          <LockKeyhole size={16} color={color("#8FA5E2", "secondary")} />
        ) : null}
      </View>
      <Text style={tw`text-sm leading-5 text-secondary dark:text-[#AFC0E7]`}>
        {badge.description}
      </Text>
      <BadgeProgress badge={badge} />
      <View style={tw`flex-row justify-between gap-2`}>
        <Text style={tw`text-xs text-secondary dark:text-[#C9D5F5]`}>
          {earned ? "Earned" : badge.progress.label}
        </Text>
        <Text style={tw`text-xs text-accent dark:text-[#0FF1CF]`}>
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
