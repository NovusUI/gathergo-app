import CarpoolRouteFields from "@/components/carpool/CarpoolRouteFields";
import SheetCloseButton from "@/components/buttons/SheetCloseButton";
import CustomEventInfoSelector from "@/components/CustomEventInfoSelector";
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import Input from "@/components/inputs/CustomInput1";
import ActivityIndicator from "@/components/ui/AppLoader";
import EventCard from "@/components/ui/EventCard";
import ImpactPageLoader from "@/components/ui/ImpactPageLoader";
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
import type { EventData } from "@/types/auth";
import { extractTime, isEventPastEnd } from "@/utils/dateTimeHandler";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { useLockedRouter } from "@/utils/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosError } from "axios";
import { useLocalSearchParams } from "expo-router";
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
  startDate?: string | null;
  endDate?: string | null;
  isPhysicalEvent?: boolean | null;
}) => {
  if (event?.isPhysicalEvent === false) return false;
  return !isEventPastEnd(event?.startDate, event?.endDate);
};

type CarpoolEvent = Pick<
  EventData,
  "id" | "title" | "location" | "startDate" | "endDate" | "isPhysicalEvent"
>;

const NewCarpool = () => {
  const router = useLockedRouter();
  const { eventId: routeEventId, autoOpenEventPicker } = useLocalSearchParams<{
    eventId?: string;
    autoOpenEventPicker?: string;
  }>();
  const [query, setQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CarpoolEvent | null>(null);
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

  const openCarpoolForm = useCallback((event: CarpoolEvent) => {
    if (event?.isPhysicalEvent === false) {
      showGlobalError("Carpool is only available for physical events");
      return;
    }

    if (isEventPastEnd(event?.startDate, event?.endDate)) {
      showGlobalError("You can no longer create a carpool for this event");
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

  const selectedEventHasEnded = useMemo(
    () => isEventPastEnd(selectedEvent?.startDate, selectedEvent?.endDate),
    [selectedEvent?.endDate, selectedEvent?.startDate]
  );

  const renderEventList = () => {
    if (isPending || loading) {
      return (
        <ImpactPageLoader
          compact
          title="Mapping ride-ready events"
          message="Finding physical events where people can gather and go together."
          style={tw`flex-1`}
        />
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
              description={item.description}
              location={item.location}
              imageUrl={item.imageUrl}
              thumbnailUrl={item.thumbnailUrl}
              registrationType={item.registrationType}
              registrationFee={item.registrationFee ?? undefined}
              donationTarget={item.donationTarget}
              lowestTicketPrice={item.lowestTicketPrice}
              startDate={item.startDate}
              impactTitle={item.impactTitle}
              impactDescription={item.impactDescription}
              impactSdgGoals={item.impactSdgGoals}
              impactPaths={item.impactPaths}
              impactCommitments={item.impactCommitments}
              impactMapSource={item.impactMapSource}
              tags={item.tags}
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
        <Text style={tw`text-left text-white`}>Suggestions</Text>
        <FlatList
          data={suggestedEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard
              id={item.id}
              title={item.title}
              description={item.description}
              location={item.location}
              imageUrl={item.imageUrl}
              thumbnailUrl={item.thumbnailUrl}
              registrationType={item.registrationType}
              registrationFee={item.registrationFee ?? undefined}
              donationTarget={item.donationTarget}
              lowestTicketPrice={item.lowestTicketPrice}
              startDate={item.startDate}
              impactTitle={item.impactTitle}
              impactDescription={item.impactDescription}
              impactSdgGoals={item.impactSdgGoals}
              impactPaths={item.impactPaths}
              impactCommitments={item.impactCommitments}
              impactMapSource={item.impactMapSource}
              tags={item.tags}
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

    if (selectedEventHasEnded) {
      showGlobalError("You can no longer create a carpool for this event");
      return;
    }

    const eventLocation = selectedEvent.location;
    if (!eventLocation?.trim()) {
      showGlobalError(
        "This event needs a venue before you can create a carpool."
      );
      return;
    }

    let startPoint: { lng: number; lat: number } | undefined;
    if (data.isToEvent && data.useCurrentLocation) {
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
      origin: data.isToEvent ? data.poolLocation : eventLocation,
      destination: data.isToEvent ? eventLocation : data.poolDestination,
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
      style={[tw`flex-1 w-full items-center bg-[#01082E] pb-10`, styles.screen]}
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
            autoCapitalize="none"
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
          <View
            style={tw`max-h-[88%] rounded-t-[32px] bg-[#041130] px-5 pb-8 pt-5`}
          >
            <View
              style={tw`mb-4 h-1.5 w-14 self-center rounded-full bg-[#2B3C66]`}
            />

            <View style={tw`flex-row items-start justify-between gap-4`}>
              <View style={tw`flex-1`}>
                <Text style={tw`text-xl font-semibold text-white`}>
                  {selectedEvent?.title || "Create carpool"}
                </Text>
              </View>
              <SheetCloseButton
                accessibilityLabel="Close carpool sheet"
                onPress={closeFormModal}
              />
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

              <CarpoolRouteFields
                control={control}
                setValue={setValue}
                eventLocation={selectedEvent?.location ?? ""}
              />

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
                        autoCapitalize="none"
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
                        {field.value?.length || 0}/200
                      </Text>
                    </View>
                  )}
                />
              </View>
            </ScrollView>

            <CustomButton
              onPress={handleSubmit(createCarpool, onError)}
              title={
                createCarpoolPending ? "Creating carpool" : "Create Carpool"
              }
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
