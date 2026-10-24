import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/context/AuthContext";
import AppLaunchScreen from "@/components/ui/AppLaunchScreen";
import { useAuthStore } from "@/store/auth";
import { authenticatedStartRoute } from "@/utils/authRouting";
import { Redirect, Stack, useSegments } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AppLayout() {
  const { color } = useAppTheme();
  const { user, loading } = useAuth();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const segments = useSegments();

  if (loading || !hasHydrated) {
    return <AppLaunchScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/onboarding" />;
  }

  const destination = authenticatedStartRoute(user);
  const isOnProfileSetup = segments.some(segment => segment === "profile-setup");
  const isOnPreference = segments.some(segment => segment === "preference");
  if (destination === "/profile-setup" && !isOnProfileSetup) {
    return <Redirect href={destination} />;
  }
  if (destination === "/preference" && !isOnPreference) {
    return <Redirect href={destination} />;
  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1, backgroundColor: color("#01082E", "background") }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color("#01082E", "background") },
          animation: "fade",
        }}
      />
    </SafeAreaView>
  );
}
