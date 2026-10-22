import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ConversationProvider } from "@/context/ConversationContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { PushNotificationProvider } from "@/context/PushNotificationContext";
import { SocketProvider } from "@/context/SocketContext";
import RootNavigator from "@/navigators/RootNavigators";
import AppToast from "@/components/ui/AppToast";
import { useAuthStore } from "@/store/auth";
import { useOnboardingStore } from "@/store/onboarding";
import { applyUrbanistFontDefaults, URBANIST_FONT_ASSETS } from "@/utils/fonts";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFonts } from "expo-font";
import { useNavigationContainerRef } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaystackProvider } from "react-native-paystack-webview";
import "../global.css";

// keep splash visible until we manually hide it
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { loading } = useAuth();
  const { hasHydrated } = useAuthStore();
  const { hasHydrated: onboardingHydrated, hydrate } = useOnboardingStore();
  const navigation = useNavigationContainerRef();
  const [laidOut, setLaidOut] = useState(false);
  const handleLayout = useCallback(() => setLaidOut(true), []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!laidOut) return;
    const hideNativeSplash = () => {
      void SplashScreen.hideAsync();
    };
    if (navigation.isReady()) {
      hideNativeSplash();
      return;
    }
    return navigation.addListener("ready", hideNativeSplash);
  }, [laidOut, navigation]);

  if (loading || !hasHydrated || !onboardingHydrated) return null;

  return (
    <BottomSheetModalProvider>
      <View
        onLayout={handleLayout}
        style={{ flex: 1, backgroundColor: "#01082E" }}
      >
        <RootNavigator />
      </View>
    </BottomSheetModalProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(URBANIST_FONT_ASSETS);
  const [queryClient] = useState(() => new QueryClient());
  const [persister] = useState(() =>
    createAsyncStoragePersister({
      storage: AsyncStorage,
    }),
  );
  const fontsReady = fontsLoaded || Boolean(fontError);

  if (fontsLoaded) {
    applyUrbanistFontDefaults();
  }

  if (!fontsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#01082E" }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <AuthProvider>
          <PushNotificationProvider>
            <SocketProvider>
              <NotificationProvider>
                <ConversationProvider>
                  <PaystackProvider
                    debug
                    publicKey="pk_test_430fb933c2b87c6f0f6a29b40b97d2d1caf60fbe"
                    defaultChannels={["bank", "bank_transfer", "card", "ussd"]}
                  >
                    <AppContent />
                    <AppToast />
                  </PaystackProvider>
                </ConversationProvider>
              </NotificationProvider>
            </SocketProvider>
          </PushNotificationProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
