import { usePressGuard } from "@/hooks/usePressGuard";
import { pushWithLock } from "@/utils/navigation";
import { useLockedRouter } from "@/utils/navigation";
import { useRouter } from "expo-router";
import { ArrowRight, QrCode, Shield, Zap } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

interface QuickScanCardProps {
  onPress?: () => void;
  compact?: boolean;
}

const QuickScanCard: React.FC<QuickScanCardProps> = ({
  onPress,
  compact = false,
}) => {
  const router = useLockedRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      pushWithLock(router, "/scanner/scanner-screen");
    }
  };
  const guardedPress = usePressGuard(handlePress);

  // Compact version for dashboard
  if (compact) {
    return (
      <TouchableOpacity
        style={tw`bg-gradient-to-r from-[#5669FF] to-[#9D4EDD] rounded-xl p-4`}
        onPress={guardedPress}
        activeOpacity={0.9}
      >
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center`}>
            <View style={tw`bg-white/20 p-2 rounded-full mr-3`}>
              <QrCode size={20} color="white" />
            </View>
            <View>
              <Text style={tw`text-white font-bold`}>Quick Scan</Text>
              <Text style={tw`text-white/80 text-xs`}>Scan tickets</Text>
            </View>
          </View>
          <Zap size={20} color="white" />
        </View>
      </TouchableOpacity>
    );
  }

  // Full version
  return (
    <TouchableOpacity
      style={tw`bg-gradient-to-r from-[#5669FF] to-[#9D4EDD] rounded-2xl p-5`}
      onPress={guardedPress}
      activeOpacity={0.9}
    >
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <View style={tw`flex-row items-center`}>
          <View style={tw`bg-white/20 p-3 rounded-full mr-4`}>
            <QrCode size={24} color="white" />
          </View>
          <View>
            <Text style={tw`text-white text-xl font-bold`}>Quick Scan</Text>
            <Text style={tw`text-white/80 text-sm`}>
              Scan tickets and registrations
            </Text>
          </View>
        </View>
        <Zap size={24} color="white" />
      </View>

      <View style={tw`flex-row items-center justify-between`}>
        <View style={tw`flex-row items-center`}>
          <Shield size={16} color="white" />
          <Text style={tw`text-white/80 text-sm ml-2`}>
            Permission-based access
          </Text>
        </View>
        <View
          style={tw`flex-row items-center bg-white/20 px-3 py-1 rounded-full`}
        >
          <Text style={tw`text-white text-sm font-medium mr-2`}>
            Open Scanner
          </Text>
          <ArrowRight size={16} color="white" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default QuickScanCard;
