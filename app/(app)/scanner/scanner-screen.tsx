import type { ThemeColor } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import ActivityIndicator from "@/components/ui/AppLoader";
import { useQuickScan, useScan } from "@/services/mutations";
import type { QuickScanResponse } from "@/types/scanner";
import { buildShareTargetRoute, resolveScannedLink } from "@/utils/shareLinks";
import { getApiErrorMessage } from "@/utils/apiError";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { safeGoBack } from "@/utils/navigation";
import {
  CameraType,
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import { Flashlight, FlashlightOff, RotateCw, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import ScanResultModal from "./scan-result";

const ScannerScreen = () => {
  const { tw, color } = useAppTheme();
  const styles = createStyles(color);
  // Camera callbacks can arrive during the home navigation cooldown.
  // The scan guard already prevents duplicate navigation.
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flash, setFlash] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>("back");
  const [scanResult, setScanResult] = useState<
    QuickScanResponse["data"] | null
  >(null);
  const processing = useRef(false);
  const isFocused = useIsFocused();
  const [showResultModal, setShowResultModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { mutateAsync: quickScan } = useQuickScan();
  const { mutateAsync: scan } = useScan();

  useEffect(() => {
    if (permission === null) void requestPermission();
  }, [permission, requestPermission]);

  useEffect(() => {
    if (isFocused) {
      setScanned(false);
      processing.current = false;
    }
  }, [isFocused]);

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanned || processing.current) return;
    processing.current = true;
    setScanned(true);
    const destination = resolveScannedLink(data);
    if (destination) {
      router.push(
        destination.kind === "short"
          ? `/s/${destination.code}`
          : buildShareTargetRoute(destination.kind, destination.id),
      );
      return;
    }
    setIsProcessing(true);
    try {
      const result = await quickScan(data);
      setScanResult(result.data);
      setShowResultModal(true);
    } catch (error) {
      Alert.alert(
        "Scan error",
        getApiErrorMessage(error, "Failed to scan QR code"),
        [{ text: "OK", onPress: () => setScanned(false) }],
      );
    } finally {
      setIsProcessing(false);
      processing.current = false;
    }
  };

  const handleMarkAsUsed = async () => {
    if (!scanResult || processing.current) return;
    processing.current = true;
    setIsProcessing(true);
    try {
      const result = await scan({
        qrCode: scanResult.qrCode,
        markAsUsed: true,
      });
      if (!result.data.success) {
        Alert.alert("Collection not recorded", result.data.message);
        return;
      }
      Alert.alert("Confirmed", result.data.message);
      setShowResultModal(false);
      setScanned(false);
      setScanResult(null);
    } catch (error) {
      Alert.alert(
        "Scan error",
        getApiErrorMessage(error, "Failed to record collection"),
      );
    } finally {
      processing.current = false;
      setIsProcessing(false);
    }
  };

  const toggleFlash = () => setFlash(!flash);
  const toggleCameraType = () => {
    setCameraType((current) => (current === "back" ? "front" : "back"));
  };

  const resetScanner = () => {
    setScanned(false);
    setScanResult(null);
    setShowResultModal(false);
  };

  if (!permission) {
    return (
      <View style={tw`flex-1 bg-black items-center justify-center`}>
        <Text style={tw`text-white text-lg`}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={tw`flex-1 bg-black items-center justify-center p-5`}>
        <Text
          style={tw`text-white text-lg text-center mb-4`}
        >
          Camera permission is required to scan QR codes
        </Text>
        <TouchableOpacity
          style={tw`bg-primary dark:bg-[#5669FF] px-6 py-3 rounded-full`}
          onPress={requestPermission}
        >
          <Text style={tw`text-onPrimary dark:text-white font-semibold`}>
            Grant Permission
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Close scanner"
          onPress={() => safeGoBack(router, "/")}
          style={tw`p-4 mt-3`}
        >
          <Text style={tw`text-white`}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-black`}>
      {/* Camera View */}
      {isFocused ? (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing={cameraType}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          enableTorch={flash}
        />
      ) : null}

      {/* Overlay */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Top Bar */}
        <View style={tw`pt-10 px-5 flex-row justify-between items-center`}>
          <TouchableOpacity
            style={tw`w-10 h-10 rounded-full bg-black/50 items-center justify-center`}
            accessibilityRole="button"
            accessibilityLabel="Close scanner"
            onPress={() => safeGoBack(router, "/")}
          >
            <X size={24} color={"#FFFFFF"} />
          </TouchableOpacity>

          <Text
            style={tw`text-white text-lg font-semibold`}
          >
            Scan a QR code
          </Text>

          <View style={tw`w-10`} />
        </View>

        {/* Scan Frame */}
        <View style={tw`flex-1 items-center justify-center`}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text
            style={tw`text-white text-center mt-6 text-lg font-medium`}
          >
            Align QR code within frame
          </Text>
          {isProcessing && (
            <View style={tw`mt-4`}>
              <ActivityIndicator tone="accent" size="large" />
              <Text
                style={tw`text-white text-center mt-2`}
              >
                Processing...
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Controls */}
        <View style={tw`pb-10 px-5 flex-row justify-center items-center`}>
          <TouchableOpacity
            style={tw`w-14 h-14 rounded-full bg-black/50 items-center justify-center mx-4`}
            accessibilityRole="button"
            accessibilityLabel={flash ? "Turn flash off" : "Turn flash on"}
            onPress={toggleFlash}
          >
            {flash ? (
              <FlashlightOff size={28} color={"#FFFFFF"} />
            ) : (
              <Flashlight size={28} color={"#FFFFFF"} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`w-20 h-20 rounded-full border-4 border-borderStrong/30 dark:border-white/30 items-center justify-center`}
            accessibilityRole="button"
            accessibilityLabel="Scan another code"
            onPress={resetScanner}
            disabled={isProcessing}
          >
            <View
              style={tw`w-16 h-16 rounded-full bg-surface/10 dark:bg-white/10 items-center justify-center`}
            >
              {!isProcessing && (
                <Text
                  style={tw`text-white text-sm font-bold`}
                >
                  SCAN
                </Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`w-14 h-14 rounded-full bg-black/50 items-center justify-center mx-4`}
            accessibilityRole="button"
            accessibilityLabel="Switch camera"
            onPress={toggleCameraType}
          >
            <RotateCw size={28} color={"#FFFFFF"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scan Result Modal */}
      <ScanResultModal
        visible={showResultModal}
        result={scanResult}
        onClose={() => {
          setShowResultModal(false);
          setScanned(false);
        }}
        onMarkAsUsed={handleMarkAsUsed}
        isProcessing={isProcessing}
      />
    </View>
  );
};

const createStyles = (color: ThemeColor) =>
  StyleSheet.create({
    scanFrame: {
      width: 250,
      height: 250,
      position: "relative",
    },
    corner: {
      position: "absolute",
      width: 30,
      height: 30,
      borderColor: color("#5669FF", "primary"),
    },
    topLeft: {
      top: 0,
      left: 0,
      borderTopWidth: 4,
      borderLeftWidth: 4,
      borderTopLeftRadius: 8,
    },
    topRight: {
      top: 0,
      right: 0,
      borderTopWidth: 4,
      borderRightWidth: 4,
      borderTopRightRadius: 8,
    },
    bottomLeft: {
      bottom: 0,
      left: 0,
      borderBottomWidth: 4,
      borderLeftWidth: 4,
      borderBottomLeftRadius: 8,
    },
    bottomRight: {
      bottom: 0,
      right: 0,
      borderBottomWidth: 4,
      borderRightWidth: 4,
      borderBottomRightRadius: 8,
    },
  });

export default ScannerScreen;
