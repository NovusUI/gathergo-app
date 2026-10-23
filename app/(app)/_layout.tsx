import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/context/AuthContext";
import AppLaunchScreen from "@/components/ui/AppLaunchScreen";
import { useAuthStore } from "@/store/auth";
import { Redirect, Stack, useSegments } from "expo-router";

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

  //skip redirect if alreadfy on profile-setup

  const isOnProfileSetup = segments.includes("profile-setup");

  if (!user?.isProfileComplete && !isOnProfileSetup) {
    return <Redirect href={"/profile-setup"} />;
  }

  // Skip redirect if already on /preference
  const isOnPreference = segments.includes("preference");
  if (user?.isProfileComplete && !user?.hasPreferences && !isOnPreference) {
    return <Redirect href="/preference" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: color("#01082E", "background") },
        animation: "fade",
      }}
    />
  );
}
