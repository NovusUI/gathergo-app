import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import UserSearchResult from "@/components/scanner/UserSearchResult";
import { useScannerPermissions } from "@/hooks/useScanner";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  Check,
  Mail,
  Search,
  User,
  UserPlus,
  X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";

const GrantPermission = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = params.eventId as string;
  const eventName = params.eventName as string;

  const [step, setStep] = useState<"search" | "details">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    searchResults,
    searchUsers,
    grantPermission,
    isLoading,
    errors,
    pagination,
    fetchMoreUsers,
  } = useScannerPermissions(eventId);

  // Search users when query changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers({
          email: searchQuery,
          username: searchQuery,
          fullName: searchQuery,
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleUserSelect = (user: any) => {
    setSelectedUser(user);
    setStep("details");
  };

  const handleGrantPermission = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await grantPermission({
        scannerId: selectedUser.id,
        eventId,
        expiresAt: expirationDate?.toISOString(),
      });

      Alert.alert(
        "Success",
        `Granted scanning permission to ${
          selectedUser.fullName || selectedUser.email
        }`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to grant permission");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGrantByEmail = async () => {
    if (!searchQuery.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      await grantPermission({
        userEmail: searchQuery,
        eventId,
        expiresAt: expirationDate?.toISOString(),
      });

      Alert.alert("Success", `Permission invitation sent to ${searchQuery}`, [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to grant permission");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpirationDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-[#01082E]`}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Top Navigation */}
      <View style={tw`pt-10 pb-4 px-5`}>
        <CustomeTopBarNav
          title="Grant Scanning Permission"
          onClickBack={() => router.back()}
        />
      </View>

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-20 px-5`}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Event Info */}
        <View style={tw`bg-[#1B2A50] rounded-xl p-4 mb-6`}>
          <Text style={tw`text-white text-lg font-bold mb-2`}>
            {eventName || "Event"}
          </Text>
          <Text style={tw`text-gray-400 text-sm`}>
            Grant scanning permission for this event. Users will be able to:
          </Text>
          <View style={tw`mt-2`}>
            <Text style={tw`text-gray-400 text-sm`}>
              • Scan tickets and registrations
            </Text>
            <Text style={tw`text-gray-400 text-sm`}>• Mark items as used</Text>
            <Text style={tw`text-gray-400 text-sm`}>
              • View scan history for this event
            </Text>
          </View>
        </View>

        {/* Step 1: Search User */}
        {step === "search" ? (
          <>
            <Text style={tw`text-white text-lg font-bold mb-4`}>
              Search User
            </Text>

            {/* Search Input */}
            <View
              style={tw`bg-[#1B2A50] rounded-xl px-4 py-3 flex-row items-center mb-6`}
            >
              <Search size={20} color="#5669FF" />
              <TextInput
                style={tw`flex-1 text-white ml-3`}
                placeholder="Search by name, username, or email..."
                placeholderTextColor="#6B7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                keyboardType={
                  searchQuery.includes("@") ? "email-address" : "default"
                }
              />
            </View>

            {/* Quick Grant by Email */}
            {searchQuery.includes("@") && (
              <TouchableOpacity
                style={tw`bg-[#0FF1CF] rounded-xl p-4 mb-6 flex-row items-center`}
                onPress={handleGrantByEmail}
                disabled={isSubmitting}
              >
                <Mail size={24} color="#01082E" />
                <View style={tw`flex-1 ml-4`}>
                  <Text style={tw`text-[#01082E] font-bold text-base`}>
                    Grant by Email
                  </Text>
                  <Text style={tw`text-[#01082E] text-sm mt-1`}>
                    Send invitation to {searchQuery}
                  </Text>
                </View>
                {isSubmitting ? (
                  <ActivityIndicator color="#01082E" />
                ) : (
                  <UserPlus size={24} color="#01082E" />
                )}
              </TouchableOpacity>
            )}

            {/* Search Results */}
            {searchQuery.trim().length >= 2 && (
              <>
                <Text style={tw`text-white font-semibold mb-3`}>
                  Search Results
                </Text>
                {isLoading.search ? (
                  <View style={tw`items-center py-8`}>
                    <ActivityIndicator size="large" color="#5669FF" />
                    <Text style={tw`text-gray-400 mt-3`}>
                      Searching users...
                    </Text>
                  </View>
                ) : errors.search ? (
                  <View style={tw`items-center py-8`}>
                    <Text style={tw`text-[#FF5757] mb-2`}>
                      Failed to search users
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        searchUsers({
                          email: searchQuery,
                          username: searchQuery,
                          fullName: searchQuery,
                        })
                      }
                    >
                      <Text style={tw`text-[#5669FF]`}>Try Again</Text>
                    </TouchableOpacity>
                  </View>
                ) : searchResults.length > 0 ? (
                  <>
                    <View style={tw`gap-3`}>
                      {searchResults.map((user) => (
                        <UserSearchResult
                          key={user.id}
                          user={user}
                          onSelect={() => handleUserSelect(user)}
                        />
                      ))}
                    </View>
                    {pagination.hasMoreUsers && (
                      <TouchableOpacity
                        style={tw`mt-4 py-3 rounded-xl border border-gray-700 items-center`}
                        onPress={() => fetchMoreUsers()}
                        disabled={pagination.isFetchingMoreUsers}
                      >
                        {pagination.isFetchingMoreUsers ? (
                          <ActivityIndicator color="#5669FF" />
                        ) : (
                          <Text style={tw`text-white`}>Load More Users</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <View style={tw`items-center py-8`}>
                    <User size={48} color="#2A3A6A" />
                    <Text style={tw`text-gray-400 text-lg font-semibold mt-4`}>
                      No Users Found
                    </Text>
                    <Text style={tw`text-gray-500 text-center mt-2 px-10`}>
                      Try searching with a different name or email address
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Instructions */}
            <View style={tw`mt-6 bg-[#1B2A50] rounded-xl p-4`}>
              <Text style={tw`text-white font-semibold mb-2`}>
                How to grant permissions:
              </Text>
              <Text style={tw`text-gray-400 text-sm`}>
                1. Search for users by name, username, or email{"\n"}
                2. Select a user from the search results{"\n"}
                3. Set optional expiration date{"\n"}
                4. Confirm to grant scanning permission
              </Text>
            </View>
          </>
        ) : (
          /* Step 2: User Details */
          <>
            <Text style={tw`text-white text-lg font-bold mb-4`}>
              Confirm Permission
            </Text>

            {/* Selected User Info */}
            <View style={tw`bg-[#1B2A50] rounded-xl p-4 mb-6`}>
              <View style={tw`flex-row items-center mb-3`}>
                {selectedUser.profilePicUrl ? (
                  //   <Image
                  //     source={{ uri: selectedUser.profilePicUrl }}
                  //     style={tw`w-12 h-12 rounded-full`}
                  //   />
                  <Image
                    source={{ uri: selectedUser.profilePicUrl }}
                    style={tw`w-12 h-12 rounded-full`}
                    cachePolicy="disk"
                  />
                ) : (
                  <View
                    style={tw`w-12 h-12 rounded-full bg-[#5669FF] items-center justify-center`}
                  >
                    <Text style={tw`text-white text-lg font-bold`}>
                      {selectedUser.fullName?.[0] ||
                        selectedUser.email?.[0] ||
                        "U"}
                    </Text>
                  </View>
                )}
                <View style={tw`ml-3 flex-1`}>
                  <Text style={tw`text-white font-semibold`}>
                    {selectedUser.fullName || selectedUser.username || "User"}
                  </Text>
                  <Text style={tw`text-gray-400 text-sm`}>
                    {selectedUser.email}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setStep("search")}>
                  <X size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text style={tw`text-gray-400 text-sm`}>
                This user will receive scanning permissions for:{"\n"}
                <Text style={tw`text-white font-semibold`}>{eventName}</Text>
              </Text>
            </View>

            {/* Expiration Date */}
            <Text style={tw`text-white font-semibold mb-3`}>
              Expiration Date (Optional)
            </Text>
            <TouchableOpacity
              style={tw`bg-[#1B2A50] rounded-xl p-4 mb-6 flex-row items-center justify-between`}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={tw`flex-row items-center`}>
                <Calendar size={20} color="#5669FF" />
                <Text style={tw`text-white ml-3`}>
                  {expirationDate
                    ? formatDate(expirationDate)
                    : "No expiration date"}
                </Text>
              </View>
              {expirationDate && (
                <TouchableOpacity onPress={() => setExpirationDate(null)}>
                  <X size={20} color="#FF5757" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={expirationDate || new Date()}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            {/* Permission Summary */}
            <View
              style={tw`bg-gradient-to-r from-[#5669FF] to-[#9D4EDD] rounded-xl p-4 mb-6`}
            >
              <Text style={tw`text-white font-bold text-lg mb-2`}>
                Permission Summary
              </Text>
              <View style={tw`gap-2`}>
                <View style={tw`flex-row items-center`}>
                  <Check size={16} color="#0FF1CF" />
                  <Text style={tw`text-white text-sm ml-2`}>
                    Can scan tickets and registrations
                  </Text>
                </View>
                <View style={tw`flex-row items-center`}>
                  <Check size={16} color="#0FF1CF" />
                  <Text style={tw`text-white text-sm ml-2`}>
                    Can mark items as used
                  </Text>
                </View>
                <View style={tw`flex-row items-center`}>
                  <Check size={16} color="#0FF1CF" />
                  <Text style={tw`text-white text-sm ml-2`}>
                    Can view scan history for this event
                  </Text>
                </View>
                {expirationDate && (
                  <View style={tw`flex-row items-center`}>
                    <Calendar size={16} color="#FF932E" />
                    <Text style={tw`text-white text-sm ml-2`}>
                      Expires on {formatDate(expirationDate)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={tw`gap-3`}>
              <TouchableOpacity
                style={tw`bg-[#0FF1CF] py-4 rounded-xl items-center`}
                onPress={handleGrantPermission}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#01082E" />
                ) : (
                  <>
                    <UserPlus size={24} color="#01082E" />
                    <Text style={tw`text-[#01082E] font-bold text-lg mt-2`}>
                      Grant Permission
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`py-4 rounded-xl items-center border border-gray-700`}
                onPress={() => setStep("search")}
                disabled={isSubmitting}
              >
                <Text style={tw`text-white font-medium`}>Back to Search</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default GrantPermission;
