import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CoverImagePicker from "@/components/EventImagePicket";
import EventTags from "@/components/EventTags";
import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import CreateTicket from "@/components/eventInfo/CreateTicket";
import DateAndTime from "@/components/eventInfo/DateAndTime";
import Location from "@/components/eventInfo/Location";
import Pricing from "@/components/eventInfo/Pricing";
import Input from "@/components/inputs/CustomInput1";
import TextArea from "@/components/inputs/CustomTextArea";
import FormLabel from "@/components/labels/FormLabel";
import { spacing } from "@/constants/spacing";
import {
  DateTimeFormData,
  EventFormData,
  EventPricing,
  EventTicket,
  eventSchema,
} from "@/schemas/event";
import { useCreateEvent } from "@/services/mutations";
import { extractDate } from "@/utils/dateTimeHandler";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { CHACHE_KEYS } from "@/utils/keys";
import { getItem, removeItem, saveItem } from "@/utils/storage";
import { convertUndefinedToNull, objectToFormData } from "@/utils/utils";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { CheckCheck, XIcon } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import tw from "twrnc";

const NewEvent = () => {
  const router = useRouter();

  //*********************************** bottom sheet ***********************************//
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const bottomSheetTicketRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["10%", "60%", "70%"], []);
  const snapTicket = useMemo(() => ["100%"], []);

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [dateTimeData, setDateTimeData] = useState<DateTimeFormData | null>(
    null
  );
  const [pricingData, setPricingData] = useState<EventPricing | null>(null);

  const [editingTicket, setEditingTicket] = useState<EventTicket | null>(null);

  const onEdit = (data: EventTicket) => {
    setEditingTicket(data);

    openSheetTicket();
  };

  const openSheet = useCallback((section: string) => {
    setActiveSection(section);
    bottomSheetRef.current?.snapToIndex(2);
  }, []);

  const openSheetTicket = useCallback(() => {
    bottomSheetTicketRef.current?.snapToIndex(0);
  }, []);

  const closeSheet = useCallback(() => {
    bottomSheetRef.current?.forceClose();
  }, []);

  const closeSheetTicket = useCallback(() => {
    bottomSheetTicketRef.current?.forceClose();
  }, []);

  const handleDateTimeSave = (data: DateTimeFormData) => {
    setDateTimeData(data);

    // Update the main form with date/time data
    setValue("startDate", data.startDate);
    setValue("endDate", data.endDate);
    setValue("startTime", data.startTime);
    setValue("endTime", data.endTime);
    setValue("isRecurring", data.isRecurring);
    setValue("repeat", data.repeat);
    setValue("endRepeat", data.endRepeat);

    clearErrors(["startDate"]);

    closeSheet();
  };

  const handlePricingSave = (data: EventPricing) => {
    setPricingData(data);
    setValue("registrationType", data.registrationType);
    setValue("registrationAttendees", data.registrationAttendees);
    setValue("registrationFee", data.registrationFee);
    setValue("donationTarget", data.donationTarget);
    // setValue("tickets",data.tickets)
    closeSheet();
    clearErrors("registrationType");
  };

  const renderSheetContent = () => {
    switch (activeSection) {
      case "Date and Time":
        return (
          <DateAndTime initialData={dateTimeData} onSave={handleDateTimeSave} />
        );
      case "Location":
        return (
          <Controller
            name="location"
            control={control}
            render={({ field: { value, onChange } }) => (
              <View>
                <Location
                  onSave={(data) => {
                    onChange(data);
                    closeSheet();
                  }}
                  value={value}
                />
              </View>
            )}
          />
        );
      default:
        return (
          <Pricing
            onEdit={onEdit}
            initialData={pricingData}
            onSave={handlePricingSave}
            setTicket={(updated: EventTicket[]) => setValue("tickets", updated)}
            tickets={watch("tickets") || []}
            createTicket={() => {
              setEditingTicket(null);
              openSheetTicket();
            }}
          />
        );
    }
  };

  //*********************************** bottom sheet ***********************************//

  //*********************************** react form hook ***********************************//

  //*********************************** event form ***********************************//

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    clearErrors,
    reset,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      imgUrl: undefined,
      eventName: "",
      repeat: "NONE",
      startDate: undefined,
      endDate: undefined, // +1 hour
      endRepeat: undefined,
      location: "",
      tags: [],
      registrationType: undefined,
      description: "",
      isRecurring: false,
      tickets: [],
      registrationAttendees: undefined,
      registrationFee: undefined,
      donationTarget: undefined,
    },
  });

  const startDate = watch("startDate");
  const location = watch("location");
  const registrationType = watch("registrationType");

  useEffect(() => {
    (async () => {
      const cached = await getItem(CHACHE_KEYS.eventFormKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          reset(parsed); // restore form state
        } catch (e) {
          console.log("Error parsing cached event form:", e);
        }
      }
    })();
  }, [reset]);

  useEffect(() => {
    const subscription = watch(async (value) => {
      try {
        await saveItem(CHACHE_KEYS.eventFormKey, JSON.stringify(value));
      } catch (e) {
        console.log("Error saving event form progress:", e);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const onError = (errors: any) => {
    showGlobalError("Error in form");
    console.log(errors);
  };

  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  const { mutateAsync, isPending } = useCreateEvent({
    onSuccess: async (data) => {
      showGlobalSuccess(
        data.data.isImageProcessing
          ? "Event created! Image uploading in background..."
          : "Event created successfully!"
      );
      await removeItem(CHACHE_KEYS.eventFormKey);
      router.replace(`/event/${data.data.id}`);
    },
    onError: (e) => {
      console.error(e);

      showGlobalError("Event Creation Failed");
    },
  });

  // const createEventWithFetch = async (formData: FormData) => {
  //   try {
  //     const result = await uploadClient.upload('/events/create', formData);
  //     return result;
  //   } catch (error) {
  //     throw error;
  //   }
  // };

  const onSubmit = async (data: EventFormData) => {
    const {
      repeat,
      imgUrl,
      eventName,
      startTime,
      endTime,
      isRecurring,
      registrationType,
      registrationFee,
      registrationAttendees,
      startDate,
      endDate,
      endRepeat,
      tickets,
      donationTarget,
      ...rest
    } = data;

    tickets?.map(({ paid, limited, isNew, ...rest }) => ({ rest }));

    const correctedData = {
      ...rest,
      title: eventName,
      reoccurring: repeat,
      ...(registrationType === "registration"
        ? registrationType === "registration" && !registrationAttendees
          ? { registrationAttendees: 100000 }
          : { registrationAttendees }
        : {}),
      ...(registrationType === "registration"
        ? registrationType === "registration" && !registrationFee
          ? { registrationFee: 0 }
          : { registrationFee }
        : {}),
      ...(registrationType === "donation" && donationTarget
        ? { donationTarget }
        : {}),
      registrationType,
      startDate: `${extractDate(startDate)}T${startTime}:00Z`,
      endDate: `${extractDate(endDate)}T${endTime}:00Z`,
      ...(endRepeat ? { endRepeat: extractDate(endRepeat) } : {}),
      ...(registrationType === "ticket"
        ? {
            tickets: tickets?.map(({ paid, limited, isNew, ...rest }) =>
              JSON.stringify({ ...rest })
            ),
          }
        : {}),
    };

    console.log(correctedData);
    const refinedData = convertUndefinedToNull(correctedData);
    const formData = objectToFormData(refinedData);
    if (imgUrl) {
      formData.append("imageFile", {
        uri: imgUrl,
        name: "eventImg",
        type: "image/jpeg",
      } as any);
    }

    try {
      await mutateAsync(formData);
    } catch (error) {
      // Error is already handled in onError callback
      console.error("Submit error:", error);
    }
    // try {
    //   const result = await createEventWithFetch(formData);
    //   showGlobalSuccess("Event created");
    //   await removeItem(CHACHE_KEYS.eventFormKey);
    //   router.replace(`/event/${result.data.id}`);
    // } catch (error) {
    //   console.error(error);
    //   showGlobalError("Event Creation Failed");
    // }
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-[#01082E]`}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
    >
      <View
        style={[
          tw`flex-1 pb-10 bg-[#01082E] items-center w-full`,
          { paddingTop: spacing.xxl },
        ]}
      >
      <View style={tw`flex-1 w-full max-w-[500px]`}>
        <CustomView style={tw`px-5`}>
          <CustomeTopBarNav
            title="New Event"
            onClickBack={() => router.replace("/")}
          />
        </CustomView>
        <ScrollView style={tw`w-full`} keyboardShouldPersistTaps="handled">
          <CustomView style={tw`px-5`}>
            <Controller
              name="imgUrl"
              control={control}
              render={({ field: { value, onChange } }) => (
                <View>
                  <CoverImagePicker value={value || null} onChange={onChange} />
                  {errors.imgUrl && (
                    <Text style={tw`text-red-500`}>
                      {errors.imgUrl.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </CustomView>

          <CustomView style={tw`px-5`}>
            <CustomView style={tw`gap-2`}>
              <FormLabel text="event name" />
              <Controller
                name="eventName"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <View>
                    <Input
                      placeholder="Event name"
                      onChangeText={onChange}
                      value={value}
                    />
                    {errors.eventName && (
                      <Text style={tw`text-red-500`}>
                        {errors.eventName.message}
                      </Text>
                    )}
                  </View>
                )}
              />
            </CustomView>

            <CustomView style={tw`gap-2`}>
              <FormLabel text="event description" />
              <Controller
                name="description"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <View>
                    <TextArea
                      onChange={onChange}
                      value={value}
                      placeholder="Event description"
                      className="!bg-[#1B2A50]/40"
                    />
                    {errors.description && (
                      <Text style={tw`text-red-500`}>
                        {errors.description.message}
                      </Text>
                    )}
                  </View>
                )}
              />
            </CustomView>
          </CustomView>

          <CustomView style={tw`bg-[#1B2A50]/40 h-2`} />

          {/* Event Information */}
          <CustomView style={tw`px-5`}>
            <CustomView>
              <FormLabel text="event information" />
            </CustomView>

            <TouchableOpacity
              style={tw`bg-[#101C45] p-5 my-2 rounded-xl flex-row justify-between items-center`}
              onPress={() => openSheet("Date and Time")}
            >
              <View>
                <Text style={tw`text-white text-base`}>Date and Time</Text>
                {errors.startDate && (
                  <Text style={tw`text-red-500`}>
                    {errors.startDate.message}
                  </Text>
                )}
              </View>
              {!errors.startDate && startDate && <CheckCheck color="#0FF1CF" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`bg-[#101C45] p-5 my-2 rounded-xl flex-row justify-between items-center`}
              onPress={() => openSheet("Location")}
            >
              <View>
                <Text style={tw`text-white text-base`}>Location</Text>
                {errors.location && (
                  <Text style={tw`text-red-500`}>
                    {errors.location.message}
                  </Text>
                )}
              </View>
              {!errors.location && location && <CheckCheck color="#0FF1CF" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`bg-[#101C45] p-5 my-2 rounded-xl flex-row justify-between items-center`}
              onPress={() => openSheet("Pricing")}
            >
              <View>
                <Text style={tw`text-white text-base`}>Pricing</Text>
                {errors.registrationType && (
                  <Text style={tw`text-red-500`}>
                    {errors.registrationType.message}
                  </Text>
                )}
              </View>
              {!errors.registrationType && registrationType && (
                <CheckCheck color="#0FF1CF" />
              )}
            </TouchableOpacity>
          </CustomView>

          <CustomView style={tw`bg-[#1B2A50]/40 h-2 w-full`} />

          {/* Tags */}
          <CustomView style={tw`px-5`}>
            <CustomView>
              <FormLabel text="tag" />
            </CustomView>
            <Controller
              name="tags"
              control={control}
              render={({ field: { value, onChange } }) => (
                <View>
                  <EventTags selectedTags={value} onChange={onChange} />
                  {errors.tags && (
                    <Text style={tw`text-red-500`}>{errors.tags.message}</Text>
                  )}
                </View>
              )}
            />
          </CustomView>

          <CustomView style={tw`bg-[#1B2A50]/40 h-2 w-full`} />

          <CustomView style={tw`items-center px-5`}>
            <CustomButton
              disabled={isPending}
              onPress={handleSubmit(onSubmit, onError)}
              title={isPending ? "publishing.." : "publish event"}
              showArrow={false}
              buttonClassName="bg-[#0FF1CF] w-full !border-none"
              textClassName="!text-black"
            />
          </CustomView>
        </ScrollView>
        <BottomSheet
          index={-1}
          ref={bottomSheetRef}
          onChange={handleSheetChanges}
          snapPoints={snapPoints}
          android_keyboardInputMode="adjustResize"
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          enablePanDownToClose={true}
          backdropComponent={(props) => (
            <BottomSheetBackdrop
              {...props}
              disappearsOnIndex={0}
              appearsOnIndex={1}
            />
          )}
          backgroundStyle={{ backgroundColor: "#01082E" }}
        >
          <BottomSheetScrollView
            style={tw`p-5`}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            <View style={tw`flex flex-row justify-between items-center`}>
              <Text style={tw`text-white`}>{activeSection}</Text>

              <TouchableOpacity
                style={tw`rounded-full bg-[#1B2A50] p-2`}
                onPress={() => closeSheet()}
              >
                <XIcon size={15} color="white" />
              </TouchableOpacity>
            </View>

            <View style={tw`py-5`}>{renderSheetContent()}</View>
          </BottomSheetScrollView>
        </BottomSheet>

        <BottomSheet
          index={-1}
          ref={bottomSheetTicketRef}
          snapPoints={snapTicket}
          android_keyboardInputMode="adjustResize"
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          enablePanDownToClose={true}
          backdropComponent={(props) => (
            <BottomSheetBackdrop
              {...props}
              disappearsOnIndex={0}
              appearsOnIndex={1}
            />
          )}
          backgroundStyle={{ backgroundColor: "#01082E" }}
        >
          <BottomSheetScrollView
            style={tw`p-5`}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            <View style={tw`flex flex-row justify-between items-center`}>
              <Text style={tw`text-white`}>create ticket</Text>

              <TouchableOpacity
                style={tw`rounded-full bg-[#1B2A50] p-2`}
                onPress={() => closeSheetTicket()}
              >
                <XIcon size={15} color="white" />
              </TouchableOpacity>
            </View>

            <View style={tw`py-5`}>
              <CreateTicket
                editingTicket={editingTicket}
                close={closeSheetTicket}
                tickets={watch("tickets") || []}
                setTicket={(updated: EventTicket[]) =>
                  setValue("tickets", updated)
                }
              />
            </View>
          </BottomSheetScrollView>
        </BottomSheet>
      </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default NewEvent;
