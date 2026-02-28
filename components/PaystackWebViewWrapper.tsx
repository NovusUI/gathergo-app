// Create a new file: components/PaystackWebViewWrapper.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import WebView from "react-native-webview";
import tw from "twrnc";

interface PaystackWebViewProps {
  visible: boolean;
  onClose: () => void;
  paymentUrl: string;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
  onError: (error: any) => void;
  type: "REGISTRATION" | "DONATION" | "TICKET";
}

export const PaystackWebViewWrapper: React.FC<PaystackWebViewProps> = ({
  visible,
  onClose,
  paymentUrl,
  onSuccess,
  onCancel,
  onError,
  type,
}) => {
  const webViewRef = useRef<WebView>(null);
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    // Reset navigation flag when modal opens
    if (visible) {
      hasNavigatedRef.current = false;
    }
  }, [visible]);

  const handleNavigationStateChange = (navState: any) => {
    console.log("WebView URL:", navState.url);

    // Check for Paystack success/cancel URLs
    if (navState.url.includes("callback") || navState.url.includes("verify")) {
      // Extract reference from URL
      const urlParams = new URL(navState.url);
      const reference =
        urlParams.searchParams.get("reference") ||
        urlParams.searchParams.get("trxref");

      if (reference && !hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        onSuccess(reference);
        onClose();
      }
    }

    // Check for cancel
    if (
      navState.url.includes("cancel") ||
      navState.title?.includes("Cancelled")
    ) {
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        onCancel();
        onClose();
      }
    }

    // Check for errors
    if (navState.url.includes("error") || navState.title?.includes("Error")) {
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        onError({ message: "Payment error occurred" });
        onClose();
      }
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={tw`flex-1 bg-[#01082E]`}>
        {/* Header */}
        <View
          style={tw`flex-row items-center justify-between p-4 border-b border-gray-700`}
        >
          <Text style={tw`text-white text-lg font-semibold`}>
            {type === "DONATION" ? " Complete Donation" : "Complete Payment"}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* WebView */}
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          style={tw`flex-1`}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("WebView error:", nativeEvent);
            if (!hasNavigatedRef.current) {
              hasNavigatedRef.current = true;
              onError(nativeEvent);
              onClose();
            }
          }}
        />
      </View>
    </Modal>
  );
};
