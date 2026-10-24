import { useAppTheme } from "@/hooks/useAppTheme";
import SheetCloseButton from "@/components/buttons/SheetCloseButton";
import { MascotMoment } from "@/components/gogo/mascot/MascotMoment";
import AppLoader from "@/components/ui/AppLoader";
import BadgeProgress from "./BadgeProgress";
import { useBadgeVisibility } from "@/services/mutations";
import type { Badge } from "@/types/badge";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatShortDate } from "@/utils/dateTimeHandler";
import { Modal, ScrollView, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BadgeEmblem } from "./BadgeCard";

export default function BadgeDetails({
  badge,
  onClose,
}: {
  badge: Badge;
  onClose: () => void;
}) {
  const { tw } = useAppTheme();
  const visibility = useBadgeVisibility();
  const insets = useSafeAreaInsets();
  const earned = badge.status === "earned";
  const close = () => {
    if (!visibility.isPending) onClose();
  };
  return (
    <Modal visible transparent animationType="slide" onRequestClose={close}>
      <View
        style={[
          tw`flex-1 justify-end bg-black/70`,
          { paddingTop: insets.top + 16 },
        ]}
      >
        <View
          accessibilityViewIsModal
          style={[
            tw`max-h-full rounded-t-[32px] border border-border dark:border-[#24345A] bg-surface dark:bg-[#07143B] px-5 pt-4`,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
        >
          <View style={tw`flex-row items-center justify-between`}>
            <Text
              accessibilityRole="header"
              style={tw`text-lg font-semibold text-foreground dark:text-white`}
            >
              Gather details
            </Text>
            <SheetCloseButton
              accessibilityLabel="Close Gather details"
              onPress={close}
              disabled={visibility.isPending}
            />
          </View>
          <ScrollView
            contentContainerStyle={tw`gap-5 pb-4`}
            showsVerticalScrollIndicator={false}
          >
            <View style={tw`items-center gap-3 pt-2`}>
              <BadgeEmblem badge={badge} size={76} />
              <Text style={tw`text-center text-2xl font-bold text-foreground dark:text-white`}>
                {badge.name}
              </Text>
              <Text style={tw`text-center text-sm text-secondary dark:text-[#AFC0E7]`}>
                {badge.description}
              </Text>
              {badge.earnedAt !== null ? (
                <Text style={tw`text-xs text-accent dark:text-[#0FF1CF]`}>
                  Earned {formatShortDate(badge.earnedAt)}
                </Text>
              ) : null}
            </View>
            <MascotMoment
              compact
              variant={
                earned
                  ? "success"
                  : badge.category === "giving"
                    ? "donation"
                    : "idle"
              }
              title={
                earned ? "Gogo is cheering for you" : "A little nudge from Gogo"
              }
              message={badge.gogo.message}
              typing={false}
            />
            <View style={tw`gap-3 rounded-2xl bg-surface dark:bg-[#101F46] p-4`}>
              <View style={tw`flex-row justify-between`}>
                <Text style={tw`text-sm font-semibold text-foreground dark:text-white`}>
                  {earned ? "Complete" : "Your progress"}
                </Text>
                <Text style={tw`text-sm text-accent dark:text-[#0FF1CF]`}>
                  {badge.progress.label}
                </Text>
              </View>
              <BadgeProgress badge={badge} />
              <Text style={tw`text-sm font-semibold text-foreground dark:text-white`}>
                What it takes
              </Text>
              <Text style={tw`text-sm leading-6 text-secondary dark:text-[#C9D5F5]`}>
                {badge.requirement}
              </Text>
            </View>
            {earned ? (
              <View style={tw`gap-3 rounded-2xl border border-border dark:border-[#24345A] p-4`}>
                <View style={tw`flex-row items-center gap-3`}>
                  <Text style={tw`flex-1 text-sm font-semibold text-foreground dark:text-white`}>
                    Show on my public profile
                  </Text>
                  {visibility.isPending ? (
                    <AppLoader accessibilityLabel="Saving profile visibility" />
                  ) : null}
                  <Switch
                    accessibilityLabel={`Show ${badge.name} on my public profile`}
                    disabled={visibility.isPending}
                    value={badge.isPublic}
                    onValueChange={(isPublic) =>
                      visibility.mutate({ code: badge.code, isPublic })
                    }
                    trackColor={{ false: "#304164", true: "#0B8C7D" }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <Text style={tw`text-xs leading-5 text-secondary dark:text-[#AFC0E7]`}>
                  {badge.category === "giving"
                    ? "Giving achievements start private. Sharing an achievement never shows donation amounts or which events you supported."
                    : "Only achievements you choose to share appear on your public profile."}
                </Text>
                {visibility.isError ? (
                  <Text
                    accessibilityRole="alert"
                    style={tw`text-sm text-danger dark:text-[#FF9CAA]`}
                  >
                    {getApiErrorMessage(
                      visibility.error,
                      "Could not save visibility. Please try again.",
                    )}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
