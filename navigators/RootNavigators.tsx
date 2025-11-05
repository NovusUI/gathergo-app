import { useAuth } from "@/context/AuthContext";
import { useAuthStore } from "@/store/auth";
import { Stack } from "expo-router";

export default function RootNavigator() {
  const { loading } = useAuth();
  const { isAuthenticated } = useAuthStore();

  if (loading) return null; // splash screen can go here

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="(app)" />
      ) : (
        <Stack.Screen name="(auth)" />
      )}
    </Stack>
  );
}
