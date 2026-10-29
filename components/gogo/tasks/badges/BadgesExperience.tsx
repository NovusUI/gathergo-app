import { useAppTheme } from "@/hooks/useAppTheme";
import { MascotMoment } from "@/components/gogo/mascot/MascotMoment";
import GogoRefreshScrollView, {
  RefreshIndicator,
} from "@/components/ui/GogoRefreshScrollView";
import ImpactPageLoader from "@/components/ui/ImpactPageLoader";
import { layoutSpacing } from "@/constants/spacing";
import { useMyBadges } from "@/services/queries";
import type { Badge, BadgeCode } from "@/types/badge";
import { useState } from "react";
import {
  SectionList,
  type SectionListProps,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import BadgeCard from "./BadgeCard";
import BadgeDetails from "./BadgeDetails";

type Props = Pick<
  SectionListProps<Badge>,
  "ListHeaderComponent" | "renderSectionHeader"
>;

export default function BadgesExperience({
  ListHeaderComponent,
  renderSectionHeader,
}: Props = {}) {
  const { tw } = useAppTheme();
  const query = useMyBadges();
  const [selectedCode, setSelectedCode] = useState<BadgeCode | null>(null);
  const collection = query.isSuccess ? query.data.data : null;
  const selected = collection?.badges.find(
    (badge) => badge.code === selectedCode,
  );
  const next = collection?.badges
    .filter((badge) => badge.status !== "earned")
    .sort((a, b) => b.progress.percent - a.progress.percent)[0];
  const intro = collection ? (
    <View style={tw`gap-3 pb-1`}>
      <View style={tw`flex-row items-baseline justify-between gap-3`}>
        <Text
          accessibilityRole="header"
          style={tw`text-lg font-bold text-foreground dark:text-white`}
        >
          Gather
        </Text>
        <Text style={tw`text-sm text-accent dark:text-[#0FF1CF]`}>
          {collection.earnedCount} / {collection.totalCount} earned
        </Text>
      </View>
      <MascotMoment
        compact
        variant={next ? "idle" : "success"}
        title={
          next ? `Gogo’s next nudge · ${next.name}` : "Gogo is cheering for you"
        }
        message={
          next
            ? next.gogo.message
            : "Every achievement earned! Thank you for showing up, helping out and bringing people together."
        }
        typing={false}
      />
    </View>
  ) : null;
  return (
    <View style={tw`flex-1`}>
      <SectionList<Badge>
        sections={[{ data: collection ? collection.badges : [] }]}
        keyExtractor={(badge) => badge.code}
        ListHeaderComponent={ListHeaderComponent}
        renderSectionHeader={(info) => (
          <>
            {renderSectionHeader?.(info)}
            <RefreshIndicator />
          </>
        )}
        stickySectionHeadersEnabled={Boolean(renderSectionHeader)}
        contentContainerStyle={[
          tw`gap-3`,
          { paddingBottom: layoutSpacing.listBottomInset },
        ]}
        showsVerticalScrollIndicator={false}
        renderScrollComponent={(props) => (
          <GogoRefreshScrollView
            {...props}
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            inlineIndicator
          />
        )}
        ListFooterComponent={
          query.isPending ? (
            <ImpactPageLoader
              compact
              title="Finding your milestones"
              message="Gogo is gathering your milestones and progress."
            />
          ) : query.isError ? (
            <View style={tw`gap-4 py-5`}>
              <MascotMoment
                compact
                variant="error"
                title="Gogo hit a little bump"
                message="I couldn’t load Gather. Let’s try again."
                typing={false}
              />
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => void query.refetch()}
                style={tw`min-h-11 items-center justify-center rounded-2xl bg-surface dark:bg-[#123557]`}
              >
                <Text style={tw`font-semibold text-accent dark:text-[#0FF1CF]`}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <View style={tw`gap-3`}>
            {index === 0 ? intro : null}
            <BadgeCard
              badge={item}
              onPress={() => setSelectedCode(item.code)}
            />
          </View>
        )}
      />
      {selected ? (
        <BadgeDetails
          key={selected.code}
          badge={selected}
          onClose={() => setSelectedCode(null)}
        />
      ) : null}
    </View>
  );
}
