import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import EventPermissionCard from "@/components/scanner/EventPermissionCard";
import ActivityIndicator from "@/components/ui/AppLoader";
import { useScanner } from "@/hooks/useScanner";
import { useLockedRouter } from "@/utils/navigation";
import { safeGoBack } from "@/utils/navigation";
import { useRouter } from "expo-router";
import { Calendar, ChevronRight, Shield, Users } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";

const MyPermissions = () => {
  const router = useLockedRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "active" | "expiring" | "expired"
  >("all");

  const { permissions, isLoading, error, refetchPermissions } = useScanner();

  console.log(permissions, "permissions");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchPermissions();
    setRefreshing(false);
  }, [refetchPermissions]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No expiration";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Expires today";
    if (diffDays === 1) return "Expires tomorrow";
    if (diffDays <= 7) return `Expires in ${diffDays} days`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getExpirationStatus = (expiresAt?: string) => {
    if (!expiresAt) return "active";
    const date = new Date(expiresAt);
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return "expired";
    if (diffDays <= 7) return "expiring";
    return "active";
  };

  const filteredPermissions = permissions.filter((permission) => {
    const status = getExpirationStatus(permission.expiresAt);

    switch (filter) {
      case "active":
        return status === "active";
      case "expiring":
        return status === "expiring";
      case "expired":
        return status === "expired";
      default:
        return true;
    }
  });

  const activePermissions = permissions.filter(
    (p) => getExpirationStatus(p.expiresAt) === "active"
  );
  const expiringPermissions = permissions.filter(
    (p) => getExpirationStatus(p.expiresAt) === "expiring"
  );
  const expiredPermissions = permissions.filter(
    (p) => getExpirationStatus(p.expiresAt) === "expired"
  );

  if (isLoading.permissions && !permissions.length) {
    return (
      <View style={tw`flex-1 bg-[#01082E]`}>
        <View style={tw`pt-10 pb-4 px-5`}>
          <CustomeTopBarNav
            title="My Permissions"
            onClickBack={() => safeGoBack(router, "/scanner")}
          />
        </View>
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator tone="accent" size="large" />
          <Text style={tw`text-gray-400 mt-4`}>Loading permissions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-[#01082E]`}>
      {/* Top Navigation */}
      <View style={tw`pt-10 pb-4 px-5`}>
        <CustomeTopBarNav
          title="My Scanning Permissions"
          onClickBack={() => safeGoBack(router, "/scanner")}
        />
      </View>

      {/* Stats Summary */}
      <View style={tw`px-5 mb-4`}>
        <View style={tw`bg-[#1B2A50] rounded-xl p-4`}>
          <Text style={tw`text-white text-lg font-bold mb-3`}>
            Permission Overview
          </Text>
          <View style={tw`flex-row justify-between`}>
            <View style={tw`items-center`}>
              <Text style={tw`text-white text-2xl font-bold`}>
                {permissions.length}
              </Text>
              <Text style={tw`text-gray-400 text-sm`}>Total</Text>
            </View>
            <View style={tw`items-center`}>
              <Text style={tw`text-[#0FF1CF] text-2xl font-bold`}>
                {activePermissions.length}
              </Text>
              <Text style={tw`text-gray-400 text-sm`}>Active</Text>
            </View>
            <View style={tw`items-center`}>
              <Text style={tw`text-[#FF932E] text-2xl font-bold`}>
                {expiringPermissions.length}
              </Text>
              <Text style={tw`text-gray-400 text-sm`}>Expiring</Text>
            </View>
            <View style={tw`items-center`}>
              <Text style={tw`text-[#FF5757] text-2xl font-bold`}>
                {expiredPermissions.length}
              </Text>
              <Text style={tw`text-gray-400 text-sm`}>Expired</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Filters */}
      <View style={tw`px-5 mb-4`}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={tw`flex-row gap-2`}>
            {[
              { id: "all", label: "All", count: permissions.length },
              {
                id: "active",
                label: "Active",
                count: activePermissions.length,
              },
              {
                id: "expiring",
                label: "Expiring",
                count: expiringPermissions.length,
              },
              {
                id: "expired",
                label: "Expired",
                count: expiredPermissions.length,
              },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  tw`px-4 py-2 rounded-full flex-row items-center`,
                  filter === item.id ? tw`bg-[#5669FF]` : tw`bg-[#1B2A50]`,
                ]}
                onPress={() => setFilter(item.id as any)}
              >
                <Text
                  style={[
                    tw`text-sm font-medium mr-2`,
                    filter === item.id ? tw`text-white` : tw`text-gray-400`,
                  ]}
                >
                  {item.label}
                </Text>
                <View
                  style={[
                    tw`px-2 py-1 rounded-full`,
                    filter === item.id ? tw`bg-white/20` : tw`bg-gray-700`,
                  ]}
                >
                  <Text
                    style={[
                      tw`text-xs font-bold`,
                      filter === item.id ? tw`text-white` : tw`text-gray-400`,
                    ]}
                  >
                    {item.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Permissions List */}
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
        {error.permissions ? (
          <View style={tw`items-center justify-center py-20`}>
            <Shield size={64} color="#FF5757" />
            <Text style={tw`text-[#FF5757] text-lg font-semibold mt-4`}>
              Failed to Load Permissions
            </Text>
            <Text style={tw`text-gray-500 text-center mt-2 px-10`}>
              Please try again
            </Text>
            <TouchableOpacity
              style={tw`bg-[#5669FF] px-6 py-3 rounded-full mt-4`}
              onPress={() => refetchPermissions()}
            >
              <Text style={tw`text-white font-semibold`}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredPermissions.length > 0 ? (
          <View style={tw`gap-3`}>
            {filteredPermissions.map((permission) => (
              <EventPermissionCard
                key={permission.eventId}
                permission={permission}
                onPress={() =>
                  router.push({
                    pathname: "/(app)/scanner/scanner-screen",
                    params: { id: permission.eventId },
                  })
                }
              />
            ))}
          </View>
        ) : (
          <View style={tw`items-center justify-center py-20`}>
            <Shield size={64} color="#2A3A6A" />
            <Text style={tw`text-gray-400 text-lg font-semibold mt-4`}>
              No Permissions Found
            </Text>
            <Text style={tw`text-gray-500 text-center mt-2 px-10`}>
              {filter === "all"
                ? "You don't have any scanning permissions yet. Event organizers can grant you permissions to scan tickets."
                : `No ${filter} permissions found.`}
            </Text>
            <TouchableOpacity
              style={tw`bg-[#5669FF] px-6 py-3 rounded-full mt-4`}
              onPress={() => router.push("/scanner/scanner-screen")}
            >
              <Text style={tw`text-white font-semibold`}>Scan QR Codes</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Information Section */}
        {permissions.length > 0 && (
          <View style={tw`mt-6 bg-[#1B2A50] rounded-xl p-4`}>
            <Text style={tw`text-white font-semibold mb-3`}>
              About Scanning Permissions
            </Text>
            <View style={tw`gap-2`}>
              <View style={tw`flex-row items-start`}>
                <Shield size={16} color="#0FF1CF" style={tw`mt-1`} />
                <Text style={tw`text-gray-400 text-sm ml-2 flex-1`}>
                  You can scan tickets and mark them as used for these events
                </Text>
              </View>
              <View style={tw`flex-row items-start`}>
                <Calendar size={16} color="#FF932E" style={tw`mt-1`} />
                <Text style={tw`text-gray-400 text-sm ml-2 flex-1`}>
                  Permissions may expire. Check the expiration dates above
                </Text>
              </View>
              <View style={tw`flex-row items-start`}>
                <Users size={16} color="#5669FF" style={tw`mt-1`} />
                <Text style={tw`text-gray-400 text-sm ml-2 flex-1`}>
                  Contact event organizers for permission changes or extensions
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Scan Button */}
      <View style={tw`absolute bottom-0 left-0 right-0 p-5 bg-[#01082E]`}>
        <TouchableOpacity
          style={tw`bg-[#0FF1CF] py-4 rounded-xl items-center flex-row justify-center`}
          onPress={() => router.push("/scanner/scanner-screen")}
        >
          <Text style={tw`text-[#01082E] font-bold text-lg mr-3`}>
            Scan QR Codes
          </Text>
          <ChevronRight size={20} color="#01082E" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MyPermissions;
