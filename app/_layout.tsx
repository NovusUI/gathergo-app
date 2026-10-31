import { AuthProvider, useAuth } from "@/context/AuthContext";
import RootNavigator from "@/navigators/RootNavigators";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppearanceStore } from "@/store/appearance";
import { useAuthStore } from "@/store/auth";
import { useOnboardingStore } from "@/store/onboarding";
import { applyUrbanistFontDefaults, URBANIST_FONT_ASSETS } from "@/utils/fonts";
import { useFonts } from "expo-font";
import { useNavigationContainerRef } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { Appearance, Platform, StatusBar, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";

// keep splash visible until we manually hide it
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { colors } = useAppTheme();
  const { hasHydrated: appearanceHydrated, hydrate: hydrateAppearance } = useAppearanceStore();
  const { loading } = useAuth();
  const { hasHydrated } = useAuthStore();
  const { hasHydrated: onboardingHydrated, hydrate } = useOnboardingStore();
  const navigation = useNavigationContainerRef();
  const [laidOut, setLaidOut] = useState(false);
  const [splashHidden, setSplashHidden] = useState(false);
  const handleLayout = useCallback(() => setLaidOut(true), []);

  useEffect(() => {
    void hydrate();
    void hydrateAppearance();
  }, [hydrate, hydrateAppearance]);

  useEffect(() => {
    if (!laidOut || splashHidden) return;
    let frame: number | undefined;

    const hideWhenScreenReady = () => {
      if (frame !== undefined) {
        cancelAnimationFrame(frame);
        frame = undefined;
      }
      if (!navigation.isReady()) return;
      const route = navigation.getCurrentRoute();
      // Route groups can be focused while an authentication redirect is pending.
      if (!route || route.name.startsWith("(")) return;

      frame = requestAnimationFrame(() => {
        setSplashHidden(true);
        void SplashScreen.hideAsync();
      });
    };
    const removeReadyListener = navigation.addListener("ready", hideWhenScreenReady);
    const removeStateListener = navigation.addListener("state", hideWhenScreenReady);
    hideWhenScreenReady();

    return () => {
      removeReadyListener();
      removeStateListener();
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [laidOut, navigation, splashHidden]);

  if (loading || !hasHydrated || !onboardingHydrated || !appearanceHydrated) return null;

  return (
    <View
      onLayout={handleLayout}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <RootNavigator />
    </View>
  );
}

export default function RootLayout() {
  const { colors, mode } = useAppTheme();
  const appearancePreference = useAppearanceStore((state) => state.mode);
  useEffect(() => {
    if (Platform.OS !== "web") {
      Appearance.setColorScheme(appearancePreference === "system" ? null : appearancePreference);
    }
  }, [appearancePreference]);
  const [fontsLoaded, fontError] = useFonts(URBANIST_FONT_ASSETS);
  const fontsReady = fontsLoaded || Boolean(fontError);

  if (fontsLoaded) {
    applyUrbanistFontDefaults();
  }

  if (!fontsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <StatusBar barStyle={mode === "light" ? "dark-content" : "light-content"} backgroundColor={colors.background} />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
