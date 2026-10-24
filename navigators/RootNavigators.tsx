import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/context/AuthContext";
import AppLaunchScreen from "@/components/ui/AppLaunchScreen";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useAuthStore } from "@/store/auth";
import { authenticatedStartRoute } from "@/utils/authRouting";
import { Stack, usePathname } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

export default function RootNavigator() {
  const { color } = useAppTheme();
  const { user, loading } = useAuth();
  const { isAuthenticated, hasHydrated, googleAuthPhase, setGoogleAuthPhase } =
    useAuthStore();
  const pathname = usePathname();
  const completingGoogleSignIn = googleAuthPhase !== "idle";
  const destination = authenticatedStartRoute(user);

  useEffect(() => {
    if (
      !completingGoogleSignIn ||
      loading ||
      !hasHydrated ||
      !isAuthenticated ||
      !user ||
      pathname !== destination
    )
      return;
    // Keep the browser-return handoff covered until the destination has rendered.
    const frame = requestAnimationFrame(() => setGoogleAuthPhase("idle"));
    return () => cancelAnimationFrame(frame);
  }, [
    completingGoogleSignIn,
    destination,
    hasHydrated,
    isAuthenticated,
    loading,
    pathname,
    setGoogleAuthPhase,
    user,
  ]);

  if (loading || !hasHydrated) {
    return <AppLaunchScreen />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: color("#01082E", "background") }}>
      <View
        style={{ flex: 1 }}
        accessibilityElementsHidden={completingGoogleSignIn}
        importantForAccessibility={
          completingGoogleSignIn ? "no-hide-descendants" : "auto"
        }
      >
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
      </View>
      {completingGoogleSignIn ? (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { zIndex: 1, backgroundColor: color("#01082E", "background") },
          ]}
        >
          <FullScreenLoader
            title={
              googleAuthPhase === "opening"
                ? "Connecting to Google"
                : "Logging you in"
            }
            message={
              googleAuthPhase === "opening"
                ? "Finish choosing your account and we will bring you right back."
                : "Please hold on while we finish your GatherGo sign-in."
            }
          />
        </View>
      ) : null}
    </View>
  );
}
