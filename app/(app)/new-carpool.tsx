import CustomEventInfoSelector from "@/components/CustomEventInfoSelector";
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import Input from "@/components/inputs/CustomInput1";
import TextArea from "@/components/inputs/CustomTextArea";
import EventCard from "@/components/ui/EventCard";
import { useAuth } from "@/context/AuthContext";
import { useForYouEvents, useGetSearchResult } from "@/services/queries";
import { extractTime } from "@/utils/dateTimeHandler";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { SearchIcon } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Switch, Text, TextInput, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const NewCarpool = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [picker, setPicker] = useState<null | string>(null);

  const {
    data: searchResults,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isPending,
  } = useGetSearchResult(query, "events", 10);

  const results = searchResults?.pages?.flatMap((page: any) => page.data) ?? [];

  const { user } = useAuth();
  const { data: eventsSuggestion, isPending: loading } = useForYouEvents(
    user?.id
  );

  // Bottom sheet setup
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["50%", "100%"], []);

  const openSheet = useCallback((event: any) => {
    setSelectedEvent(event);
    bottomSheetRef.current?.present();
  }, []);

  // Form state
  const [isToEvent, setIsToEvent] = useState(true);
  const [poolLocation, setPoolLocation] = useState("");
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [poolDestination, setPoolDestination] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [notes, setNotes] = useState("");

  const renderContent = () => {
    if (isPending || loading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#0FF1CF" size="large" />
        </View>
      );
    }

    if (query.trim().length > 0) {
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
              onPress={() => openSheet(item)}
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
        <View className="mt-5">
          <Text className="text-white text-center">No Events found</Text>
        </View>
      );
    } else {
      return eventsSuggestion?.data.length ? (
        <View>
          <Text className="text-white text-center">Suggestions</Text>
          <FlatList
            data={eventsSuggestion?.data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <EventCard
                id={item.id}
                title={item.title}
                location={item.location}
                imageUrl={item.imageUrl}
                registrationType={item.registrationType}
                registrationFee={item.registrationFee}
                onPress={() => openSheet(item)}
              />
            )}
            contentContainerStyle={{ gap: 16, paddingVertical: 10 }}
          />
        </View>
      ) : (
        <View className="mt-5">
          <Text className="text-white text-center">No suggestions</Text>
        </View>
      );
    }
  };

  return (
    <View className="flex-1 pt-10 bg-[#01082E] flex flex-col items-center w-full">
      <View className="flex-1 w-full max-w-[500px] px-5">
        <CustomeTopBarNav
          title="Create carpool"
          onClickBack={() => router.replace("/")}
        />

        <View className="flex-row items-center bg-[#1A2755] rounded-full px-4 py-4 my-5 w-full max-w-[500px]">
          <SearchIcon size={20} color="white" />
          <TextInput
            placeholder={`Search an event to carpool`}
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            className="flex-1 text-white ml-3"
          />
        </View>

        <CustomView className="flex-1 mb-20">{renderContent()}</CustomView>
      </View>

      {/* Carpool Bottom Sheet */}
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
        backgroundStyle={{ backgroundColor: "#01082E", borderRadius: 20 }}
      >
        <BottomSheetScrollView contentContainerStyle={{ padding: 20 }}>
          <Text className="text-white text-lg font-semibold mb-3">
            {selectedEvent?.title}
          </Text>

          {/* Switch To / From */}
          <View className="flex-row items-center justify-between gap-3 my-4">
            <Text
              className={`text-white ${isToEvent ? "font-bold" : "opacity-50"}`}
            >
              To Event
            </Text>

            <Switch
              value={isToEvent}
              onValueChange={setIsToEvent}
              thumbColor="#0FF1CF"
              trackColor={{ false: "#1A2755", true: "#1A2755" }}
            />

            <Text
              className={`text-white ${!isToEvent ? "font-bold" : "opacity-50"}`}
            >
              From Event
            </Text>
          </View>

          {/* Conditional fields */}
          {isToEvent ? (
            <View className="mt-5">
              <Text className="text-white mb-1">Pool Location</Text>

              <CustomView className=" mb-5">
                <Input
                  className="h-16"
                  placeholder="Enter a landmark, busstop, or area"
                  onChangeText={setPoolLocation}
                  value={poolLocation}
                />
              </CustomView>

              <View className="flex-row items-center justify-between mb-5">
                <Text className="text-white">Close to current location?</Text>
                <Switch
                  value={useCurrentLocation}
                  onValueChange={setUseCurrentLocation}
                  thumbColor={useCurrentLocation ? "#0FF1CF" : "#555"}
                />
              </View>
            </View>
          ) : (
            <>
              <Text className="text-white mb-1">Pool Destination</Text>

              <CustomView className="flex-1 mb-5">
                <Input
                  placeholder="Enter a landmark, busstop, or area"
                  onChangeText={setPoolDestination}
                  value={poolDestination}
                />
              </CustomView>
            </>
          )}

          <View className="mb-5">
            {/* Departure time */}
            <Text className="text-white mb-1">Departure Time</Text>
            <CustomEventInfoSelector
              title="set time"
              value={departureTime}
              onPress={() => setPicker("picker")}
            />
            <DateTimePickerModal
              isVisible={!!picker}
              mode="time"
              onConfirm={(selected) => {
                setDepartureTime(extractTime(selected));
                setPicker(null);
              }}
              onCancel={() => setPicker(null)}
            />
          </View>

          {/* Notes */}
          <Text className="text-white mb-1">Notes</Text>

          <CustomView className="flex-1 mb-5">
            <TextArea
              placeholder="Any extra details?"
              maxLength={200}
              className="min-h-[50px]"
              onChange={setNotes}
              value={notes}
            />
          </CustomView>

          {/* Submit Button */}
        </BottomSheetScrollView>
        <View className="w-screen max-w-[500px] p-5">
          <CustomButton
            onPress={() => router.replace("/carpool/12345")}
            title={`Create Carpool`}
            buttonClassName="bg-[#0FF1CF] w-full border-0"
            textClassName="!text-black"
            showArrow={false}
          />
        </View>
      </BottomSheetModal>
    </View>
  );
};

export default NewCarpool;
