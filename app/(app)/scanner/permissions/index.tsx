import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import PermissionCard from "@/components/scanner/PermissionCard";
import ActivityIndicator from "@/components/ui/AppLoader";
import { useScannerPermissions } from "@/hooks/useScanner";
import { useLockedRouter } from "@/utils/navigation";
import { safeGoBack } from "@/utils/navigation";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Plus, Shield, Users } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";

const ManagePermissions = () => {
  const router = useLockedRouter();
  const params = useLocalSearchParams();
  const eventId = params.eventId as string;
  const eventName = params.eventName as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filterActive, setFilterActive] = useState(true);

  const {
    grantedPermissions,
    isLoading,
    errors,
    refetchGrantedPermissions,
    revokePermission,

    updatePermission,
  } = useScannerPermissions(eventId);

  console.log(grantedPermissions);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchGrantedPermissions();
    setRefreshing(false);
  }, [refetchGrantedPermissions]);

  const handleRevokePermission = async (permissionId: string) => {
    Alert.alert(
      "Revoke Permission",
      "Are you sure you want to revoke this scanning permission? The user will no longer be able to scan for this event.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            try {
              await revokePermission(permissionId);
              Alert.alert("Success", "Permission revoked successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to revoke permission");
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (
    permissionId: string,
    isActive: boolean
  ) => {
    try {
      await updatePermission(permissionId, { isActive: !isActive });
    } catch (error) {
      //Alert.alert("Error", "Failed to update permission");
    }
  };

  const filteredPermissions = grantedPermissions.filter((permission) => {
    // Filter by active/inactive
    if (filterActive !== permission.isActive) return false;

    // Filter by search query
    // if (searchQuery) {
    //   const query = searchQuery.toLowerCase();
    //   console.log(query);
    //   return (
    //     permission.scannerName.toLowerCase().includes(query) ||
    //     permission.scannerEmail.toLowerCase().includes(query) ||
    //     permission.eventName.toLowerCase().includes(query)
    //   );
    // }

    return true;
  });

  const activePermissions = grantedPermissions.filter((p) => p.isActive);
  const inactivePermissions = grantedPermissions.filter((p) => !p.isActive);

  if (isLoading.grantedPermissions && !grantedPermissions.length) {
    return (
      <View style={tw`flex-1 bg-[#01082E]`}>
        <View style={tw`pt-10 pb-4 px-5`}>
          <CustomeTopBarNav
            title="Manage Permissions"
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
          title={eventName ? `Permissions: ${eventName}` : "Manage Permissions"}
          onClickBack={() => safeGoBack(router, "/scanner")}
        />
      </View>

      {/* Search and Filter Bar */}
      <View style={tw`px-5 mb-4`}>
        {/* <View style={tw`flex-row items-center mb-3`}>
          <View
            style={tw`flex-1 bg-[#1B2A50] rounded-xl px-4 py-3 flex-row items-center`}
          >
            <Search size={20} color="#5669FF" />
            <TextInput
              style={tw`flex-1 text-white ml-3`}
              placeholder="Search users..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            style={tw`ml-3 bg-[#1B2A50] w-12 h-12 rounded-xl items-center justify-center`}
            onPress={() => setFilterActive(!filterActive)}
          >
            <Filter size={20} color={filterActive ? "#0FF1CF" : "#6B7280"} />
          </TouchableOpacity>
        </View> */}

        <View style={tw`flex-row items-center justify-between`}>
          <TouchableOpacity
            style={tw`px-4 py-2 rounded-full ${
              filterActive ? "bg-[#5669FF]" : "bg-[#1B2A50]"
            }`}
            onPress={() => setFilterActive(true)}
          >
            <Text
              style={tw`text-sm font-medium ${
                filterActive ? "text-white" : "text-gray-400"
              }`}
            >
              Active ({activePermissions.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`px-4 py-2 rounded-full ${
              !filterActive ? "bg-[#FF932E]" : "bg-[#1B2A50]"
            }`}
            onPress={() => setFilterActive(false)}
          >
            <Text
              style={tw`text-sm font-medium ${
                !filterActive ? "text-white" : "text-gray-400"
              }`}
            >
              Inactive ({inactivePermissions.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`flex-row items-center bg-[#0FF1CF] px-4 py-2 rounded-full`}
            onPress={() =>
              router.push({
                pathname: "/scanner/permissions/grant-permission",
                params: { eventId, eventName },
              })
            }
          >
            <Plus size={16} color="#01082E" />
            <Text style={tw`text-[#01082E] text-sm font-semibold ml-2`}>
              Grant Access
            </Text>
          </TouchableOpacity>
        </View>
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
        {errors.grantedPermissions ? (
          <View style={tw`items-center justify-center py-20`}>
            <Shield size={64} color="#FF5757" />
            <Text style={tw`text-[#FF5757] text-lg font-semibold mt-4`}>
              Failed to Load Permissions
            </Text>
            <Text style={tw`text-gray-500 text-center mt-2 px-10`}>
              {errors.grantedPermissions.message || "Please try again"}
            </Text>
            <TouchableOpacity
              style={tw`bg-[#5669FF] px-6 py-3 rounded-full mt-4`}
              onPress={() => refetchGrantedPermissions()}
            >
              <Text style={tw`text-white font-semibold`}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredPermissions.length > 0 ? (
          <View style={tw`gap-3`}>
            <Text style={tw`text-white text-lg font-bold mb-2`}>
              {filterActive ? "Active Permissions" : "Inactive Permissions"}
            </Text>
            {filteredPermissions.map((permission) => (
              <PermissionCard
                key={permission.id}
                permission={permission}
                onRevoke={() => handleRevokePermission(permission.id)}
                onToggleActive={() =>
                  handleToggleActive(permission.id, permission.isActive)
                }
                isEventOwner={true}
              />
            ))}
          </View>
        ) : (
          <View style={tw`items-center justify-center py-20`}>
            <Users size={64} color="#2A3A6A" />
            <Text style={tw`text-gray-400 text-lg font-semibold mt-4`}>
              No Permissions Found
            </Text>
            <Text style={tw`text-gray-500 text-center mt-2 px-10`}>
              {searchQuery
                ? "No users match your search"
                : `No ${
                    filterActive ? "active" : "inactive"
                  } scanning permissions for this event.`}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={tw`bg-[#0FF1CF] px-6 py-3 rounded-full mt-4`}
                onPress={() =>
                  router.push({
                    pathname: "/scanner/permissions/grant-permission",
                    params: { eventId, eventName },
                  })
                }
              >
                <Text style={tw`text-[#01082E] font-semibold`}>
                  Grant First Permission
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Stats Summary */}
        {grantedPermissions.length > 0 && (
          <View style={tw`mt-6 bg-[#1B2A50] rounded-xl p-4`}>
            <Text style={tw`text-white text-lg font-bold mb-3`}>
              Permission Summary
            </Text>
            <View style={tw`flex-row justify-between`}>
              <View style={tw`items-center`}>
                <Text style={tw`text-white text-2xl font-bold`}>
                  {grantedPermissions.length}
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
                  {inactivePermissions.length}
                </Text>
                <Text style={tw`text-gray-400 text-sm`}>Inactive</Text>
              </View>
              <View style={tw`items-center`}>
                <Text style={tw`text-white text-2xl font-bold`}>
                  {grantedPermissions.filter((p) => p.expiresAt).length}
                </Text>
                <Text style={tw`text-gray-400 text-sm`}>Expiring</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ManagePermissions;
