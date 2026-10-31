import AppToast from "@/components/ui/AppToast";
import {
  createSessionQueryCache,
  registerSessionQueryCache,
} from "@/services/sessionQueryCache";
import { useAuthStore } from "@/store/auth";
import { authSessionUserId } from "@/utils/authSession";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useEffect, useState, type ReactNode } from "react";
import { PaystackProvider } from "react-native-paystack-webview";
import { ConversationProvider } from "./ConversationContext";
import { NotificationProvider } from "./NotificationContext";
import { PushNotificationProvider } from "./PushNotificationContext";
import { SocketProvider } from "./SocketContext";

function SessionScope({
  userId,
  children,
}: {
  userId: string | null;
  children: ReactNode;
}) {
  const [cache] = useState(() => createSessionQueryCache(userId));
  useEffect(() => registerSessionQueryCache(cache), [cache]);
  return (
    <PersistQueryClientProvider
      client={cache.queryClient}
      persistOptions={{ persister: cache.persister }}
    >
      <PushNotificationProvider>
        <SocketProvider>
          <NotificationProvider>
            <ConversationProvider>
              <PaystackProvider
                debug
                publicKey="pk_test_430fb933c2b87c6f0f6a29b40b97d2d1caf60fbe"
                defaultChannels={["bank", "bank_transfer", "card", "ussd"]}
              >
                <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
                <AppToast />
              </PaystackProvider>
            </ConversationProvider>
          </NotificationProvider>
        </SocketProvider>
      </PushNotificationProvider>
    </PersistQueryClientProvider>
  );
}

export default function SessionProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated, sessionVersion } = useAuthStore();
  const userId = authSessionUserId(isAuthenticated ? token : null);
  return (
    <SessionScope key={`${userId}:${sessionVersion}`} userId={userId}>
      {children}
    </SessionScope>
  );
}
