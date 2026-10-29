import { useAppTheme } from "@/hooks/useAppTheme";
import { UserRoundCheck, UserRoundPlus, UsersRound } from "lucide-react-native";
import { Text, View } from "react-native";

const RELATIONSHIPS = {
  following: {
    label: "Following",
    description: "You follow this person",
    Icon: UserRoundCheck,
  },
  follower: {
    label: "Follower",
    description: "This person follows you",
    Icon: UserRoundPlus,
  },
  mutual: {
    label: "Mutual follow",
    description: "You and this person follow each other",
    Icon: UsersRound,
  },
};

export default function CarpoolFollowBadge({
  isFollowing,
  isFollowedBy,
}: {
  isFollowing: boolean;
  isFollowedBy: boolean;
}) {
  const { tw, color } = useAppTheme();
  const relationship = isFollowing
    ? isFollowedBy
      ? RELATIONSHIPS.mutual
      : RELATIONSHIPS.following
    : isFollowedBy
      ? RELATIONSHIPS.follower
      : null;

  if (!relationship) return null;
  const { Icon, label, description } = relationship;

  return (
    <View
      accessible
      accessibilityLabel={`${label}. ${description}`}
      style={tw`max-w-full flex-row items-center gap-1 rounded-full bg-accentSoft dark:bg-[#0FF1CF]/10 px-1.5 py-0.5`}
    >
      <Icon size={11} color={color("#0FF1CF", "accent")} accessible={false} />
      <Text numberOfLines={1} style={tw`shrink text-[10px] leading-3 font-semibold text-accent dark:text-[#0FF1CF]`}>
        {label}
      </Text>
    </View>
  );
}
