import CustomView from "@/components/View";
import { layoutSpacing, spacing } from "@/constants/spacing";
import EventCard from "@/components/ui/EventCard";
import { useGetSearchResult } from "@/services/queries";
import { useRouter } from "expo-router";
import { SearchIcon } from "lucide-react-native";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import tw from "twrnc";

const SearchScreen = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<TextInput | null>(null);

  const {
    data: searchResults,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isPending,
  } = useGetSearchResult(query, "events", 10);

  const results = useMemo(
    () => searchResults?.pages?.flatMap((page: any) => page.data) ?? [],
    [searchResults]
  );

  const renderContent = () => {
    if (isPending) {
      return (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator color="#0FF1CF" size="large" />
        </View>
      );
    }

    if (query.trim().length === 0) {
      return (
        <View style={tw`mt-5`}>
          <Text style={tw`text-white text-center`}>
            Type something to search for events
          </Text>
        </View>
      );
    }

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
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color="#0FF1CF" style={styles.listFooterLoading} />
          ) : null
        }
      />
    ) : (
      <View style={tw`mt-5`}>
        <Text style={tw`text-white text-center`}>No events found</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[tw`flex-1 bg-[#01082E] items-center flex-col overflow-hidden`, styles.screen]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
    >
      {/* Search Bar */}
      <Pressable
        onPress={() => searchInputRef.current?.focus()}
        style={[
          tw`flex-row items-center bg-[#1A2755] rounded-full w-full max-w-[500px]`,
          styles.searchBar,
        ]}
      >
        <SearchIcon size={20} color="white" />
        <TextInput
          ref={searchInputRef}
          placeholder="Search events"
          placeholderTextColor="#94A3B8"
          value={query}
          onChangeText={setQuery}
          style={tw`flex-1 text-white ml-3`}
        />
      </Pressable>

      {/* Content */}
      <CustomView style={styles.contentContainer}>{renderContent()}</CustomView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    paddingTop: layoutSpacing.pageTop,
    paddingBottom: layoutSpacing.pageBottom,
    paddingHorizontal: layoutSpacing.pageHorizontal,
  },
  searchBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  contentContainer: {
    flex: 1,
    marginBottom: layoutSpacing.listBottomInset,
  },
  listContent: {
    gap: layoutSpacing.listGap,
    paddingVertical: layoutSpacing.sm,
  },
  listFooterLoading: {
    margin: layoutSpacing.lg,
  },
});

export default SearchScreen;
