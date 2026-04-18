import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import { layoutSpacing, spacing } from "@/constants/spacing";
import { useAuth } from "@/context/AuthContext";
import { usePushNotification } from "@/context/PushNotificationContext";
import { useRemovePushToken } from "@/services/mutations";
import { useAuthStore } from "@/store/auth";
import { safeGoBack } from "@/utils/navigation";
import { useLockedRouter } from "@/utils/navigation";
import { saveItem } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

const settingsItems = [
  {
    label: "My Passes",
    subtitle: "Open every ticket and registration you own in one place",
    route: "/my-passes",
    icon: "ticket-outline" as const,
  },
  {
    label: "Dashboard",
    subtitle: "View event performance and finance metrics",
    route: "/dashboard",
    icon: "bar-chart-outline" as const,
  },
  {
    label: "Scanner",
    subtitle: "Manage check-ins, scan tickets and registrations",
    route: "/scanner",
    icon: "scan-outline" as const,
  },
  {
    label: "Wallet",
    subtitle: "Add or edit payout account, complete KYC, and see settlement history ",
    route: "/wallet",
    icon: "wallet" as const,
  },
];

const Settings = () => {
  const { user, setUser } = useAuth();
  const { expoPushToken } = usePushNotification();
  const router = useLockedRouter();
  const { mutateAsync: removePushToken } = useRemovePushToken();

  const logout = async () => {
    if (expoPushToken) {
      await removePushToken({ token: expoPushToken }).catch((error) => {
        console.log("failed to remove push token on logout", error);
      });
    }

    const { logout } = useAuthStore.getState();
    await logout();
    await saveItem("user", JSON.stringify({}));
    setUser(null);
    router.replace("/login");
  };

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={[tw`flex-1 bg-[#01082E]`, styles.screen]}>
      <CustomeTopBarNav
        title="settings"
        onClickBack={() => safeGoBack(router, "/")}
      />

      <View style={[tw`w-full max-w-[500px] self-center`, styles.content]}>
        <View style={[tw`bg-[#122255] rounded-2xl border border-[#203370]`, styles.accountCard]}>
          <Text style={tw`text-white text-lg font-bold`}>
            {user?.name || "Account"}
          </Text>
          <Text style={tw`text-gray-300 mt-1`}>{user?.email || "No email"}</Text>
        </View>

        {settingsItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => router.push(item.route as any)}
            style={[tw`bg-[#101C45] rounded-2xl border border-[#1C2A60]`, styles.settingsItem]}
          >
            <View style={tw`flex-row items-center`}>
              <View style={[tw`w-10 h-10 rounded-full bg-[#0FF1CF]/15 items-center justify-center`, styles.settingsIcon]}>
                <Ionicons name={item.icon} color="#0FF1CF" size={20} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-white font-semibold text-base`}>{item.label}</Text>
                <Text style={tw`text-gray-400 text-xs mt-1`}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" color="#8FA5E2" size={18} />
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={confirmLogout}
          style={[tw`bg-[#351238] rounded-2xl border border-[#6B2A70]`, styles.logoutButton]}
        >
          <View style={tw`flex-row items-center justify-center`}>
            <Ionicons name="log-out-outline" color="#FF6B9D" size={18} />
            <Text style={tw`text-[#FF6B9D] font-semibold ml-2`}>Logout</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Settings;

const styles = StyleSheet.create({
  screen: {
    paddingTop: layoutSpacing.pageTop,
    paddingHorizontal: layoutSpacing.pageHorizontal,
  },
  content: {
    marginTop: spacing.xl,
  },
  accountCard: {
    padding: layoutSpacing.cardPadding,
    marginBottom: spacing.md,
  },
  settingsItem: {
    padding: layoutSpacing.cardPadding,
    marginBottom: spacing.sm,
  },
  settingsIcon: {
    marginRight: spacing.md,
  },
  logoutButton: {
    marginTop: spacing.md,
    padding: layoutSpacing.cardPadding,
  },
});
