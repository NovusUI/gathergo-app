import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CoverImagePicker from "@/components/EventImagePicket";
import EventTags from "@/components/EventTags";
import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import CreateTicket from "@/components/eventInfo/CreateTicket";
import DateAndTime from "@/components/eventInfo/DateAndTime";
import EventLinks from "@/components/eventInfo/EventLinks";
import ImpactSelector from "@/components/eventInfo/ImpactSelector";
import Location from "@/components/eventInfo/Location";
import Pricing from "@/components/eventInfo/Pricing";
import Input from "@/components/inputs/CustomInput1";
import TextArea from "@/components/inputs/CustomTextArea";
import FormLabel from "@/components/labels/FormLabel";
import {
  buildImpactDescription,
  DEFAULT_IMPACT_CAUSE,
  DEFAULT_IMPACT_PERCENTAGE,
  mergeImpactTags,
  resolveImpactPercentage,
} from "@/constants/impact";
import { normalizeEventLink } from "@/constants/eventLinks";
import { spacing } from "@/constants/spacing";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useLockedRouter } from "@/utils/navigation";
import { useCallback, useEffect, useState } from "react";
import { Controller, Resolver, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";

const normalizeEventLinks = (links?: string[]) =>
  (links || [])
    .map((link) => normalizeEventLink(link))
    .filter(Boolean)
    .slice(0, 5);

const EditEvent = () => {
  const { id } = useLocalSearchParams();
  const eventId = Array.isArray(id) ? id[0] : id;
  const router = useLockedRouter();

  // *********** State ************ //
  const [editingTicket, setEditingTicket] = useState<EventTicket | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [dateTimeData, setDateTimeData] = useState<DateTimeFormData | null>(
    null
  );
  const [pricingData, setPricingData] = useState<EventPricing | null>(null);
  const [isTicketSheetOpen, setIsTicketSheetOpen] = useState(false);

  const openSheet = useCallback((section: string) => {
    setActiveSection(section);
  }, []);

  const closeSheet = useCallback(() => {
    setActiveSection(null);
  }, []);

  const openSheetTicket = useCallback(() => {
    setIsTicketSheetOpen(true);
  }, []);

  const closeSheetTicket = useCallback(() => {
    setIsTicketSheetOpen(false);
    setEditingTicket(null);
  }, []);

  // *********** Fetch Event Details ************ //
  const { data: eventData, isPending, isError } = useEventDetails(eventId);
  const lockedRegistrationType = eventData?.data?.registrationType;
  const isDonationEvent = lockedRegistrationType === "donation";
  const pricingSectionTitle = isDonationEvent ? "Donation setup" : "Pricing";

  const onEdit = (data: EventTicket) => {
    setEditingTicket(data);
    openSheetTicket();
  };

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
    resolver: zodResolver(eventSchema) as Resolver<EventFormData>,
    defaultValues: {
      imgUrl: undefined,
      eventName: "",
      description: "",
      impactTitle: DEFAULT_IMPACT_CAUSE.title,
      impactDescription: DEFAULT_IMPACT_CAUSE.description,
      impactPercentage: DEFAULT_IMPACT_PERCENTAGE,
      startDate: undefined,
      endDate: undefined,
      startTime: undefined,
      endTime: undefined,
      isPhysicalEvent: true,
      location: "",
      links: [],
      tags: [],
      registrationType: undefined,
      tickets: [],
      isRecurring: false,
      registrationAttendees: undefined,
      registrationFee: undefined,
      donationTarget: undefined,
      repeat: "NONE",
      endRepeat: undefined,
    },
  });

  // *********** Populate Form When Data Loads ************ //
  useEffect(() => {
    if (eventData?.data) {
      const e = eventData.data;
      reset({
        imgUrl: undefined,
        eventName: e.title || "",
        description: e.description || "",
        impactTitle: e.impactTitle || DEFAULT_IMPACT_CAUSE.title,
        impactDescription:
          e.impactDescription ||
          buildImpactDescription(e.impactTitle, e.impactDescription),
        impactPercentage:
          e.impactPercentage ||
          resolveImpactPercentage(e.registrationType, e.impactPercentage),
        startDate: e.startDate ? new Date(e.startDate) : undefined,
        endDate: e.endDate ? new Date(e.endDate) : undefined,
        startTime: e.startDate?.split("T")[1]?.slice(0, 5) || "",
        endTime: e.endDate?.split("T")[1]?.slice(0, 5) || "",
        isPhysicalEvent: e.isPhysicalEvent ?? true,
        location: e.location || "",
        links: e.links || [],
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
        donationTarget: e.donationTarget || undefined,
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
        donationTarget: e.donationTarget ? e.donationTarget : undefined,
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
    setValue("repeat", data.repeat ?? "NONE");
    setValue("endRepeat", data.endRepeat);
    clearErrors(["startDate"]);
    closeSheet();
  };

  const handlePricingSave = (data: EventPricing) => {
    const nextPricingData = {
      ...data,
      registrationType: lockedRegistrationType ?? data.registrationType,
    };

    setPricingData(nextPricingData);
    setValue("registrationType", nextPricingData.registrationType);
    setValue("registrationAttendees", nextPricingData.registrationAttendees);
    setValue("registrationFee", nextPricingData.registrationFee);
    setValue("donationTarget", nextPricingData.donationTarget);
    setValue("tickets", nextPricingData.tickets);
    if (nextPricingData.registrationType === "donation") {
      setValue("impactPercentage", 100);
    }
    clearErrors(
      nextPricingData.registrationType === "donation"
        ? ["registrationType", "donationTarget"]
        : "registrationType"
    );
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
            allowRecurring={false}
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
                  isPhysicalEvent={watch("isPhysicalEvent")}
                  onSave={({ location, isPhysicalEvent }) => {
                    onChange(location);
                    setValue("isPhysicalEvent", isPhysicalEvent, {
                      shouldValidate: true,
                    });
                    closeSheet();
                  }}
                  value={value}
                />
              </View>
            )}
          />
        );
      case "Pricing":
        return (
          <Pricing
            editMode
            onEdit={onEdit}
            initialData={pricingData}
            onSave={handlePricingSave}
            tickets={watch("tickets") || []}
            allowedRegistrationTypes={
              lockedRegistrationType ? [lockedRegistrationType] : undefined
            }
            createTicket={() => {
              setEditingTicket(null);
              openSheetTicket();
            }}
            setTicket={(updated: EventTicket[]) => setValue("tickets", updated)}
          />
        );
      default:
        return null;
    }
  };

  const activeSectionTitle =
    activeSection === "Pricing" ? pricingSectionTitle : activeSection;

  const activeSectionDescription =
    activeSection === "Date and Time"
      ? "Set the event window clearly so people know exactly when it starts and ends."
      : activeSection === "Location"
      ? "Decide whether the event has a physical meetup and where it happens."
      : activeSection === "Pricing"
      ? isDonationEvent
        ? "Set the donation goal and how people support this cause."
        : "Choose how people join and manage the pricing or ticket tiers."
      : "";

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
      donationTarget,
      links,
      impactTitle,
      impactDescription,
      impactPercentage,
      tickets,
      imgUrl,
      isRecurring,
      isPhysicalEvent,
      ...rest
    } = data;
    const resolvedRegistrationType =
      lockedRegistrationType ?? registrationType;
    const impactAwareTags = mergeImpactTags(rest.tags, impactTitle);
    const resolvedImpactPercentage = resolveImpactPercentage(
      resolvedRegistrationType,
      Number(impactPercentage || DEFAULT_IMPACT_PERCENTAGE)
    );

    const correctedData = {
      ...rest,
      links: normalizeEventLinks(links),
      tags: impactAwareTags,
      title: eventName,
      impactTitle,
      impactDescription: buildImpactDescription(impactTitle, impactDescription),
      impactPercentage: resolvedImpactPercentage,
      reoccurring: repeat,
      isPhysicalEvent,
      location: isPhysicalEvent ? rest.location : "",
      startDate: `${extractDate(startDate)}T${startTime}:00Z`,
      endDate: `${extractDate(endDate)}T${endTime}:00Z`,
      ...(endRepeat ? { endRepeat: extractDate(endRepeat) } : {}),
      registrationType: resolvedRegistrationType,
      ...(resolvedRegistrationType === "registration"
        ? {
            registrationAttendees: registrationAttendees || 100000,
            registrationFee: registrationFee || 0,
          }
        : {}),
      ...(resolvedRegistrationType === "donation"
        ? {
            donationTarget: donationTarget || 0,
          }
        : {}),
      ...(resolvedRegistrationType === "ticket"
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

    await updateEvent(formData);
  };

  // *********** Loading & Error States ************ //
  if (isPending) {
    return (
      <View
        style={[
          tw`flex-1 bg-[#01082E] items-center justify-center`,
          { paddingTop: spacing.xxl },
        ]}
      >
        <Text style={tw`text-white`}>Loading event details...</Text>
      </View>
    );
  }

  if (isError || !eventData) {
    return (
      <View style={tw`flex-1 bg-[#01082E] items-center justify-center px-5`}>
        <Text style={tw`text-white text-xl mt-4`}>
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
  const isPhysicalEventWatch = watch("isPhysicalEvent");
  const locationWatch = watch("location");
  const registrationTypeWatch = watch("registrationType");
  const donationTargetWatch = watch("donationTarget");
  const impactTitleWatch = watch("impactTitle");
  const impactDescriptionWatch = watch("impactDescription");
  const impactPercentageWatch = watch("impactPercentage");

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-[#01082E]`}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
    >
      <View
        style={[
          tw`flex-1 pb-5 bg-[#01082E] flex flex-col items-center w-full`,
          { paddingTop: spacing.xxl },
        ]}
      >
      <View style={tw`flex-1 w-full max-w-[500px]`}>
        <CustomView className="px-5">
          <CustomeTopBarNav
            title="Edit Event"
            onClickBack={() => router.replace(`/event/${eventId}`)}
          />
        </CustomView>

        <ScrollView style={tw`w-full`} keyboardShouldPersistTaps="handled">
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
                    <Text style={tw`text-red-500`}>
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
                <Text style={tw`text-red-500`}>{errors.eventName.message}</Text>
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
                <Text style={tw`text-red-500`}>
                  {errors.description.message}
                </Text>
              )}
            </CustomView>

            <CustomView className="gap-2 mt-2">
              <FormLabel text="event impact" />
              <ImpactSelector
                impactTitle={impactTitleWatch}
                impactDescription={impactDescriptionWatch}
                impactPercentage={Number(
                  impactPercentageWatch || DEFAULT_IMPACT_PERCENTAGE
                )}
                registrationType={registrationTypeWatch}
                onImpactTitleChange={(value) =>
                  setValue("impactTitle", value, { shouldValidate: true })
                }
                onImpactDescriptionChange={(value) =>
                  setValue("impactDescription", value, { shouldValidate: true })
                }
                onImpactPercentageChange={(value) =>
                  setValue("impactPercentage", value, { shouldValidate: true })
                }
              />
              {errors.impactTitle && (
                <Text style={tw`text-red-500`}>{errors.impactTitle.message}</Text>
              )}
              {errors.impactDescription && (
                <Text style={tw`text-red-500`}>
                  {errors.impactDescription.message}
                </Text>
              )}
              {errors.impactPercentage && (
                <Text style={tw`text-red-500`}>
                  {errors.impactPercentage.message}
                </Text>
              )}
            </CustomView>
          </CustomView>

          <CustomView className="!bg-[#1B2A50]/40 h-2" />

          {/* Event Info */}
          <CustomView className="px-5">
            <FormLabel text="event information" />
            <TouchableOpacity
              style={tw`bg-[#101C45] p-5 my-2 rounded-xl flex flex-row justify-between items-center`}
              onPress={() => openSheet("Date and Time")}
            >
              <Text style={tw`text-white text-base`}>Date and Time</Text>
              {startDateWatch && <Text style={tw`text-[#0FF1CF]`}>✓</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`bg-[#101C45] p-5 my-2 rounded-xl flex flex-row justify-between items-center`}
              onPress={() => openSheet("Location")}
            >
              <View style={tw`flex-1 pr-3`}>
                <Text style={tw`text-white text-base`}>Location</Text>
                <Text style={tw`mt-1 text-xs text-[#8FA1CB]`}>
                  {isPhysicalEventWatch
                    ? locationWatch || "Add the physical venue"
                    : "No physical meetup"}
                </Text>
              </View>
              {(Boolean(locationWatch) || !isPhysicalEventWatch) && (
                <Text style={tw`text-[#0FF1CF]`}>✓</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`bg-[#101C45] p-5 my-2 rounded-xl flex flex-row justify-between items-center`}
              onPress={() => openSheet("Pricing")}
            >
              <Text style={tw`text-white text-base`}>{pricingSectionTitle}</Text>
              {(isDonationEvent ? donationTargetWatch : registrationTypeWatch) && (
                <Text style={tw`text-[#0FF1CF]`}>✓</Text>
              )}
            </TouchableOpacity>
          </CustomView>

          <CustomView className="!bg-[#1B2A50]/40 h-2 w-full" />

          <EventLinks
            links={watch("links") || []}
            onChange={(value) =>
              setValue("links", value, { shouldValidate: true })
            }
            error={errors.links?.message}
          />

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
      <Modal
        visible={Boolean(activeSection)}
        animationType="slide"
        transparent
        onRequestClose={closeSheet}
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
                  {activeSectionTitle}
                </Text>
                <Text style={tw`mt-1 text-sm leading-5 text-[#9FB0D8]`}>
                  {activeSectionDescription}
                </Text>
              </View>
              <TouchableOpacity onPress={closeSheet}>
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
              {renderSheetContent()}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={isTicketSheetOpen}
        animationType="slide"
        transparent
        onRequestClose={closeSheetTicket}
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
                  {editingTicket ? "Edit ticket" : "Create ticket"}
                </Text>
                <Text style={tw`mt-1 text-sm leading-5 text-[#9FB0D8]`}>
                  Set the name, perks, quantity, visibility, and price for this
                  ticket tier.
                </Text>
              </View>
              <TouchableOpacity onPress={closeSheetTicket}>
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
              <CreateTicket
                editingTicket={editingTicket}
                close={closeSheetTicket}
                tickets={watch("tickets") || []}
                setTicket={(updated: EventTicket[]) =>
                  setValue("tickets", updated)
                }
                editMode
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

export default EditEvent;
