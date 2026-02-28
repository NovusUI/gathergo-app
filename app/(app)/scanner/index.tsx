import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import { useRouter } from "expo-router";
import { BarChart3, Clock, QrCode, Shield, Users } from "lucide-react-native";
import { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";

import PermissionBadge from "@/components/scanner/PermissionBadge";
import QuickScanCard from "@/components/scanner/QuickScanCard";
import ScannerStats from "@/components/scanner/ScannerStats";
import { useScanner, useScannerPermissions } from "@/hooks/useScanner";

const ScannerHome = () => {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const {
    stats,
    isLoading: statsLoading,
    error: statsError,
    refetchStats,
  } = useScanner();

  const {
    eventPermissions: permissions,
    isLoading: permissionsLoading,
    errors: permissionsError,
    refetchEventPermissions: refetchPermissions,
  } = useScannerPermissions();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchPermissions()]);
    setRefreshing(false);
  };

  const menuItems = [
    {
      id: "scan",
      title: "Scan QR Code",
      description: "Scan tickets and registrations",
      icon: QrCode,
      color: "#5669FF",
      onPress: () => router.push("/scanner/scanner-screen"),
    },
    {
      id: "history",
      title: "Scan History",
      description: "View your scanning history",
      icon: Clock,
      color: "#FF932E",
      onPress: () => router.push("/scanner/scanner-history"),
    },
    {
      id: "permissions",
      title: "My Permissions",
      description: "Events you can scan for",
      icon: Shield,
      color: "#0FF1CF",
      onPress: () => router.push("/scanner/permissions/my-permissions"),
    },
    {
      id: "manage-permissions",
      title: "Manage Permissions",
      description: "Grant scanning permissions",
      icon: Users,
      color: "#9D4EDD",
      onPress: () => router.push("/scanner/permissions"),
    },
  ];

  // useEffect(() => {
  //   console.log(statsError);
  //   console.log(permissionsError, "hjkl");
  //   if (statsError || permissionsError) {
  //     Alert.alert("Error", "Failed to load scanner data. Please try again.");
  //   }
  // }, [statsError, permissionsError]);

  return (
    <View style={tw`flex-1 bg-[#01082E]`}>
      {/* Top Navigation */}
      <View style={tw`pt-10 pb-4 px-5`}>
        <CustomeTopBarNav
          title="QR Scanner"
          onClickBack={() => router.back()}
        />
      </View>

      {/* Main Content */}
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-20 px-5`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#5669FF"
            colors={["#5669FF"]}
          />
        }
      >
        {/* Welcome Section */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-white text-2xl font-bold mb-2`}>
            QR Code Scanner
          </Text>
          <Text style={tw`text-gray-400 text-base`}>
            Scan tickets, registrations, and donations. Everyone can view
            details. Mark as used requires permission.
          </Text>
        </View>

        {/* Quick Scan Card */}
        <View style={tw`mb-6`}>
          <QuickScanCard
            onPress={() => router.push("/scanner/scanner-screen")}
          />
        </View>

        {/* Scanner Stats */}
        {!statsLoading && stats && (
          <View style={tw`mb-6`}>
            <ScannerStats stats={stats} />
          </View>
        )}

        {/* Current Permissions */}
        {!permissionsLoading && permissions && permissions.length > 0 && (
          <View style={tw`mb-6`}>
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <Text style={tw`text-white text-lg font-bold`}>
                Active Permissions
              </Text>
              <TouchableOpacity
                onPress={() =>
                  router.push("/scanner/permissions/my-permissions")
                }
              >
                <Text style={tw`text-[#5669FF] text-sm font-medium`}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            <View style={tw`flex-row flex-wrap gap-2`}>
              {permissions.slice(0, 3).map((permission) => (
                <PermissionBadge
                  key={permission.eventId}
                  eventName={permission.eventName}
                  expiresAt={permission.expiresAt}
                />
              ))}
              {permissions.length > 3 && (
                <View style={tw`bg-[#1B2A50] px-3 py-1 rounded-full`}>
                  <Text style={tw`text-gray-400 text-xs`}>
                    +{permissions.length - 3} more
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Scanner Menu */}
        <View style={tw`mb-8`}>
          <Text style={tw`text-white text-lg font-bold mb-4`}>
            Scanner Tools
          </Text>
          <View style={tw`gap-3`}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={tw`bg-[#1B2A50] rounded-xl p-4 flex-row items-center`}
                onPress={item.onPress}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    tw`w-12 h-12 rounded-full items-center justify-center mr-4`,
                    { backgroundColor: `${item.color}20` }, // 20 = 12% opacity
                  ]}
                >
                  <item.icon size={24} color={item.color} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-white text-base font-semibold`}>
                    {item.title}
                  </Text>
                  <Text style={tw`text-gray-400 text-sm mt-1`}>
                    {item.description}
                  </Text>
                </View>
                <View
                  style={tw`w-8 h-8 rounded-full bg-[#2A3A6A] items-center justify-center`}
                >
                  <Text style={tw`text-white`}>→</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Section */}
        <View style={tw`bg-[#1B2A50] rounded-xl p-4 mb-6`}>
          <View style={tw`flex-row items-center mb-2`}>
            <BarChart3 size={20} color="#0FF1CF" />
            <Text style={tw`text-white text-sm font-semibold ml-2`}>
              How Scanning Works
            </Text>
          </View>
          <Text style={tw`text-gray-400 text-sm`}>
            • Everyone can scan QR codes to view details{"\n"}• Only event
            owners and authorized scanners can mark as used{"\n"}• Permissions
            are granted per event{"\n"}• All scans are logged for security
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default ScannerHome;
