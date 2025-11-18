import CustomView from "@/components/View";
import EventCard from "@/components/ui/EventCard";
import { useGetSearchResult } from "@/services/queries";
import { useRouter } from "expo-router";
import { SearchIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";

const SearchScreen = () => {
  const tabs = [
    { label: "Events", value: "events" },
    { label: "Users", value: "users" },
    { label: "Circle", value: "communities" },
  ] as const;

  type TabValue = (typeof tabs)[number]["value"];
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabValue>("events");
  const [query, setQuery] = useState("");

  // hook connected to backend
  const {
    data: searchResults,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isPending,
  } = useGetSearchResult(query, activeTab, 10);

  // flatten pages if you're using infiniteQuery
  const results = searchResults?.pages?.flatMap((page: any) => page.data) ?? [];

  useEffect(() => {
    console.log(results);
  }, [results]);

  const renderContent = () => {
    if (isPending) {
      return (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator color="#0FF1CF" size="large" />
        </View>
      );
    }

    if (activeTab === "events") {
      return results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard
              id={item.id}
              title={item.title}
              location={item.location}
              imageUrl={item.imageUrl}
              registrationType={item.registrationType}
              registrationFee={item.registrationFee}
              onPress={() => router.push(`/event/${item.id}`)}
              startDate={item.startDate}
            />
          )}
          contentContainerStyle={{ gap: 16, paddingVertical: 10 }}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color="#0FF1CF" style={{ margin: 16 }} />
            ) : null
          }
        />
      ) : (
        <View style={tw`mt-5`}>
          <Text style={tw`text-white text-center`}>No Events found</Text>
        </View>
      );
    }

    if (activeTab === "users") {
      return results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Text style={tw`text-white text-center py-3`}>{item.username}</Text>
          )}
        />
      ) : (
        <View style={tw`mt-5`}>
          <Text style={tw`text-white text-center`}>No users found</Text>
        </View>
      );
    }

    if (activeTab === "communities") {
      return results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Text style={tw`text-white text-center py-3`}>{item.name}</Text>
          )}
        />
      ) : (
        <View style={tw`mt-5`}>
          <Text style={tw`text-white text-center`}>No circles found</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View
      style={tw`flex-1 bg-[#01082E] items-center flex-col pt-10 pb-5 px-5 overflow-hidden`}
    >
      {/* Search Bar */}
      <View
        style={tw`flex-row items-center bg-[#1A2755] rounded-full px-4 py-4 mb-5 w-full max-w-[500px]`}
      >
        <SearchIcon size={20} color="white" />
        <TextInput
          placeholder={`Search ${activeTab}`}
          placeholderTextColor="#94A3B8"
          value={query}
          onChangeText={setQuery}
          style={tw`flex-1 text-white ml-3`}
        />
      </View>

      {/* Tabs */}
      <CustomView style={tw`flex-row justify-around pb-2 mb-4`}>
        {tabs.map(({ label, value }) => (
          <TouchableOpacity key={value} onPress={() => setActiveTab(value)}>
            <Text
              style={tw`${
                activeTab === value ? "text-[#0FF1CF]" : "text-white"
              } text-sm font-semibold`}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </CustomView>

      {/* Content */}
      <CustomView style={tw`flex-1 mb-20`}>{renderContent()}</CustomView>
    </View>
  );
};

export default SearchScreen;
