import { useAuth } from "@/context/AuthContext";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useAuthStore } from "@/store/auth";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  const { loading } = useAuth();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  if (loading || !hasHydrated) {
    return <FullScreenLoader />;
  }

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#01082E" },
        animation: "fade",
      }}
    />
  );
}
