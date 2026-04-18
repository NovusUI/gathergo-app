import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import EventsOverview from "@/components/EventsOverview";
import Shortcut from "@/components/Shortcut";
import CustomView from "@/components/View";
import Payments from "@/components/ui/Payments";
import { useDashboardData, useShortcut } from "@/hooks/useDashboard";
import { useWalletOnboarding } from "@/services/queries";
import { safeGoBack } from "@/utils/navigation";
import { useLockedRouter } from "@/utils/navigation";
import { useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

const shortcuts = [
  { id: "wallet", title: "Wallet", link: "wallet", iconColor: "#FF932E" },
  {
    id: "feed500",
    title: "Feed500",
    link: "events/feed500",
    iconColor: "#5669FF",
  },
  {
    id: "education",
    title: "Education",
    link: "events/education",
    iconColor: "#0FF1CF",
  },
  {
    id: "medical",
    title: "Medical",
    link: "events/medical",
    iconColor: "#FF5757",
  },
  {
    id: "housing",
    title: "Housing",
    link: "events/housing",
    iconColor: "#9D4EDD",
  },
];

const Dashboard = () => {
  const router = useLockedRouter();

  const { isLoading, data, error } = useDashboardData();
  const { data: onboarding } = useWalletOnboarding();

  const { shortcuts, isLoading: loadingShortcuts } = useShortcut();

  useEffect(() => {
    console.log(shortcuts?.data?.shortcuts);
  }, [shortcuts]);

  if (isLoading) {
    return (
      <View style={tw`flex-1 pt-10 bg-[#01082E]`}>
        <CustomView className={`px-3`}>
          <CustomeTopBarNav
            title="Dashboard"
            onClickBack={() => router.replace("/")}
          />
        </CustomView>
        <ScrollView>
          <View
            style={tw`bg-gray-700 h-60 w-full flex items-center justify-center`}
          >
            <View style={tw`w-12 h-12 rounded-full bg-gray-600 mb-2`} />
            <View style={tw`bg-gray-600 h-4 w-32 rounded`} />
            <View style={tw`bg-gray-600 h-3 w-24 rounded mt-1`} />
          </View>
          <View style={tw`bg-gray-700 h-60 w-full`} />
          <View style={tw`py-2 px-5`}>
            <View style={tw`bg-gray-700 h-6 w-3/4 mb-4 rounded`} />
            <View style={tw`bg-gray-700 h-4 w-full mb-2 rounded`} />
            <View style={tw`bg-gray-700 h-4 w-5/6 rounded`} />
          </View>
          <View style={tw`bg-[#1B2A50]/40 h-2 my-3`} />
          <View style={tw`py-2 px-5`}>
            <View style={tw`bg-gray-700 h-5 w-1/2 mb-4 rounded`} />
            {[1, 2, 3, 4].map((_, i) => (
              <View key={i} style={tw`flex-row items-center mb-4`}>
                <View style={tw`bg-gray-700 h-8 w-8 rounded-full`} />
                <View style={tw`ml-3`}>
                  <View style={tw`bg-gray-700 h-4 w-32 mb-2 rounded`} />
                  <View style={tw`bg-gray-700 h-3 w-24 rounded`} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={tw`py-5 px-5`}>
          <View style={tw`bg-gray-700 h-12 w-full rounded`} />
        </View>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-[#01082E]`}>
      {/* Top Navigation */}
      <View style={tw`pt-10 pb-4 px-5`}>
        <CustomeTopBarNav
          title="Dashboard"
          onClickBack={() => safeGoBack(router, "/")}
        />
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        style={tw`flex-1 mb-20`}
        contentContainerStyle={tw`px-5`}
        showsVerticalScrollIndicator={false}
      >
        {onboarding?.data?.showPersistentAlert && (
          <TouchableOpacity
            style={tw`bg-[#1B2A50] border border-[#F1D417] rounded-2xl p-4 mb-5`}
            onPress={() => router.push('/wallet')}
          >
            <Text style={tw`text-[#F1D417] font-bold text-base mb-1`}>
              Action needed
            </Text>
            <Text style={tw`text-white text-sm mb-2`}>
              {onboarding.data.nextAction === 'ADD_SETTLEMENT_ACCOUNT'
                ? 'Add your settlement account to unlock creator payouts.'
                : onboarding.data.nextAction === 'COMPLETE_KYC'
                  ? 'Complete verification so your earnings can be settled.'
                  : 'Finish wallet setup to enable ALAT transfer.'}
            </Text>
            <Text style={tw`text-[#0FF1CF] text-sm font-semibold`}>Open wallet</Text>
          </TouchableOpacity>
        )}

        {/* Events Overview */}
        <View style={tw`mb-6`}>
          <EventsOverview initialEvents={data?.data.events} />
        </View>

        {/* Payments */}
        <View style={tw`mb-24`}>
          <Payments payments={data?.data.payments || []} />
        </View>
      </ScrollView>

      {/* Quick Access - Always visible at bottom */}
      <View
        style={tw`absolute bottom-0 left-0 right-0 bg-[#01082E] pt-3 pb-5 px-5 border-t border-gray-800`}
      >
        <Text style={tw`text-white text-lg font-bold mb-3`}>Quick Access</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={tw`flex-row`}
        >
          <View style={tw`flex-row gap-3`}>
            {shortcuts?.data?.shortcuts.map((shortcut) => (
              <Shortcut
                key={shortcut.id}
                title={shortcut.title}
                link={shortcut.link}
                iconColor={shortcut.iconColor}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default Dashboard;
