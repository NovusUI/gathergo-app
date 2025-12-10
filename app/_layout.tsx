import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ConversationProvider } from "@/context/ConversationContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { PushNotificationProvider } from "@/context/PushNotificationContext";
import { SocketProvider } from "@/context/SocketContext";
import RootNavigator from "@/navigators/RootNavigators";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaystackProvider } from "react-native-paystack-webview";
import Toast, { BaseToast } from "react-native-toast-message";
import "../global.css";

// keep splash visible until we manually hide it
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return null;
  }

  return (
    <BottomSheetModalProvider>
      <RootNavigator />
    </BottomSheetModalProvider>
  );
}
export const toastConfig = {
  warn: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "#FFA500" }}
      text1Style={{ fontSize: 16, fontWeight: "bold" }}
    />
  ),
};

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const [persister] = useState(() =>
    createAsyncStoragePersister({
      storage: AsyncStorage,
    })
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
                    <Toast config={toastConfig} />
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
