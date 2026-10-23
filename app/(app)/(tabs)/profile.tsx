import { useAppTheme } from "@/hooks/useAppTheme";
import { GatherIcon } from "@/components/gogo/tasks/badges/GatherArtwork";
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import ProfileImageUploader from "@/components/ProfileImageUploader";
import StatsCard from "@/components/StatCard";
import Tab from "@/components/Tab";
import UserEventsTab from "@/components/UserEventsTab";
import CustomButton from "@/components/buttons/CustomBtn1";
import BadgesExperience from "@/components/gogo/tasks/badges/BadgesExperience";
import AppLoader from "@/components/ui/AppLoader";
import { layoutSpacing } from "@/constants/spacing";
import { useAuth } from "@/context/AuthContext";
import {
  useGetUsersEvents,
  useMyBadges,
  useUserProfile,
} from "@/services/queries";
import { useLockedRouter } from "@/utils/navigation";
import { useFocusEffect } from "expo-router";
import { Settings } from "lucide-react-native";
import { useCallback, useState, type ComponentProps } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TABS = ["About", "Events", "Gather"] as const;
const TAB_ICONS: ComponentProps<typeof Tab>["icon"][] = [
  { library: "Ionicons", name: "information-circle-outline" },
  { library: "Ionicons", name: "calendar-clear-outline" },
  undefined,
];

export default function Profile() {
  const { tw, color } = useAppTheme();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("About");
  const { user } = useAuth();
  const profileQuery = useUserProfile(user?.id, { enabled: Boolean(user) });
  const profile = profileQuery.data?.data;
  const { data: badgeCollection, refetch: refetchBadges } = useMyBadges();
  useFocusEffect(
    useCallback(() => {
      if (user?.id) void refetchBadges();
    }, [refetchBadges, user?.id]),
  );
  const router = useLockedRouter();
  const {
    data: userEvents,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isPending: eventsPending,
  } = useGetUsersEvents(user?.id, 5, { enabled: Boolean(user) });
  const events = userEvents?.pages.flatMap((page) => page.data) ?? [];

  const editBio = () =>
    router.push(user?.isProfileComplete ? "/edit-bio" : "/profile-setup");
  const summary = (
    <View style={tw`gap-3 pb-3 pt-2`}>
      <View style={tw`flex-row items-center gap-4`}>
        <ProfileImageUploader uri={profile?.profilePicUrl} />
        {profile ? (
          <StatsCard
            eventsCount={profile.eventsCount}
            followersCount={profile.followersCount}
            followingCount={profile.followingCount}
          />
        ) : profileQuery.isError ? (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => void profileQuery.refetch()}
            style={tw`flex-1 min-h-11 items-center justify-center`}
          >
            <Text style={tw`text-sm text-accent dark:text-[#0FF1CF]`}>Retry profile</Text>
          </TouchableOpacity>
        ) : (
          <View style={tw`flex-1 items-center`}>
            <AppLoader accessibilityLabel="Loading profile summary" />
          </View>
        )}
      </View>
      <View style={tw`flex-row items-center justify-between gap-3`}>
        <Text
          numberOfLines={1}
          style={tw`flex-1 text-base font-semibold text-foreground dark:text-white`}
        >
          {user?.fullName || profile?.name || "Your profile"}
        </Text>
        {badgeCollection ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`View Gather, ${badgeCollection.data.earnedCount} achievements earned`}
            onPress={() => setActiveTab("Gather")}
            style={tw`min-h-11 justify-center`}
          >
            <Text style={tw`text-xs text-accent dark:text-[#0FF1CF]`}>
              Gather · {badgeCollection.data.earnedCount}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <CustomButton
        onPress={editBio}
        title="Edit bio"
        showArrow={false}
        buttonClassName="w-full p-0 h-9 bg-surfaceMuted dark:bg-[#142344] border-0"
        textClassName="text-foreground dark:text-white text-xs normal-case mr-0"
      />
    </View>
  );
  const tabs = (
    <View
      style={tw`flex-row gap-2 border-b border-border dark:border-[#24345A] bg-background dark:bg-[#01082E] py-2`}
    >
      {TABS.map((tab, index) => (
        <Tab
          key={tab}
          title={tab}
          isActive={activeTab === tab}
          className="flex-1"
          onPress={() => setActiveTab(tab)}
          icon={TAB_ICONS[index]}
          iconContent={
            tab === "Gather" ? (
              <GatherIcon color={activeTab === tab ? color("#01082E", "onAccent") : color("#0FF1CF", "accent")} />
            ) : undefined
          }
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={tw`flex-1 bg-background dark:bg-[#01082E] px-5`}>
      <View style={tw`w-full max-w-[500px] self-center`}>
        <CustomeTopBarNav
          title={profile?.name ? `@${profile.name}` : "Profile"}
          onClickBack={() => router.replace("/")}
          rightNode={
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              onPress={() => router.push("/settings")}
              style={tw`h-11 w-11 items-center justify-center`}
            >
              <Settings color={color("white", "foreground")} size={22} />
            </TouchableOpacity>
          }
        />
      </View>
      <View style={tw`w-full max-w-[500px] flex-1 self-center`}>
        {activeTab === "About" ? (
          <ScrollView
            stickyHeaderIndices={[1]}
            contentContainerStyle={{
              paddingBottom: layoutSpacing.listBottomInset,
            }}
            showsVerticalScrollIndicator={false}
          >
            {summary}
            <View>{tabs}</View>
            <View style={tw`py-4`}>
              <Text style={tw`text-base leading-6 text-secondary dark:text-[#C9D5F5]`}>
                {profile?.bio || "No bio added yet."}
              </Text>
            </View>
          </ScrollView>
        ) : activeTab === "Events" ? (
          <UserEventsTab
            events={events}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage ?? false}
            isPending={eventsPending}
            ListHeaderComponent={summary}
            renderSectionHeader={() => tabs}
          />
        ) : (
          <BadgesExperience
            ListHeaderComponent={summary}
            renderSectionHeader={() => tabs}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
