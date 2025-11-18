import { useAuth } from "@/context/AuthContext";
import { useAuthStore } from "@/store/auth";
import { Redirect, Stack, useSegments } from "expo-router";

export default function AppLayout() {
  const { user, loading } = useAuth();
  const { isAuthenticated } = useAuthStore();
  const segments = useSegments();

  if (loading) return null; // splash handling

  if (!isAuthenticated) {
    return <Redirect href="/onboarding" />;
  }

  // Skip redirect if already on /preference
  const isOnPreference = segments.includes("preference");
  if (!user?.hasPreferences && !isOnPreference) {
    return <Redirect href="/preference" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
