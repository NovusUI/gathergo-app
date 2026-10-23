import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/context/AuthContext";
import AppLaunchScreen from "@/components/ui/AppLaunchScreen";
import { useAuthStore } from "@/store/auth";
import { Stack } from "expo-router";

export default function RootNavigator() {
  const { color } = useAppTheme();
  const { loading } = useAuth();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  if (loading || !hasHydrated) {
    return <AppLaunchScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: color("#01082E", "background") },
        animation: "none",
      }}
    >
      {isAuthenticated ? (
        <Stack.Screen name="(app)" />
      ) : (
        <Stack.Screen name="(auth)" />
      )}
    </Stack>
  );
}
