import ProgressBar from "@/components/ui/ProgressBar";
import type { Badge } from "@/types/badge";
import { View } from "react-native";

export default function BadgeProgress({
  badge,
}: {
  badge: Pick<Badge, "name" | "progress">;
}) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${badge.name} progress`}
      accessibilityValue={{
        min: 0,
        max: badge.progress.target,
        now: badge.progress.current,
        text: badge.progress.label,
      }}
    >
      <ProgressBar progress={badge.progress.percent} height={6} />
    </View>
  );
}
