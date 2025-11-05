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
import {
  DateTimeFormData,
  EventFormData,
  EventPricing,
  EventTicket,
  eventSchema,
} from "@/schemas/event";
import { useUpdateEvent } from "@/services/mutations";
import { useEventDetails } from "@/services/queries";
import { extractDate } from "@/utils/dateTimeHandler";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { objectToFormData } from "@/utils/utils";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { XIcon } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const EditEvent = () => {
  const { id } = useLocalSearchParams();
  const eventId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const [editingTicket, setEditingTicket] = useState<EventTicket | null>(null);

  const onEdit = (data: EventTicket) => {
    // console.log(data)
    setEditingTicket(data);

    openSheetTicket();
  };

  // *********** State ************ //
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [dateTimeData, setDateTimeData] = useState<DateTimeFormData | null>(
    null
  );
  const [pricingData, setPricingData] = useState<EventPricing | null>(null);

  // *********** Bottom Sheets ************ //
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const bottomSheetTicketRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["10%", "60%", "70%"], []);
  const snapTicket = useMemo(() => ["100%"], []);

  const openSheet = useCallback((section: string) => {
    setActiveSection(section);
    bottomSheetRef.current?.snapToIndex(2);
  }, []);

  const closeSheet = useCallback(() => {
    bottomSheetRef.current?.forceClose();
  }, []);

  const openSheetTicket = useCallback(() => {
    bottomSheetTicketRef.current?.snapToIndex(0);
  }, []);

  const closeSheetTicket = useCallback(() => {
    bottomSheetTicketRef.current?.forceClose();
  }, []);

  // *********** Fetch Event Details ************ //
  const { data: eventData, isPending, isError } = useEventDetails(eventId);

  // *********** Form Hook ************ //
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    clearErrors,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      imgUrl: undefined,
      eventName: "",
      description: "",
      startDate: undefined,
      endDate: undefined,
      startTime: undefined,
      endTime: undefined,
      location: "",
      tags: [],
      registrationType: undefined,
      tickets: [],
      isRecurring: false,
      registrationAttendees: undefined,
      registrationFee: undefined,
      repeat: "NONE",
      endRepeat: undefined,
    },
  });

  // *********** Populate Form When Data Loads ************ //
  useEffect(() => {
    if (eventData?.data) {
      const e = eventData.data;
      console.log(e);
      reset({
        imgUrl: undefined,
        eventName: e.title || "",
        description: e.description || "",
        startDate: e.startDate ? new Date(e.startDate) : undefined,
        endDate: e.endDate ? new Date(e.endDate) : undefined,
        startTime: e.startDate?.split("T")[1]?.slice(0, 5) || "",
        endTime: e.endDate?.split("T")[1]?.slice(0, 5) || "",
        location: e.location || "",
        tags: e.tags || [],
        registrationType: e.registrationType || undefined,
        tickets: (e.eventTickets || []).map((ticket) => ({
          ...ticket,
          limited: ticket.quantity === 1000000 ? true : false,
          paid: ticket.price ? true : false,
          isVisible: ticket.isVisible || true,
          isNew: false,
          updatedPrice: ticket.updatedPrice || undefined,
        })),
        registrationAttendees: e.registrationAttendees || undefined,
        registrationFee: e.registrationFee || undefined,
        isRecurring: e.reoccurring !== "NONE",
        repeat: e.reoccurring || "NONE",
        endRepeat: e.endRepeat ? new Date(e.endRepeat) : undefined,
      });

      setDateTimeData({
        startDate: new Date(e.startDate),
        endDate: new Date(e.endDate),
        startTime: e.startDate?.split("T")[1]?.slice(0, 5),
        endTime: e.endDate?.split("T")[1]?.slice(0, 5),
        isRecurring: e.reoccurring !== "NONE",
        repeat: e.reoccurring || "NONE",
        endRepeat: e.endRepeat ? new Date(e.endRepeat) : undefined,
      });

      setPricingData({
        registrationType: e.registrationType,
        registrationFee: e.registrationFee ? e.registrationFee : undefined,
        registrationAttendees:
          !e.registrationAttendees && e.registrationAttendees !== 0
            ? undefined
            : e.registrationAttendees,
        tickets: (e.eventTickets || []).map((ticket) => ({
          ...ticket,
          limited: ticket.quantity === 1000000 ? true : false,
          paid: ticket.price ? true : false,
          isVisible: ticket.isVisible || true,
          isNew: false,
          updatedPrice: ticket.updatedPrice || undefined,
        })),

        paid:
          e.registrationType === "registration" &&
          e.registrationFee &&
          e.registrationFee > 0
            ? true
            : false,
        limited:
          e.registrationType === "registration" &&
          e.registrationAttendees &&
          e.registrationAttendees === 100000
            ? false
            : true,
      });
    }
  }, [eventData, reset]);

  // *********** Mutation ************ //
  const { mutateAsync: updateEvent, isPending: isUpdatePending } =
    useUpdateEvent(eventId, {
      onSuccess: () => {
        showGlobalSuccess("Event updated");
        router.replace(`/event/${eventId}`);
      },
      onError: (e) => {
        console.log(e);
        showGlobalError("Event update failed");
      },
    });

  // *********** Handlers ************ //
  const handleDateTimeSave = (data: DateTimeFormData) => {
    setDateTimeData(data);
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
    setValue("tickets", data.tickets);
    clearErrors("registrationType");
    closeSheet();
  };

  const renderSheetContent = () => {
    switch (activeSection) {
      case "Date and Time":
        return (
          <DateAndTime
            editMode
            initialData={dateTimeData}
            onSave={handleDateTimeSave}
          />
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
            editMode
            onEdit={onEdit}
            initialData={pricingData}
            onSave={handlePricingSave}
            tickets={watch("tickets") || []}
            createTicket={() => {
              setEditingTicket(null);
              openSheetTicket();
            }}
            setTicket={(updated: EventTicket[]) => setValue("tickets", updated)}
          />
        );
    }
  };

  const onSubmit = async (data: EventFormData) => {
    const {
      eventName,
      startDate,
      endDate,
      startTime,
      endTime,
      repeat,
      endRepeat,
      registrationType,
      registrationFee,
      registrationAttendees,
      tickets,
      imgUrl,
      isRecurring,
      ...rest
    } = data;

    const correctedData = {
      ...rest,
      title: eventName,
      reoccurring: repeat,
      startDate: `${extractDate(startDate)}T${startTime}:00Z`,
      endDate: `${extractDate(endDate)}T${endTime}:00Z`,
      ...(endRepeat ? { endRepeat: extractDate(endRepeat) } : {}),
      registrationType,
      ...(registrationType === "registration"
        ? {
            registrationAttendees: registrationAttendees || 100000,
            registrationFee: registrationFee || 0,
          }
        : {}),
      ...(registrationType === "ticket"
        ? {
            tickets: tickets?.map(({ paid, limited, isNew, ...rest }) =>
              JSON.stringify(rest)
            ),
          }
        : {}),
    };

    //const refinedData = convertUndefinedToNull(correctedData);
    const formData = objectToFormData(correctedData);

    if (imgUrl) {
      formData.append("imageFile", {
        uri: imgUrl,
        name: "eventImg.jpg",
        type: "image/jpeg",
      } as any);
    }

    console.log(formData);

    await updateEvent(formData);
  };

  // *********** Loading & Error States ************ //
  if (isPending) {
    return (
      <View className="flex-1 pt-10 bg-[#01082E] items-center justify-center">
        <Text className="text-white">Loading event details...</Text>
      </View>
    );
  }

  if (isError || !eventData) {
    return (
      <View className="flex-1 bg-[#01082E] items-center justify-center px-5">
        <Text className="text-white text-xl mt-4">
          Event not found or error loading
        </Text>
        <CustomButton
          title="Go Back"
          onPress={() => router.replace("/")}
          buttonClassName="bg-[#0FF1CF] mt-6 w-full max-w-[300px]"
          textClassName="!text-black"
        />
      </View>
    );
  }

  const startDateWatch = watch("startDate");
  const locationWatch = watch("location");
  const registrationTypeWatch = watch("registrationType");

  return (
    <View className="flex-1 pt-20 pb-5 bg-[#01082E] flex flex-col items-center w-full">
      <View className="flex-1 w-full max-w-[500px]">
        <CustomView className="px-5">
          <CustomeTopBarNav
            title="Edit Event"
            onClickBack={() => router.replace(`/event/${eventId}`)}
          />
        </CustomView>

        <ScrollView className="w-full max-w-500">
          {/* Cover Image */}
          <CustomView className="px-5">
            <Controller
              name="imgUrl"
              control={control}
              render={({ field: { value, onChange } }) => (
                <View>
                  <CoverImagePicker
                    value={value || eventData.data.imageUrl}
                    onChange={onChange}
                  />
                  {errors.imgUrl && (
                    <Text className="text-red-500">
                      {errors.imgUrl.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </CustomView>

          {/* Event Name */}
          <CustomView className="px-5">
            <CustomView className="gap-2">
              <FormLabel text="event name" />
              <Controller
                name="eventName"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Input
                    placeholder="Event name"
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.eventName && (
                <Text className="text-red-500">{errors.eventName.message}</Text>
              )}
            </CustomView>

            {/* Event Description */}
            <CustomView className="gap-2">
              <FormLabel text="event description" />
              <Controller
                name="description"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <TextArea
                    onChange={onChange}
                    value={value}
                    placeholder="Event description"
                    className="!bg-[#1B2A50]/40"
                  />
                )}
              />
              {errors.description && (
                <Text className="text-red-500">
                  {errors.description.message}
                </Text>
              )}
            </CustomView>
          </CustomView>

          <CustomView className="!bg-[#1B2A50]/40 h-2" />

          {/* Event Info */}
          <CustomView className="px-5">
            <FormLabel text="event information" />
            <TouchableOpacity
              className="bg-[#101C45] p-5 my-2 rounded-xl flex flex-row justify-between items-center"
              onPress={() => openSheet("Date and Time")}
            >
              <Text className="text-white text-base">Date and Time</Text>
              {startDateWatch && <Text className="text-[#0FF1CF]">✓</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-[#101C45] p-5 my-2 rounded-xl flex flex-row justify-between items-center"
              onPress={() => openSheet("Location")}
            >
              <Text className="text-white text-base">Location</Text>
              {locationWatch && <Text className="text-[#0FF1CF]">✓</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-[#101C45] p-5 my-2 rounded-xl flex flex-row justify-between items-center"
              onPress={() => openSheet("Pricing")}
            >
              <Text className="text-white text-base">Pricing</Text>
              {registrationTypeWatch && (
                <Text className="text-[#0FF1CF]">✓</Text>
              )}
            </TouchableOpacity>
          </CustomView>

          <CustomView className="!bg-[#1B2A50]/40 h-2 w-full" />

          {/* Tags */}
          <CustomView className="px-5">
            <FormLabel text="tag" />
            <Controller
              name="tags"
              control={control}
              render={({ field: { value, onChange } }) => (
                <EventTags selectedTags={value} onChange={onChange} />
              )}
            />
          </CustomView>

          <CustomView className="flex items-center px-5 mt-5">
            <CustomButton
              disabled={isUpdatePending}
              onPress={handleSubmit(onSubmit)}
              title={isUpdatePending ? "updating..." : "Update Event"}
              showArrow={false}
              buttonClassName="bg-[#0FF1CF] w-full !border-none"
              textClassName="!text-black"
            />
          </CustomView>
        </ScrollView>
      </View>

      {/* Main Bottom Sheet */}
      <BottomSheet
        index={-1}
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={0}
            appearsOnIndex={1}
          />
        )}
        backgroundStyle={{ backgroundColor: "#01082E" }}
      >
        <BottomSheetScrollView className="p-5">
          <View className="flex flex-row justify-between items-center">
            <Text className="text-white">{activeSection}</Text>
            <TouchableOpacity
              className="rounded-full bg-[#1B2A50] p-2"
              onPress={closeSheet}
            >
              <XIcon size={15} color="white" />
            </TouchableOpacity>
          </View>
          <View className="py-5">{renderSheetContent()}</View>
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Ticket Creation Sheet */}
      <BottomSheet
        index={-1}
        ref={bottomSheetTicketRef}
        snapPoints={snapTicket}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={0}
            appearsOnIndex={1}
          />
        )}
        backgroundStyle={{ backgroundColor: "#01082E" }}
      >
        <BottomSheetScrollView className="p-5">
          <View className="flex flex-row justify-between items-center">
            <Text className="text-white">Create Ticket</Text>
            <TouchableOpacity
              className="rounded-full bg-[#1B2A50] p-2"
              onPress={closeSheetTicket}
            >
              <XIcon size={15} color="white" />
            </TouchableOpacity>
          </View>
          <View className="py-5">
            <CreateTicket
              editingTicket={editingTicket}
              close={closeSheetTicket}
              tickets={watch("tickets") || []}
              setTicket={(updated: EventTicket[]) =>
                setValue("tickets", updated)
              }
              editMode
            />
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
};

export default EditEvent;
