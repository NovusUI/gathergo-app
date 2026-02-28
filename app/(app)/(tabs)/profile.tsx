import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import ProfileImageUploader from "@/components/ProfileImageUploader";
import StatsCard from "@/components/StatCard";
import Tab from "@/components/Tab";
import UserEventsTab from "@/components/UserEventsTab";
import CustomButton from "@/components/buttons/CustomBtn1";
import { layoutSpacing, spacing } from "@/constants/spacing";
import { useAuth } from "@/context/AuthContext";
import { useGetUsersEvents, useUserProfile } from "@/services/queries";
import { useRouter } from "expo-router";
import { Settings } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

const Profile = () => {
  const tabs = ["About", "Events", "Badges"];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const { user } = useAuth();
  const { data: publicProfile } = useUserProfile(user?.id);
  const router = useRouter();

  // ✅ Fetch events here
  const {
    data: userEvents,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isPending: eventsPending,
  } = useGetUsersEvents(user?.id, 5);

  console.log(userEvents);

  const events = userEvents?.pages.flatMap((page) => page.data) || [];

  const editBio = () => {
    if (user?.isProfileComplete) {
      router.push("/edit-bio");
      return;
    }
    router.push("/profile-setup");
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "About":
        return (
          <View style={tw`mt-4`}>
            <Text style={tw`text-white text-base`}>
              {publicProfile?.data.bio || "No bio added yet."}
            </Text>
          </View>
        );
      case "Events":
        return (
          <UserEventsTab
            events={events}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage ?? false}
            isPending={eventsPending}
          />
        );
      case "Badges":
        return (
          <View style={tw`mt-4`}>
            <Text style={tw`text-white text-base`}>
              {publicProfile?.data.badges?.length
                ? `${publicProfile?.data.badges.length} badges available`
                : "No  Badges yet."}
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[tw`flex-1 bg-[#01082E] flex items-center flex-col overflow-hidden`, styles.screen]}>
      <CustomeTopBarNav
        title="profile"
        onClickBack={() => router.replace("/")}
      />

      {/* Header Info */}
      <View style={[tw`flex flex-col gap-2 w-full max-w-[500px]`, styles.headerInfo]}>
        <View style={tw`flex flex-row justify-between items-center w-full`}>
          <Text style={tw`text-white text-xl`}>
            {publicProfile?.data.name || "User"}
          </Text>
          <TouchableOpacity onPress={() => router.push("/settings")}>
            {/* <Text style={tw`text-white`}>Logout</Text> */}
            <Settings color={"white"} />
          </TouchableOpacity>
        </View>
        <View style={tw`flex flex-row justify-between items-center w-full`}>
          <Text style={tw`text-white text-sm`}>
            @{publicProfile?.data.name}
          </Text>
          <Text style={tw`text-white text-sm`}>
            ({publicProfile?.data.badges?.length || 0} badges )
          </Text>
        </View>
      </View>

      {/* Profile Image + Stats */}
      <View style={[tw`flex flex-row justify-between items-center w-full max-w-[500px]`, styles.profileRow]}>
        <ProfileImageUploader uri={publicProfile?.data.profilePicUrl} />
        <StatsCard
          eventsCount={publicProfile?.data.eventsCount || 0}
          followersCount={publicProfile?.data.followersCount || 0}
          followingCount={publicProfile?.data.followingCount || 0}
        />
      </View>

      {/* Tabs */}
      <View style={[tw`flex-row justify-between border-b border-gray-800 w-full max-w-[500px]`, styles.tabRow]}>
        {tabs.map((tab) => (
          <Tab
            key={tab}
            title={tab}
            isActive={activeTab === tab}
            style={tw`w-1/4`}
            onPress={() => setActiveTab(tab)}
          />
        ))}
      </View>

      <CustomButton
        onPress={editBio}
        title="Edit bio"
        buttonClassName={`bg-[#0FF1CF] border-0 w-full`}
        textClassName={`text-black`}
        showArrow={false}
      />

      <View style={[tw`w-full max-w-[500px] flex-1`, styles.contentContainer]}>
        {renderTabContent()}
      </View>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  screen: {
    paddingTop: layoutSpacing.pageTop,
    paddingBottom: layoutSpacing.pageBottom,
    paddingHorizontal: layoutSpacing.pageHorizontal,
  },
  headerInfo: {
    marginTop: spacing.xxxl,
    marginBottom: spacing.lg,
  },
  profileRow: {
    gap: spacing.lg,
  },
  tabRow: {
    paddingVertical: spacing.lg,
  },
  contentContainer: {
    marginBottom: layoutSpacing.listBottomInset,
  },
});
