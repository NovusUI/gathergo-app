import CustomEventInfoSelector from "@/components/CustomEventInfoSelector";
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import Input from "@/components/inputs/CustomInput1";
import EventCard from "@/components/ui/EventCard";
import { layoutSpacing, spacing } from "@/constants/spacing";
import { useAuth } from "@/context/AuthContext";
import { useLocationManager } from "@/hooks/useLocationManager";
import { CarpoolFormValues, carpoolSchema } from "@/schemas/carpool";
import { useCreateCarpool } from "@/services/mutations";
import {
  useEventDetails,
  useForYouEvents,
  useGetSearchResult,
} from "@/services/queries";
import { CarpoolForm } from "@/types/carpool";
import { extractTime } from "@/utils/dateTimeHandler";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SearchIcon } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import tw from "twrnc";

const NewCarpool = () => {
  const router = useRouter();
  const { eventId: routeEventId, autoOpenEventPicker } = useLocalSearchParams<{
    eventId?: string;
    autoOpenEventPicker?: string;
  }>();
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<TextInput | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [picker, setPicker] = useState<null | string>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const hasAutoOpenedRef = useRef(false);
  const { coords, requestLocation, error, openSettings } = useLocationManager();
  console.log(error, coords);
  const preselectedEventId = Array.isArray(routeEventId)
    ? routeEventId[0]
    : routeEventId;
  const shouldAutoOpen =
    (Array.isArray(autoOpenEventPicker)
      ? autoOpenEventPicker[0]
      : autoOpenEventPicker) === "1";

  const { data: preselectedEvent } = useEventDetails(preselectedEventId || "", {
    enabled: Boolean(preselectedEventId),
  });

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
  const bottomSheetScrollRef = useRef<any>(null);
  const snapPoints = useMemo(() => ["92%"], []);

  const openSheet = useCallback((event: any) => {
    setSelectedEvent(event);
    bottomSheetRef.current?.present();
  }, []);

  const scrollSheetToBottom = useCallback(() => {
    setTimeout(() => {
      bottomSheetScrollRef.current?.scrollToEnd?.({ animated: true });
    }, 140);
  }, []);

  useEffect(() => {
    if (!isSheetOpen) return;

    const onShow = Keyboard.addListener("keyboardDidShow", () => {
      scrollSheetToBottom();
    });

    return () => {
      onShow.remove();
    };
  }, [isSheetOpen, scrollSheetToBottom]);

  useEffect(() => {
    if (!shouldAutoOpen || !preselectedEventId || hasAutoOpenedRef.current) {
      return;
    }

    const resolvedEvent = preselectedEvent?.data;
    if (!resolvedEvent) {
      return;
    }

    hasAutoOpenedRef.current = true;
    openSheet(resolvedEvent);
  }, [openSheet, preselectedEvent?.data, preselectedEventId, shouldAutoOpen]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CarpoolFormValues>({
    resolver: zodResolver(carpoolSchema),
    defaultValues: {
      isToEvent: true,
      poolLocation: "",
      useCurrentLocation: false,
      poolDestination: "",
      departureTime: "",
      notes: "",
    },
  });

  const isToEvent = watch("isToEvent");

  const useCurrentLocation = watch("useCurrentLocation");

  const toggleNearby = async () => {
    const c = await requestLocation(true);
    if (!c) {
      alert("Enable location in settings to use this filter");
      setValue("useCurrentLocation", false);
      return;
    }
  };

  useEffect(() => {
    if (useCurrentLocation && isToEvent) {
      toggleNearby();
    }
  }, [useCurrentLocation, isToEvent]);

  const renderContent = () => {
    if (isPending || loading) {
      return (
        <View style={tw`flex-1 justify-center items-center`}>
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
    } else {
      return eventsSuggestion?.data.length ? (
        <View>
          <Text style={tw`text-white text-center`}>Suggestions</Text>
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
                startDate={item.startDate}
                registrationFee={item.registrationFee}
                onPress={() => openSheet(item)}
              />
            )}
            contentContainerStyle={{ gap: 16, paddingVertical: 10 }}
          />
        </View>
      ) : (
        <View style={tw`mt-5`}>
          <Text style={tw`text-white text-center`}>No suggestions</Text>
        </View>
      );
    }
  };

  const {
    mutateAsync,
    isPending: createCarpoolPending,
  } = useCreateCarpool({
    onSuccess: (data) => {
      console.log(data);
      showGlobalSuccess(data.message);
      router.replace(`/carpool/${data.data.carpool.id}`);
    },
    onError: (e) => {
      console.log(e);
      showGlobalError("failed to create carpool");
    },
  });

  const createCarpool = async (data: CarpoolFormValues) => {
    console.log(data);
    if (!selectedEvent?.id) {
      showGlobalError("Select an event first");
      return;
    }

    let startPoint: { lng: number; lat: number } | undefined = undefined;
    if (data.useCurrentLocation) {
      if (coords) {
        startPoint = { lng: coords.lng, lat: coords.lat };
      } else {
        const liveCoords = await requestLocation(true);
        if (!liveCoords) {
          showGlobalError("Enable location or turn off current location");
          return;
        }
        startPoint = { lng: liveCoords.lng, lat: liveCoords.lat };
      }
    }

    const payload: CarpoolForm = {
      origin: data.isToEvent ? data.poolLocation : data.poolDestination,
      departureTime: data.departureTime,
      note: data.notes,
      startPoint,
      eventId: selectedEvent.id,
    };

    console.log(payload);
    try {
      await mutateAsync(payload);
    } catch (e) {
      console.log("create carpool failed", e);
    }
  };

  const onError = (errors: any) => {
    showGlobalError("Error in form");
    console.log(errors);
  };

  return (
    <View style={[tw`flex-1 pb-10 bg-[#01082E] flex flex-col items-center w-full`, styles.screen]}>
      <View style={tw`flex-1 w-full max-w-[500px] px-5`}>
        <CustomeTopBarNav
          title="Create carpool"
          onClickBack={() => router.replace("/")}
        />

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
            placeholder={`Search an event to carpool`}
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            style={tw`flex-1 text-white ml-3`}
          />
        </Pressable>

        <CustomView style={tw`flex-1 mb-20`}>{renderContent()}</CustomView>
      </View>

      {/* Carpool Bottom Sheet */}
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        android_keyboardInputMode="adjustResize"
        keyboardBehavior="fillParent"
        keyboardBlurBehavior="restore"
        enablePanDownToClose
        onChange={(index) => setIsSheetOpen(index >= 0)}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
        backgroundStyle={{ backgroundColor: "#01082E", borderRadius: 20 }}
      >
        {error && (
          <View
            style={{
              marginTop: "auto", // pushes it to the bottom
              backgroundColor: "#e74c3c",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginHorizontal: 10,
            }}
          >
            <Text style={{ color: "white", flex: 1 }}>{error}</Text>
            <Text
              onPress={openSettings}
              style={{
                color: "white",
                fontWeight: "bold",
                marginLeft: 12,
              }}
            >
              Open Settings
            </Text>
          </View>
        )}
        <BottomSheetScrollView
          ref={bottomSheetScrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, paddingBottom:180 }}
        >
          <Text style={tw`text-white text-lg font-semibold mb-3`}>
            {selectedEvent?.title}
          </Text>

          {/* Switch To / From */}
          <View style={tw`flex-row items-center justify-between gap-3 my-4`}>
            <Text
              style={tw`text-white ${isToEvent ? "font-bold" : "opacity-50"}`}
            >
              To Event
            </Text>

            <Controller
              control={control}
              name="isToEvent"
              render={({ field: { value, onChange } }) => (
                <Switch
                  value={value}
                  onValueChange={onChange}
                  thumbColor="#0FF1CF"
                  trackColor={{ false: "#1A2755", true: "#1A2755" }}
                />
              )}
            />

            <Text
              style={tw`text-white ${!isToEvent ? "font-bold" : "opacity-50"}`}
            >
              From Event
            </Text>
          </View>

          {/* Conditional fields */}
          {isToEvent ? (
            <View style={tw`mt-5`}>
              <Text style={tw`text-white mb-1`}>Pool Location</Text>

              <CustomView style={tw` mb-5`}>
                <Controller
                  control={control}
                  name="poolLocation"
                  render={({ field: { value, onChange } }) => (
                    <Input
                      style={tw`h-12`}
                      placeholderTextColor="#475569"
                      placeholder="Enter a landmark, busstop, or area"
                      onChangeText={onChange}
                      value={value}
                      onFocus={scrollSheetToBottom}
                    />
                  )}
                />
                {errors.poolLocation && (
                  <Text style={tw`text-red-400 mt-1 text-sm`}>
                    {errors.poolLocation.message}
                  </Text>
                )}
              </CustomView>

              <View style={tw`flex-row items-center justify-between mb-5`}>
                <Controller
                  control={control}
                  name="useCurrentLocation"
                  render={({ field: { value, onChange } }) => (
                    <View
                      style={tw`flex-row items-center justify-between mb-5 gap-5`}
                    >
                      <Text style={tw`text-white`}>
                        Close to current location?
                      </Text>
                      <Switch
                        value={value}
                        onValueChange={onChange}
                        thumbColor={value ? "#0FF1CF" : "#555"}
                      />
                    </View>
                  )}
                />
              </View>
            </View>
          ) : (
            <>
              <Text style={tw`text-white mb-1`}>Pool Destination</Text>

              <CustomView style={tw`flex-1 mb-5`}>
                <Controller
                  control={control}
                  name="poolDestination"
                  render={({ field: { value, onChange } }) => (
                    <Input
                      placeholder="Enter a landmark, busstop, or area"
                      onChangeText={onChange}
                      value={value}
                      onFocus={scrollSheetToBottom}
                    />
                  )}
                />
                {errors.poolDestination && (
                  <Text style={tw`text-red-400 mt-1 text-sm`}>
                    {errors.poolDestination.message}
                  </Text>
                )}
              </CustomView>
            </>
          )}

          <View style={tw`mb-5`}>
            {/* Departure time */}
            <Text style={tw`text-white mb-1`}>Departure Time</Text>
            <Controller
              control={control}
              name="departureTime"
              render={({ field }) => (
                <>
                  <CustomEventInfoSelector
                    title="set time"
                    value={field.value}
                    onPress={() => setPicker("picker")}
                  />
                  <DateTimePickerModal
                    isVisible={!!picker}
                    mode="time"
                    onConfirm={(selected) => {
                      field.onChange(extractTime(selected));
                      setPicker(null);
                    }}
                    onCancel={() => setPicker(null)}
                  />
                </>
              )}
            />
            {errors.departureTime && (
              <Text style={tw`text-red-400 mt-1 text-sm`}>
                {errors.departureTime.message}
              </Text>
            )}
          </View>

          {/* Notes */}
          <Text style={tw`text-white mb-1`}>Notes</Text>

          <CustomView style={tw`flex-1 mb-5`}>
            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <View style={tw`w-full`}>
                  <BottomSheetTextInput
                    style={tw`w-full min-h-[120px] rounded-2xl bg-[#1B2A50]/40 text-white p-4 text-base`}
                    placeholder="Any extra details?"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    maxLength={200}
                    textAlignVertical="top"
                    value={field.value ?? ""}
                    onChangeText={field.onChange}
                    onFocus={scrollSheetToBottom}
                  />
                  <Text style={tw`text-right text-sm text-gray-400 mt-1`}>
                    {(field.value?.length || 0)}/200
                  </Text>
                </View>
              )}
            />
          </CustomView>

          <View style={tw`w-full mb-6 mt-2`}>
            <CustomButton
              onPress={handleSubmit(createCarpool, onError)}
              title={createCarpoolPending ? "Creating carpool" : `Create Carpool`}
              buttonClassName={"bg-[#0FF1CF] w-full border-0"}
              textClassName={`!text-black`}
              showArrow={false}
              disabled={createCarpoolPending}
            />
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
  );
};

export default NewCarpool;

const styles = StyleSheet.create({
  screen: {
    paddingTop: layoutSpacing.pageTop,
  },
  searchBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
});
