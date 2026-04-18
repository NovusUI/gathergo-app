import { useAuth } from "@/context/AuthContext";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useAuthStore } from "@/store/auth";
import { Stack } from "expo-router";

export default function RootNavigator() {
  const { loading } = useAuth();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  if (loading || !hasHydrated) {
    return <FullScreenLoader />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#01082E" },
        animation: "fade",
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
