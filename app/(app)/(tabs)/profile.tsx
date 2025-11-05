import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import ProfileImageUploader from "@/components/ProfileImageUploader";
import StatsCard from "@/components/StatCard";
import Tab from "@/components/Tab";
import UserEventsTab from "@/components/UserEventsTab";
import CustomButton from "@/components/buttons/CustomBtn1";
import { useAuth } from "@/context/AuthContext";
import { useGetUsersEvents, useUserProfile } from "@/services/queries";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

const Profile = () => {
  const tabs = ["About", "Events", "Review"];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const { user } = useAuth();
  const { error, isPending, data: publicProfile } = useUserProfile(user?.id);
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
          <View className="mt-4">
            <Text className="text-white text-base">
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
      case "Review":
        return (
          <View className="mt-4">
            <Text className="text-white text-base">
              {publicProfile?.data.reviews?.length
                ? `${publicProfile?.data.reviews.length} reviews available`
                : "No reviews yet."}
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-[#01082E] flex items-center flex-col pt-20 pb-10 px-5 overflow-hidden">
      <CustomeTopBarNav
        title="profile"
        onClickBack={() => router.replace("/")}
      />

      {/* Header Info */}
      <View className="flex flex-col gap-2 w-full max-w-[500px] mt-10 mb-5">
        <View className="flex flex-row justify-between items-center w-full">
          <Text className="text-white text-xl">
            {publicProfile?.data.name || "User"}
          </Text>
          <Text className="text-white text-xl">5.0</Text>
        </View>
        <View className="flex flex-row justify-between items-center w-full">
          <Text className="text-white text-sm">
            @{publicProfile?.data.name}
          </Text>
          <Text className="text-white text-sm">
            ({publicProfile?.data.reviews?.length || 0} reviews)
          </Text>
        </View>
      </View>

      {/* Profile Image + Stats */}
      <View className="flex flex-row justify-between items-center w-full max-w-[500px] gap-5">
        <ProfileImageUploader uri={publicProfile?.data.profilePicUrl} />
        <StatsCard
          eventsCount={publicProfile?.data.eventsCount || 0}
          followersCount={publicProfile?.data.followersCount || 0}
          followingCount={publicProfile?.data.followingCount || 0}
        />
      </View>

      {/* Tabs */}
      <View className="flex-row justify-between py-4 border-b border-gray-800 w-full max-w-[500px]">
        {tabs.map((tab) => (
          <Tab
            key={tab}
            title={tab}
            isActive={activeTab === tab}
            className="w-1/4"
            onPress={() => setActiveTab(tab)}
          />
        ))}
      </View>

      <CustomButton
        onPress={editBio}
        title="Edit bio"
        buttonClassName="bg-[#0FF1CF] border-0 !w-full"
        textClassName="!text-black"
        showArrow={false}
      />

      <View className="w-full max-w-[500px] flex-1 mb-20">
        {renderTabContent()}
      </View>
    </View>
  );
};

export default Profile;
