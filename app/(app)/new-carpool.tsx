import CustomEventInfoSelector from "@/components/CustomEventInfoSelector";
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import Input from "@/components/inputs/CustomInput1";
import ActivityIndicator from "@/components/ui/AppLoader";
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
import { useLockedRouter } from "@/utils/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosError } from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SearchIcon } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, Resolver, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import tw from "twrnc";

const defaultCarpoolFormValues: CarpoolFormValues = {
  isToEvent: true,
  poolLocation: "",
  useCurrentLocation: false,
  poolDestination: "",
  departureTime: "",
  availableSeats: 3,
  notes: "",
};

const isEventEligibleForCarpool = (event?: {
  endDate?: string | null;
  isPhysicalEvent?: boolean | null;
}) => {
  if (event?.isPhysicalEvent === false) return false;
  if (!event?.endDate) return true;

  const deadline = new Date(event.endDate);
  if (Number.isNaN(deadline.getTime())) return true;

  deadline.setHours(deadline.getHours() + 6);
  return new Date() <= deadline;
};

const NewCarpool = () => {
  const router = useLockedRouter();
  const { eventId: routeEventId, autoOpenEventPicker } = useLocalSearchParams<{
    eventId?: string;
    autoOpenEventPicker?: string;
  }>();
  const [query, setQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [picker, setPicker] = useState<null | string>(null);
  const searchInputRef = useRef<TextInput | null>(null);
  const hasAutoOpenedRef = useRef(false);
  const { coords, requestLocation, error, openSettings } = useLocationManager();

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
  const eligibleResults = results.filter(isEventEligibleForCarpool);

  const { user } = useAuth();
  const { data: eventsSuggestion, isPending: loading } = useForYouEvents(
    user?.id
  );
  const suggestedEvents = (eventsSuggestion?.data ?? []).filter(
    isEventEligibleForCarpool
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CarpoolFormValues>({
    resolver: zodResolver(carpoolSchema) as Resolver<CarpoolFormValues>,
    defaultValues: defaultCarpoolFormValues,
  });

  const isToEvent = watch("isToEvent");
  const useCurrentLocation = watch("useCurrentLocation");

  const closeFormModal = useCallback(() => {
    setPicker(null);
    setSelectedEvent(null);
    setIsFormModalVisible(false);
    reset(defaultCarpoolFormValues);
  }, [reset]);

  const openCarpoolForm = useCallback((event: any) => {
    if (event?.isPhysicalEvent === false) {
      showGlobalError("Carpool is only available for physical events");
      return;
    }

    setSelectedEvent(event);
    setIsFormModalVisible(true);
  }, []);

  useEffect(() => {
    if (!shouldAutoOpen || !preselectedEventId || hasAutoOpenedRef.current) {
      return;
    }

    const resolvedEvent = preselectedEvent?.data;
    if (!resolvedEvent) {
      return;
    }

    hasAutoOpenedRef.current = true;
    openCarpoolForm(resolvedEvent);
  }, [
    openCarpoolForm,
    preselectedEvent?.data,
    preselectedEventId,
    shouldAutoOpen,
  ]);

  const toggleNearby = useCallback(async () => {
    const currentCoords = await requestLocation(true);
    if (!currentCoords) {
      showGlobalError("Enable location in settings to use current location");
      setValue("useCurrentLocation", false);
    }
  }, [requestLocation, setValue]);

  useEffect(() => {
    if (useCurrentLocation && isToEvent) {
      toggleNearby();
    }
  }, [isToEvent, toggleNearby, useCurrentLocation]);

  const carpoolCreationDeadline = useMemo(() => {
    if (!selectedEvent?.endDate) return null;
    const deadline = new Date(selectedEvent.endDate);
    deadline.setHours(deadline.getHours() + 6);
    return deadline;
  }, [selectedEvent?.endDate]);

  const renderEventList = () => {
    if (isPending || loading) {
      return (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator tone="accent" size="large" />
        </View>
      );
    }

    if (query.trim().length > 0) {
      return eligibleResults.length > 0 ? (
        <FlatList
          data={eligibleResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard
              id={item.id}
              title={item.title}
              location={item.location}
              imageUrl={item.imageUrl}
              thumbnailUrl={item.thumbnailUrl}
              registrationType={item.registrationType}
              registrationFee={item.registrationFee ?? undefined}
              donationTarget={item.donationTarget}
              lowestTicketPrice={item.lowestTicketPrice}
              startDate={item.startDate}
              impactTitle={item.impactTitle}
              impactPercentage={item.impactPercentage}
              onPress={() => openCarpoolForm(item)}
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
              <ActivityIndicator tone="accent" style={{ margin: 16 }} />
            ) : null
          }
        />
      ) : (
        <View style={tw`mt-5`}>
          <Text style={tw`text-center text-white`}>
            No physical events found
          </Text>
        </View>
      );
    }

    return suggestedEvents.length ? (
      <View>
        <Text style={tw`text-center text-white`}>Suggestions</Text>
        <FlatList
          data={suggestedEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard
              id={item.id}
              title={item.title}
              location={item.location}
              imageUrl={item.imageUrl}
              thumbnailUrl={item.thumbnailUrl}
              registrationType={item.registrationType}
              registrationFee={item.registrationFee ?? undefined}
              donationTarget={item.donationTarget}
              lowestTicketPrice={item.lowestTicketPrice}
              startDate={item.startDate}
              impactTitle={item.impactTitle}
              impactPercentage={item.impactPercentage}
              onPress={() => openCarpoolForm(item)}
            />
          )}
          contentContainerStyle={{ gap: 16, paddingVertical: 10 }}
        />
      </View>
    ) : (
      <View style={tw`mt-5`}>
        <Text style={tw`text-center text-white`}>
          No physical event suggestions right now
        </Text>
      </View>
    );
  };

  const { mutateAsync, isPending: createCarpoolPending } = useCreateCarpool({
    onSuccess: (data) => {
      closeFormModal();
      const carpoolId =
        data?.data?.carpool?.id || data?.data?.id || data?.data?.carpoolId;
      showGlobalSuccess(data.message || "Carpool created");
      if (carpoolId) {
        router.replace(`/carpool/${carpoolId}`);
      }
    },
    onError: (e) => {
      const error = e as AxiosError<{ message?: string }>;
      showGlobalError(
        error.response?.data?.message ||
          error.message ||
          "Failed to create carpool"
      );
    },
  });

  const createCarpool = async (data: CarpoolFormValues) => {
    if (!selectedEvent?.id) {
      showGlobalError("Select an event first");
      return;
    }

    if (selectedEvent?.isPhysicalEvent === false) {
      showGlobalError("Carpool is only available for physical events");
      return;
    }

    if (carpoolCreationDeadline && new Date() > carpoolCreationDeadline) {
      showGlobalError("You can no longer create a carpool for this event");
      return;
    }

    let startPoint: { lng: number; lat: number } | undefined;
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
      origin: data.isToEvent
        ? data.poolLocation || ""
        : data.poolDestination || "",
      departureTime: data.departureTime,
      note: data.notes || undefined,
      availableSeats: Number(data.availableSeats || 3),
      pricePerSeat: 0,
      startPoint,
      eventId: selectedEvent.id,
    };

    try {
      await mutateAsync(payload);
    } catch (e) {
      console.log("create carpool failed", e);
    }
  };

  const onError = (formErrors: any) => {
    showGlobalError("Error in form");
    console.log(formErrors);
  };

  return (
    <View
      style={[
        tw`flex-1 w-full items-center bg-[#01082E] pb-10`,
        styles.screen,
      ]}
    >
      <View style={tw`flex-1 w-full max-w-[500px] px-5`}>
        <CustomeTopBarNav
          title="Create carpool"
          onClickBack={() => router.replace("/")}
        />

        <Pressable
          onPress={() => searchInputRef.current?.focus()}
          style={[
            tw`flex-row items-center rounded-full bg-[#1A2755]`,
            styles.searchBar,
          ]}
        >
          <SearchIcon size={20} color="white" />
          <TextInput
            ref={searchInputRef}
            placeholder="Search a physical event to carpool"
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            style={tw`ml-3 flex-1 text-white`}
          />
        </Pressable>

        <CustomView style={tw`flex-1 mb-20`}>{renderEventList()}</CustomView>
      </View>

      <Modal
        visible={isFormModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeFormModal}
      >
        <KeyboardAvoidingView
          style={tw`flex-1 justify-end bg-black/55`}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={tw`max-h-[88%] rounded-t-[32px] bg-[#041130] px-5 pb-8 pt-5`}>
            <View style={tw`mb-4 h-1.5 w-14 self-center rounded-full bg-[#2B3C66]`} />

            <View style={tw`flex-row items-start justify-between gap-4`}>
              <View style={tw`flex-1`}>
                <Text style={tw`text-xl font-semibold text-white`}>
                  {selectedEvent?.title || "Create carpool"}
                </Text>
                <Text style={tw`mt-1 text-sm leading-5 text-[#9FB0D8]`}>
                  {selectedEvent?.location ||
                    "Set the ride details riders need before they join."}
                </Text>
              </View>
              <TouchableOpacity onPress={closeFormModal}>
                <Text style={tw`text-sm font-semibold text-[#9FB0D8]`}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={tw`pt-4 pb-6`}
              keyboardShouldPersistTaps="handled"
            >
              {Boolean(error) && (
                <View style={tw`mb-4 rounded-2xl bg-[#5A1818] px-4 py-3`}>
                  <Text style={tw`text-sm leading-5 text-white`}>{error}</Text>
                  <TouchableOpacity onPress={openSettings}>
                    <Text style={tw`mt-2 text-sm font-semibold text-[#FFD1D1]`}>
                      Open settings
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={tw`rounded-2xl bg-[#0A173F] p-4`}>
                <Text style={tw`text-sm font-semibold text-white`}>
                  Make the ride plan easy to trust
                </Text>
                <Text style={tw`mt-2 text-sm leading-5 text-[#A8BAE4]`}>
                  Share where you&apos;re coming from, when you&apos;re leaving,
                  how many seats are open, and any extra note riders should know.
                </Text>
              </View>

              <View style={tw`mt-5 flex-row items-center justify-between gap-3`}>
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

              {isToEvent ? (
                <View style={tw`mt-5`}>
                  <Text style={tw`mb-2 text-white`}>Pool Location</Text>
                  <Controller
                    control={control}
                    name="poolLocation"
                    render={({ field: { value, onChange } }) => (
                      <Input
                        style={tw`h-12`}
                        placeholderTextColor="#475569"
                        placeholder="Enter a landmark, bus stop, or area"
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                  {errors.poolLocation && (
                    <Text style={tw`mt-1 text-sm text-red-400`}>
                      {errors.poolLocation.message}
                    </Text>
                  )}

                  <View style={tw`mt-4 flex-row items-center justify-between gap-5`}>
                    <Text style={tw`flex-1 text-white`}>
                      I am currently where I&apos;ll be pooling from
                    </Text>
                    <Controller
                      control={control}
                      name="useCurrentLocation"
                      render={({ field: { value, onChange } }) => (
                        <Switch
                          value={value}
                          onValueChange={onChange}
                          thumbColor={value ? "#0FF1CF" : "#555"}
                        />
                      )}
                    />
                  </View>
                </View>
              ) : (
                <View style={tw`mt-5`}>
                  <Text style={tw`mb-2 text-white`}>Pool Destination</Text>
                  <Controller
                    control={control}
                    name="poolDestination"
                    render={({ field: { value, onChange } }) => (
                      <Input
                        placeholder="Enter a landmark, bus stop, or area"
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                  {errors.poolDestination && (
                    <Text style={tw`mt-1 text-sm text-red-400`}>
                      {errors.poolDestination.message}
                    </Text>
                  )}
                </View>
              )}

              <View style={tw`mt-5`}>
                <Text style={tw`mb-2 text-white`}>Departure Time</Text>
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
                  <Text style={tw`mt-1 text-sm text-red-400`}>
                    {errors.departureTime.message}
                  </Text>
                )}
              </View>

              <View style={tw`mt-5`}>
                <Text style={tw`mb-2 text-white`}>Available Seats</Text>
                <Controller
                  control={control}
                  name="availableSeats"
                  render={({ field: { value, onChange } }) => (
                    <Input
                      numeric
                      moneyFormat
                      placeholder="How many seats are open?"
                      value={value?.toString()}
                      onChangeText={onChange}
                    />
                  )}
                />
                {errors.availableSeats && (
                  <Text style={tw`mt-1 text-sm text-red-400`}>
                    {errors.availableSeats.message}
                  </Text>
                )}
              </View>

              <View style={tw`mt-5`}>
                <Text style={tw`mb-2 text-white`}>Notes</Text>
                <Controller
                  control={control}
                  name="notes"
                  render={({ field }) => (
                    <View style={tw`w-full`}>
                      <TextInput
                        style={tw`min-h-[120px] rounded-2xl bg-[#0A173F] p-4 text-base text-white`}
                        placeholder="Any extra details?"
                        placeholderTextColor="#9CA3AF"
                        multiline
                        maxLength={200}
                        textAlignVertical="top"
                        value={field.value ?? ""}
                        onChangeText={field.onChange}
                      />
                      <Text style={tw`mt-1 text-right text-sm text-gray-400`}>
                        {(field.value?.length || 0)}/200
                      </Text>
                    </View>
                  )}
                />
              </View>
            </ScrollView>

            <CustomButton
              onPress={handleSubmit(createCarpool, onError)}
              title={createCarpoolPending ? "Creating carpool" : "Create Carpool"}
              buttonClassName="bg-[#0FF1CF] w-full border-0"
              textClassName="!text-black"
              showArrow={false}
              disabled={createCarpoolPending}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
