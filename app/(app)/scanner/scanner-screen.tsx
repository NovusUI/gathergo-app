import { useScanner } from "@/hooks/useScanner";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { Flashlight, FlashlightOff, RotateCw, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";
import ScanResultModal from "./scan-result";

const ScannerScreen = () => {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flash, setFlash] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>("back");
  const [scanResult, setScanResult] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { quickScan, scan } = useScanner();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ type, data }: any) => {
    if (scanned || isProcessing) return;

    setScanned(true);
    setIsProcessing(true);

    try {
      // Quick validation first
      const result = await quickScan(data);
      setScanResult(result);
      setShowResultModal(true);
    } catch (error: any) {
      Alert.alert("Scan Error", error.message || "Failed to scan QR code", [
        { text: "OK", onPress: () => setScanned(false) },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsUsed = async () => {
    if (!scanResult) return;

    console.log(scanResult, "scan resuklt");
    setIsProcessing(true);
    try {
      const result = await scan(scanResult.qrCode, true);
      Alert.alert("Success", "Successfully marked as used!");
      setShowResultModal(false);
      setScanned(false);
      setScanResult(null);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to mark as used");
    } finally {
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
        <Text style={tw`text-white text-lg text-center mb-4`}>
          Camera permission is required to scan QR codes
        </Text>
        <TouchableOpacity
          style={tw`bg-[#5669FF] px-6 py-3 rounded-full`}
          onPress={requestPermission}
        >
          <Text style={tw`text-white font-semibold`}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-black`}>
      {/* Camera View */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={cameraType}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        enableTorch={flash}
      />

      {/* Overlay */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Top Bar */}
        <View style={tw`pt-10 px-5 flex-row justify-between items-center`}>
          <TouchableOpacity
            style={tw`w-10 h-10 rounded-full bg-black/50 items-center justify-center`}
            onPress={() => router.back()}
          >
            <X size={24} color="white" />
          </TouchableOpacity>

          <Text style={tw`text-white text-lg font-semibold`}>
            QR Code Scanner
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
          <Text style={tw`text-white text-center mt-6 text-lg font-medium`}>
            Align QR code within frame
          </Text>
          {isProcessing && (
            <View style={tw`mt-4`}>
              <ActivityIndicator size="large" color="#5669FF" />
              <Text style={tw`text-white text-center mt-2`}>Processing...</Text>
            </View>
          )}
        </View>

        {/* Bottom Controls */}
        <View style={tw`pb-10 px-5 flex-row justify-center items-center`}>
          <TouchableOpacity
            style={tw`w-14 h-14 rounded-full bg-black/50 items-center justify-center mx-4`}
            onPress={toggleFlash}
          >
            {flash ? (
              <FlashlightOff size={28} color="white" />
            ) : (
              <Flashlight size={28} color="white" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`w-20 h-20 rounded-full border-4 border-white/30 items-center justify-center`}
            onPress={resetScanner}
            disabled={isProcessing}
          >
            <View
              style={tw`w-16 h-16 rounded-full bg-white/10 items-center justify-center`}
            >
              {!isProcessing && (
                <Text style={tw`text-white text-sm font-bold`}>SCAN</Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`w-14 h-14 rounded-full bg-black/50 items-center justify-center mx-4`}
            onPress={toggleCameraType}
          >
            <RotateCw size={28} color="white" />
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

const styles = StyleSheet.create({
  scanFrame: {
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#5669FF",
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
