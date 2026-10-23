import { useAppTheme } from "@/hooks/useAppTheme";
import AppearancePreference from "@/components/AppearancePreference";
import SheetCloseButton from "@/components/buttons/SheetCloseButton";
import AppLoader from "@/components/ui/AppLoader";
import { MascotMoment } from "@/components/gogo/mascot/MascotMoment";
import { usePressGuard } from "@/hooks/usePressGuard";
import { showGlobalError } from "@/utils/globalErrorHandler";
import { useState } from "react";
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
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const settingsItems = [
  {
    label: "Tune my map",
    route: "/preference",
    icon: "compass-outline" as const,
  },
  {
    label: "My Volunteering",
    route: "/my-volunteering",
    icon: "people-outline" as const,
  },
  {
    label: "My Passes",
    route: "/my-passes",
    icon: "ticket-outline" as const,
  },
  {
    label: "Dashboard",
    route: "/dashboard",
    icon: "bar-chart-outline" as const,
  },
  {
    label: "Scanner",
    route: "/scanner",
    icon: "scan-outline" as const,
  },
  {
    label: "Wallet",
    route: "/wallet",
    icon: "wallet" as const,
  },
];

const Settings = () => {
  const { tw, color } = useAppTheme();
  const { user, setUser } = useAuth();
  const { expoPushToken } = usePushNotification();
  const router = useLockedRouter();
  const { mutateAsync: removePushToken } = useRemovePushToken();
  const [showLogout, setShowLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const closeLogout = () => {
    if (!isLoggingOut) setShowLogout(false);
  };

  const confirmLogout = usePressGuard(async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      showGlobalError("Unable to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  });

  return (
    <View style={[tw`flex-1 bg-background dark:bg-[#01082E]`, styles.screen]}>
      <CustomeTopBarNav
        title="settings"
        onClickBack={() => safeGoBack(router, "/")}
      />

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={[
          tw`w-full max-w-[500px] self-center`,
          styles.content,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            tw`bg-surface dark:bg-[#122255] rounded-2xl border border-border dark:border-[#203370]`,
            styles.accountCard,
          ]}
        >
          <Text style={tw`text-foreground dark:text-white text-lg font-bold`}>
            {user?.name || "Account"}
          </Text>
          <Text style={tw`text-secondary dark:text-gray-300 mt-1`}>
            {user?.email || "No email"}
          </Text>
        </View>

        <AppearancePreference />

        {settingsItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => router.push(item.route as any)}
            style={[
              tw`bg-surface dark:bg-[#101C45] rounded-2xl border border-border dark:border-[#1C2A60]`,
              styles.settingsItem,
            ]}
          >
            <View style={tw`flex-row items-center`}>
              <View
                style={[
                  tw`w-10 h-10 rounded-full bg-accentFill/15 dark:bg-[#0FF1CF]/15 items-center justify-center`,
                  styles.settingsIcon,
                ]}
              >
                <Ionicons name={item.icon} color={color("#0FF1CF", "accent")} size={20} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-foreground dark:text-white font-semibold text-base`}>
                  {item.label}
                </Text>
              </View>
              <Ionicons name="chevron-forward" color={color("#8FA5E2", "secondary")} size={18} />
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={() => setShowLogout(true)}
          style={[
            tw`bg-dangerSoft dark:bg-[#351238] rounded-2xl border border-[#6B2A70]`,
            styles.logoutButton,
          ]}
        >
          <View style={tw`flex-row items-center justify-center`}>
            <Ionicons name="log-out-outline" color={color("#FF6B9D", "danger")} size={18} />
            <Text style={tw`text-danger dark:text-[#FF6B9D] font-semibold ml-2`}>Logout</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showLogout}
        transparent
        animationType="fade"
        onRequestClose={closeLogout}
      >
        <View
          style={tw`flex-1 items-center justify-center bg-black/75 px-5 py-10`}
        >
          <Pressable
            accessible={false}
            style={StyleSheet.absoluteFillObject}
            onPress={closeLogout}
          />
          <View
            accessibilityViewIsModal
            style={tw`w-full max-w-[430px] max-h-[90%] rounded-[28px] border border-border dark:border-[#24345A] bg-surface dark:bg-[#07143B]`}
          >
            <ScrollView contentContainerStyle={tw`px-5 pb-5`}>
              <View style={tw`items-end pt-2`}>
                <SheetCloseButton
                  onPress={closeLogout}
                  disabled={isLoggingOut}
                  accessibilityLabel="Cancel logout"
                />
              </View>
              <MascotMoment
                layout="stacked"
                compact
                title="Heading out?"
                message="Log out of GatherGo? I'll be here when you're ready to come back."
                typing={false}
              />
              <View style={tw`flex-row gap-3 mt-2`}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isLoggingOut }}
                  disabled={isLoggingOut}
                  onPress={closeLogout}
                  style={tw`flex-1 min-h-12 items-center justify-center rounded-2xl bg-surfaceMuted dark:bg-[#1B2A50] px-4 py-3`}
                >
                  <Text style={tw`font-semibold text-foreground dark:text-white`}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Confirm logout"
                  accessibilityState={{
                    disabled: isLoggingOut,
                    busy: isLoggingOut,
                  }}
                  disabled={isLoggingOut}
                  onPress={confirmLogout}
                  style={tw`flex-1 min-h-12 flex-row gap-2 items-center justify-center rounded-2xl bg-danger dark:bg-[#FF6B9D] px-4 py-3`}
                >
                  {isLoggingOut ? <AppLoader tone="dark" /> : null}
                  <Text style={tw`font-semibold text-onAccent dark:text-[#01082E]`}>
                    {isLoggingOut ? "Logging out…" : "Logout"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingTop: spacing.xl,
    paddingBottom: layoutSpacing.listBottomInset,
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
