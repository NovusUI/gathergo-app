import CustomEventInfoSelector from "@/components/CustomEventInfoSelector";
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import Input from "@/components/inputs/CustomInput1";
import TextArea from "@/components/inputs/CustomTextArea";
import EventCard from "@/components/ui/EventCard";
import { useAuth } from "@/context/AuthContext";
import { useLocationManager } from "@/hooks/useLocationManager";
import { CarpoolFormValues, carpoolSchema } from "@/schemas/carpool";
import { useCreateCarpool } from "@/services/mutations";
import { useForYouEvents, useGetSearchResult } from "@/services/queries";
import { CarpoolForm } from "@/types/carpool";
import { extractTime } from "@/utils/dateTimeHandler";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { SearchIcon } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Switch, Text, TextInput, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const NewCarpool = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [picker, setPicker] = useState<null | string>(null);
  const { coords, requestLocation, error, openSettings } = useLocationManager();
  console.log(error, coords);

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

  const {
    mutateAsync,
    error: createCarpoolError,
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

    const payload: CarpoolForm = {
      origin: data.isToEvent ? data.poolLocation : data.poolDestination,
      departureTime: data.departureTime,
      note: data.notes,
      startPoint:
        data.useCurrentLocation && coords
          ? { lng: coords?.lng, lat: coords?.lat }
          : undefined,
      eventId: selectedEvent.id,
    };

    console.log(payload);

    mutateAsync(payload);
  };

  const onError = (errors: any) => {
    showGlobalError("Error in form");
    console.log(errors);
  };

  return (
    <View className="flex-1 pt-20 pb-10 bg-[#01082E] flex flex-col items-center w-full">
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
              className={`text-white ${
                !isToEvent ? "font-bold" : "opacity-50"
              }`}
            >
              From Event
            </Text>
          </View>

          {/* Conditional fields */}
          {isToEvent ? (
            <View className="mt-5">
              <Text className="text-white mb-1">Pool Location</Text>

              <CustomView className=" mb-5">
                <Controller
                  control={control}
                  name="poolLocation"
                  render={({ field: { value, onChange } }) => (
                    <Input
                      className="h-16"
                      placeholder="Enter a landmark, busstop, or area"
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.poolLocation && (
                  <Text className="text-red-400 mt-1 text-sm">
                    {errors.poolLocation.message}
                  </Text>
                )}
              </CustomView>

              <View className="flex-row items-center justify-between mb-5">
                <Controller
                  control={control}
                  name="useCurrentLocation"
                  render={({ field: { value, onChange } }) => (
                    <View className="flex-row items-center justify-between mb-5 gap-5">
                      <Text className="text-white">
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
              <Text className="text-white mb-1">Pool Destination</Text>

              <CustomView className="flex-1 mb-5">
                <Controller
                  control={control}
                  name="poolDestination"
                  render={({ field: { value, onChange } }) => (
                    <Input
                      placeholder="Enter a landmark, busstop, or area"
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.poolDestination && (
                  <Text className="text-red-400 mt-1 text-sm">
                    {errors.poolDestination.message}
                  </Text>
                )}
              </CustomView>
            </>
          )}

          <View className="mb-5">
            {/* Departure time */}
            <Text className="text-white mb-1">Departure Time</Text>
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
              <Text className="text-red-400 mt-1 text-sm">
                {errors.departureTime.message}
              </Text>
            )}
          </View>

          {/* Notes */}
          <Text className="text-white mb-1">Notes</Text>

          <CustomView className="flex-1 mb-5">
            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <TextArea
                  placeholder="Any extra details?"
                  maxLength={200}
                  className="min-h-[50px]"
                  {...field}
                  value={field.value ?? ""}
                />
              )}
            />
          </CustomView>

          {/* Submit Button */}
        </BottomSheetScrollView>
        <View className="w-screen max-w-[500px] p-5">
          <CustomButton
            onPress={handleSubmit(createCarpool, onError)}
            title={createCarpoolPending ? "Creating carpool" : `Create Carpool`}
            buttonClassName="bg-[#0FF1CF] w-full border-0"
            textClassName="!text-black"
            showArrow={false}
            disabled={createCarpoolPending}
          />
        </View>
      </BottomSheetModal>
    </View>
  );
};

export default NewCarpool;
