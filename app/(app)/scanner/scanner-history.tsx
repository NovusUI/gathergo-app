import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import ActivityIndicator from "@/components/ui/AppLoader";
import { useScanner } from "@/hooks/useScanner";
import { useLockedRouter } from "@/utils/navigation";
import { safeGoBack } from "@/utils/navigation";
import { useRouter } from "expo-router";
import { Clock } from "lucide-react-native";
import { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";

const ScannerHistory = () => {
  const router = useLockedRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "ticket" | "registration">(
    "all"
  );

  const { history, isLoading, error, refetchHistory } = useScanner();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchHistory();
    setRefreshing(false);
  };

  const filteredHistory = history?.filter((item) => {
    if (filter === "all") return true;
    return item.type === filter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (success: boolean) => {
    return success ? "#0FF1CF" : "#FF5757";
  };

  const getTypeColor = (type: string) => {
    return type === "ticket" ? "#FF932E" : "#5669FF";
  };

  return (
    <View style={tw`flex-1 bg-[#01082E]`}>
      {/* Top Navigation */}
      <View style={tw`pt-10 pb-4 px-5`}>
        <CustomeTopBarNav
          title="Scan History"
          onClickBack={() => safeGoBack(router, "/scanner")}
        />
      </View>

      {/* Filters */}
      <View style={tw`px-5 mb-4`}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={tw`flex-row gap-2`}>
            {[
              { id: "all", label: "All Scans" },
              { id: "ticket", label: "Tickets" },
              { id: "registration", label: "Registrations" },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  tw`px-4 py-2 rounded-full`,
                  filter === item.id ? tw`bg-[#5669FF]` : tw`bg-[#1B2A50]`,
                ]}
                onPress={() => setFilter(item.id as any)}
              >
                <Text
                  style={[
                    tw`text-sm font-medium`,
                    filter === item.id ? tw`text-white` : tw`text-gray-400`,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Stats */}
      <View style={tw`px-5 mb-6`}>
        <View style={tw`bg-[#1B2A50] rounded-xl p-4`}>
          <View style={tw`flex-row justify-between items-center`}>
            <View>
              <Text style={tw`text-gray-400 text-sm`}>Total Scans</Text>
              <Text style={tw`text-white text-2xl font-bold`}>
                {history?.length || 0}
              </Text>
            </View>
            <View>
              <Text style={tw`text-gray-400 text-sm`}>Successful</Text>
              <Text style={tw`text-[#0FF1CF] text-2xl font-bold`}>
                {history?.filter((h) => h.success).length || 0}
              </Text>
            </View>
            <View>
              <Text style={tw`text-gray-400 text-sm`}>Failed</Text>
              <Text style={tw`text-[#FF5757] text-2xl font-bold`}>
                {history?.filter((h) => !h.success).length || 0}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* History List */}
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
        {isLoading.history ? (
          <View style={tw`items-center justify-center py-10`}>
            <ActivityIndicator tone="accent" size="large" />
            <Text style={tw`text-gray-400 mt-3`}>Loading history...</Text>
          </View>
        ) : error.history ? (
          <View style={tw`items-center justify-center py-10`}>
            <Text style={tw`text-[#FF5757] mb-2`}>Failed to load history</Text>
            <TouchableOpacity onPress={() => refetchHistory()}>
              <Text style={tw`text-[#5669FF]`}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredHistory && filteredHistory.length > 0 ? (
          <View style={tw`gap-3`}>
            {filteredHistory.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={tw`bg-[#1B2A50] rounded-xl p-4`}
                activeOpacity={0.8}
              >
                <View style={tw`flex-row justify-between items-start mb-2`}>
                  <View style={tw`flex-row items-center`}>
                    <View
                      style={[
                        tw`w-3 h-3 rounded-full mr-2`,
                        { backgroundColor: getStatusColor(item.success) },
                      ]}
                    />
                    <Text style={tw`text-white font-semibold`}>
                      {item.eventName || "Unknown Event"}
                    </Text>
                  </View>
                  <Text style={tw`text-gray-400 text-xs`}>
                    {formatDate(item.scannedAt)}
                  </Text>
                </View>

                <View style={tw`flex-row items-center mb-3`}>
                  <View
                    style={[
                      tw`px-2 py-1 rounded mr-2`,
                      { backgroundColor: `${getTypeColor(item.type)}20` },
                    ]}
                  >
                    <Text
                      style={[
                        tw`text-xs font-medium`,
                        { color: getTypeColor(item.type) },
                      ]}
                    >
                      {item.type.toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    style={[
                      tw`text-xs font-medium`,
                      item.action === "marked_used"
                        ? tw`text-[#0FF1CF]`
                        : tw`text-gray-400`,
                    ]}
                  >
                    {item.action.replace("_", " ").toUpperCase()}
                  </Text>
                </View>

                <Text
                  style={[
                    tw`text-sm`,
                    item.success ? tw`text-gray-400` : tw`text-[#FF5757]`,
                  ]}
                >
                  {item.message}
                </Text>

                <View style={tw`flex-row items-center mt-3`}>
                  <Clock size={14} color="#5669FF" />
                  <Text style={tw`text-gray-400 text-xs ml-2`}>
                    {new Date(item.scannedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={tw`items-center justify-center py-20`}>
            <Clock size={64} color="#2A3A6A" />
            <Text style={tw`text-gray-400 text-lg font-semibold mt-4`}>
              No Scan History
            </Text>
            <Text style={tw`text-gray-500 text-center mt-2 px-10`}>
              Your scanning history will appear here once you start scanning QR
              codes.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Scan Button */}
      <View style={tw`absolute bottom-0 left-0 right-0 p-5 bg-[#01082E]`}>
        <TouchableOpacity
          style={tw`bg-[#5669FF] py-4 rounded-xl items-center`}
          onPress={() => router.push("/scanner/scanner-screen")}
        >
          <Text style={tw`text-white font-bold text-lg`}>Scan QR Code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ScannerHistory;
