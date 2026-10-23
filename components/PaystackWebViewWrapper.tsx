import { useAppTheme } from "@/hooks/useAppTheme";
import AppLoader from "@/components/ui/AppLoader";
import { CheckoutCountdown } from "@/components/ui/CheckoutCountdown";
import AppToast from "@/components/ui/AppToast";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import WebView, { type WebViewNavigation } from "react-native-webview";

interface PaystackWebViewProps {
  visible: boolean;
  checkoutDeadlineMs?: number | null;
  onClose: () => void;
  paymentUrl: string;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
  onError: (error: any) => void;
  type: "REGISTRATION" | "DONATION" | "TICKET";
}

export const PaystackWebViewWrapper: React.FC<PaystackWebViewProps> = ({
  visible,
  checkoutDeadlineMs = null,
  onClose,
  paymentUrl,
  onSuccess,
  onCancel,
  onError,
  type,
}) => {
  const { tw, color } = useAppTheme();
  const webViewRef = useRef<WebView>(null);
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    // Reset navigation flag when modal opens
    if (visible) {
      hasNavigatedRef.current = false;
    }
  }, [visible]);

  const finishPayment = (callback: () => void) => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    callback();
    onClose();
  };

  const handleCancel = () => finishPayment(onCancel);

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    if (navState.url.includes("callback") || navState.url.includes("verify")) {
      const urlParams = new URL(navState.url);
      const reference =
        urlParams.searchParams.get("reference") ||
        urlParams.searchParams.get("trxref");
      if (reference) {
        finishPayment(() => onSuccess(reference));
        return;
      }
    }

    if (navState.url.includes("cancel") || navState.title.includes("Cancelled")) {
      handleCancel();
      return;
    }

    if (navState.url.includes("error") || navState.title.includes("Error")) {
      finishPayment(() => onError({ message: "Payment error occurred" }));
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={tw`flex-1 bg-background dark:bg-[#01082E]`}>
        {/* Header */}
        <View
          style={tw`flex-row items-center justify-between p-4 border-b border-border dark:border-gray-700`}
        >
          <Text style={tw`text-foreground dark:text-white text-lg font-semibold`}>
            {type === "DONATION" ? " Complete Donation" : "Complete Payment"}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Cancel payment"
            onPress={handleCancel}
          >
            <Ionicons name="close" size={24} color={color("white", "foreground")} />
          </TouchableOpacity>
        </View>

        <CheckoutCountdown deadlineMs={checkoutDeadlineMs} />
        {/* WebView */}
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          style={tw`flex-1`}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState={true}
          renderLoading={() => (
            <AppLoader
              size="large"
              tone="dark"
              accessibilityLabel="Loading checkout"
              style={tw`absolute inset-0 bg-surface dark:bg-white`}
            />
          )}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("WebView error:", nativeEvent);
            finishPayment(() => onError(nativeEvent));
          }}
        />
      </View>
      <AppToast />
    </Modal>
  );
};
