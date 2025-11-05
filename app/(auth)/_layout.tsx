import { useAuth } from "@/context/AuthContext";
import { useAuthStore } from "@/store/auth";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  const { loading } = useAuth();
  const { isAuthenticated } = useAuthStore();

  if (loading) return null; // splash handling

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
