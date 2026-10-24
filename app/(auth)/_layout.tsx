import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/context/AuthContext";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useAuthStore } from "@/store/auth";
import { authenticatedStartRoute } from "@/utils/authRouting";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  const { color } = useAppTheme();
  const { user, loading } = useAuth();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  if (loading || !hasHydrated) {
    return <FullScreenLoader />;
  }

  if (isAuthenticated) {
    return <Redirect href={authenticatedStartRoute(user)} />;
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
