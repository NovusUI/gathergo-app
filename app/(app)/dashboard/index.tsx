import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import EventsOverview from "@/components/EventsOverview";
import Shortcut from "@/components/Shortcut";
import CustomView from "@/components/View";
import ImpactPageLoader from "@/components/ui/ImpactPageLoader";
import WalletSetupReminder from "@/components/ui/WalletSetupReminder";
import Payments from "@/components/ui/Payments";
import { useDashboardData, useShortcut } from "@/hooks/useDashboard";
import { useWalletOnboarding } from "@/services/queries";
import { safeGoBack } from "@/utils/navigation";
import { useLockedRouter } from "@/utils/navigation";
import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
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
        <ImpactPageLoader
          title="Mapping your dashboard"
          message="Loading your events, attendance, and payments."
        />
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
          <View style={tw`mb-5`}>
            <WalletSetupReminder nextAction={onboarding.data.nextAction} onPress={() => router.push("/wallet")} />
          </View>
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
