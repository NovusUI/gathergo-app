import SheetCloseButton from "@/components/buttons/SheetCloseButton";
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CoverImagePicker from "@/components/EventImagePicket";
import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import CreateTicket from "@/components/eventInfo/CreateTicket";
import DateAndTime from "@/components/eventInfo/DateAndTime";
import EventLinks from "@/components/eventInfo/EventLinks";
import EventStoryFields from "@/components/eventInfo/EventStoryFields";
import VolunteerSetupFields from "@/components/eventInfo/VolunteerSetupFields";
import EventFundraisingFields from "@/components/eventInfo/EventFundraisingFields";
import GogoEventCreator from "@/components/gogo/tasks/eventCreation/GogoEventCreator";
import { useGogoEventCreation } from "@/components/gogo/tasks/eventCreation/useGogoEventCreation";
import type { EventCreationSection } from "@/components/gogo/tasks/eventCreation/types";
import Location from "@/components/eventInfo/Location";
import Pricing from "@/components/eventInfo/Pricing";
import Input from "@/components/inputs/CustomInput1";
import FormLabel from "@/components/labels/FormLabel";
import { normalizeEventLink } from "@/constants/eventLinks";
import {
  buildEventImpactFormFields,
  buildEventParticipationFormFields,
} from "@/utils/eventForm";
import { spacing } from "@/constants/spacing";
import {
  DateTimeFormData,
  EventFormData,
  EventPricing,
  EventTicket,
  eventSchema,
  dateTimeSchema,
} from "@/schemas/event";
import { useCreateEvent } from "@/services/mutations";
import { buildEventDateTimeIso, extractDate } from "@/utils/dateTimeHandler";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { CHACHE_KEYS } from "@/utils/keys";
import { useLockedRouter } from "@/utils/navigation";
import { getItem, removeItem, saveItem } from "@/utils/storage";
import { convertUndefinedToNull, objectToFormData } from "@/utils/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams } from "expo-router";
import { CheckCheck } from "lucide-react-native";
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

const NewEvent = () => {
  const router = useLockedRouter();
  const { eventType } = useLocalSearchParams<{ eventType?: string }>();
  const presetEventType = Array.isArray(eventType) ? eventType[0] : eventType;
  const isDonationEvent = presetEventType === "donation";
  const eventFormCacheKey = `${CHACHE_KEYS.eventFormKey}_${
    isDonationEvent ? "donation" : "general"
  }`;
  const pricingSectionTitle = isDonationEvent ? "Donation setup" : "Pricing";

  const [mode, setMode] = useState<"gogo" | "manual">("gogo");
  const [activeSection, setActiveSection] =
    useState<EventCreationSection | null>(null);
  const [pricingData, setPricingData] = useState<EventPricing | null>(null);
  const [isTicketSheetOpen, setIsTicketSheetOpen] = useState(false);

  const [editingTicket, setEditingTicket] = useState<EventTicket | null>(null);

  const onEdit = (data: EventTicket) => {
    setEditingTicket(data);

    openSheetTicket();
  };

  const openSheetTicket = useCallback(() => {
    setIsTicketSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setActiveSection(null);
  }, []);

  const closeSheetTicket = useCallback(() => {
    setIsTicketSheetOpen(false);
    setEditingTicket(null);
  }, []);

  const handleDateTimeSave = (data: DateTimeFormData) => {
    // Update the main form with date/time data
    setValue("startDate", data.startDate);
    setValue("endDate", data.endDate);
    setValue("startTime", data.startTime);
    setValue("endTime", data.endTime);
    setValue("isRecurring", data.isRecurring);
    setValue("repeat", data.repeat ?? "NONE");
    setValue("endRepeat", data.endRepeat);

    clearErrors(["startDate", "endDate", "startTime", "endTime"]);

    finishSection();
  };

  const handlePricingSave = (data: EventPricing) => {
    setPricingData(data);
    setValue("registrationType", data.registrationType);
    setValue("registrationAttendees", data.registrationAttendees);
    setValue("registrationFee", data.registrationFee);
    if (data.registrationType === "donation")
      setValue("donationTarget", data.donationTarget);
    setValue("tickets", data.tickets || []);
    finishSection();
    clearErrors(
      isDonationEvent
        ? ["registrationType", "donationTarget"]
        : "registrationType",
    );
  };

  const renderSheetContent = () => {
    switch (activeSection) {
      case "Date and Time": {
        const values = getValues();
        const currentDates = {
          startDate: values.startDate ? new Date(values.startDate) : undefined,
          endDate: values.endDate ? new Date(values.endDate) : undefined,
          startTime: values.startTime,
          endTime: values.endTime,
          isRecurring: values.isRecurring,
          repeat: values.repeat,
          endRepeat: values.endRepeat,
        };
        return (
          <DateAndTime
            initialData={currentDates}
            onSave={handleDateTimeSave}
            editMode={false}
            allowRecurring={false}
          />
        );
      }
      case "Story":
        return <EventStoryFields control={control} setValue={setValue} />;
      case "Volunteering":
        return (
          <View>
            <VolunteerSetupFields control={control} setValue={setValue} />
            <EventFundraisingFields control={control} setValue={setValue} />
          </View>
        );
      case "Cover":
        return (
          <Controller
            name="imgUrl"
            control={control}
            render={({ field: { value, onChange } }) => (
              <CoverImagePicker value={value || null} onChange={onChange} />
            )}
          />
        );
      case "Links":
        return (
          <EventLinks
            links={watch("links")}
            onChange={(value) =>
              setValue("links", value, { shouldValidate: true })
            }
            error={errors.links?.message}
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
                    if (
                      !isPhysicalEvent &&
                      (watch("registrationType") === "volunteer" ||
                        watch("volunteerRoles").length > 0)
                    ) {
                      showGlobalError(
                        "Volunteer roles require a physical venue.",
                      );
                      return;
                    }
                    onChange(location);
                    setValue("isPhysicalEvent", isPhysicalEvent, {
                      shouldValidate: true,
                    });
                    finishSection();
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
            onEdit={onEdit}
            initialData={pricingData}
            onSave={handlePricingSave}
            setTicket={(updated: EventTicket[]) => setValue("tickets", updated)}
            tickets={watch("tickets") || []}
            allowedRegistrationTypes={
              isDonationEvent ? ["donation"] : ["ticket", "registration"]
            }
            createTicket={() => {
              setEditingTicket(null);
              openSheetTicket();
            }}
          />
        );
      default:
        return null;
    }
  };

  const activeSectionTitle =
    activeSection === "Pricing" ? pricingSectionTitle : activeSection;

  //*********************************** react form hook ***********************************//

  //*********************************** event form ***********************************//

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    getValues,
    setValue,
    clearErrors,
    reset,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema) as Resolver<EventFormData>,
    defaultValues: {
      imgUrl: undefined,
      eventName: "",
      impactTitle: "",
      impactDescription: "",
      impactPercentage: undefined,
      impactSdgGoals: [],
      impactPaths: [],
      impactCommitments: [],
      impactMapSource: undefined,
      impactMapGeneratedAt: undefined,
      repeat: "NONE",
      startDate: undefined,
      endDate: undefined, // +1 hour
      endRepeat: undefined,
      isPhysicalEvent: true,
      location: "",
      links: [],
      tags: [],
      registrationType: isDonationEvent ? "donation" : undefined,
      description: "",
      isRecurring: false,
      tickets: [],
      registrationAttendees: undefined,
      registrationFee: undefined,
      donationTarget: undefined,
      donationsEnabled: false,
      volunteerRoles: [],
    },
  });

  const conversation = useGogoEventCreation({
    getValues,
    setValue,
    isDonationEvent,
  });
  const reviewDraft = () => {
    conversation.cancel();
    setMode("manual");
  };

  const finishSection = () => {
    closeSheet();
    if (mode === "gogo") void conversation.continueFromDraft();
  };

  const startDate = watch("startDate");
  const isPhysicalEvent = watch("isPhysicalEvent");
  const location = watch("location");
  const registrationType = watch("registrationType");
  const donationTarget = watch("donationTarget");

  const buildPricingState = useCallback(
    (values: Partial<EventFormData>): EventPricing | null => {
      const nextRegistrationType = isDonationEvent
        ? "donation"
        : values.registrationType;

      if (!nextRegistrationType || nextRegistrationType === "volunteer") {
        return null;
      }

      return {
        registrationType: nextRegistrationType,
        paid:
          nextRegistrationType === "registration"
            ? Number(values.registrationFee || 0) > 0
            : false,
        registrationFee:
          nextRegistrationType === "registration"
            ? values.registrationFee
            : undefined,
        donationTarget:
          nextRegistrationType === "donation"
            ? values.donationTarget
            : undefined,
        limited:
          nextRegistrationType === "registration"
            ? Boolean(
                values.registrationAttendees &&
                  Number(values.registrationAttendees) !== 100000,
              )
            : false,
        registrationAttendees:
          nextRegistrationType === "registration"
            ? values.registrationAttendees
            : undefined,
        tickets: nextRegistrationType === "ticket" ? values.tickets || [] : [],
      };
    },
    [isDonationEvent],
  );

  const openSheet = (section: EventCreationSection) => {
    conversation.cancel();
    if (section === "Pricing") setPricingData(buildPricingState(getValues()));
    setActiveSection(section);
  };

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const cached = await getItem(eventFormCacheKey);
      if (cached) {
        try {
          const parsed = {
            isPhysicalEvent: true,
            donationsEnabled: false,
            volunteerRoles: [],
            ...JSON.parse(cached),
          };
          if (!isMounted) {
            return;
          }
          reset(parsed); // restore form state
          setPricingData(buildPricingState(parsed));
        } catch (e) {
          console.log("Error parsing cached event form:", e);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [buildPricingState, eventFormCacheKey, reset]);

  useEffect(() => {
    if (!isDonationEvent) {
      return;
    }

    setValue("registrationType", "donation");
    setPricingData(buildPricingState(getValues()));
  }, [buildPricingState, getValues, isDonationEvent, setValue]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const subscription = watch((value) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(async () => {
        try {
          await saveItem(eventFormCacheKey, JSON.stringify(value));
        } catch (e) {
          console.log("Error saving event form progress:", e);
        }
      }, 250);
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, [eventFormCacheKey, watch]);

  const onError = (errors: any) => {
    const firstErrorMessage = Object.values(errors || {}).find(
      (value: any) => value?.message,
    ) as { message?: string } | undefined;

    showGlobalError(firstErrorMessage?.message || "Error in form");
    console.log(errors);
  };

  const { mutateAsync, isPending } = useCreateEvent({
    onSuccess: async (data) => {
      const createdEventType = watch("registrationType");
      const hasPaidRegistration =
        createdEventType === "registration" &&
        Number(watch("registrationFee") || 0) > 0;
      const hasDonationFlow =
        createdEventType === "donation" ||
        (createdEventType === "volunteer" && watch("donationsEnabled"));
      const hasPaidTickets =
        createdEventType === "ticket" &&
        (watch("tickets") || []).some(
          (ticket: any) => Number(ticket?.price || 0) > 0,
        );
      const shouldPromptWallet =
        hasPaidRegistration || hasDonationFlow || hasPaidTickets;

      showGlobalSuccess(
        data.data.isImageProcessing
          ? "Event created! Image uploading in background..."
          : "Event created successfully!",
      );
      await removeItem(eventFormCacheKey);
      await removeItem(CHACHE_KEYS.eventFormKey);
      router.replace(
        shouldPromptWallet
          ? `/event/${data.data.id}?openPayoutSetup=1`
          : `/event/${data.data.id}`,
      );
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
    const dates = dateTimeSchema.safeParse(data);
    if (!dates.success) {
      showGlobalError(dates.error.issues[0].message);
      openSheet("Date and Time");
      return;
    }
    const {
      repeat,
      imgUrl,
      eventName,
      startTime,
      endTime,
      registrationType,
      startDate,
      endDate,
      endRepeat,
      links,
      isPhysicalEvent,
      location,
    } = data;

    const finalRegistrationType = isDonationEvent
      ? "donation"
      : registrationType;
    const eventDescription = data.description.trim();
    const correctedData = {
      title: eventName,
      description: eventDescription,
      links: normalizeEventLinks(links),
      tags: JSON.stringify(data.tags),
      ...buildEventImpactFormFields(data),
      reoccurring: repeat,
      isPhysicalEvent,
      location: isPhysicalEvent ? location : "",
      ...buildEventParticipationFormFields(
        { ...data, registrationType: finalRegistrationType },
        "create",
      ),
      startDate: buildEventDateTimeIso(startDate, startTime),
      endDate: buildEventDateTimeIso(endDate, endTime, {
        endOfMinute: endTime === "23:59",
      }),
      ...(endRepeat ? { endRepeat: extractDate(endRepeat) } : {}),
    };
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
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
              title={isDonationEvent ? "New Fundraiser" : "New Event"}
              onClickBack={() => router.replace("/")}
            />
          </CustomView>
          <View style={tw`px-5 flex-row justify-end`}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                if (mode === "gogo") {
                  reviewDraft();
                } else {
                  setMode("gogo");
                  void conversation.continueFromDraft();
                }
              }}
              style={tw`min-h-[44px] justify-center py-2`}
            >
              <Text style={tw`text-sm font-medium text-[#0FF1CF]`}>
                {mode === "gogo" ? "Use manual form" : "Let Gogo guide me"}
              </Text>
            </TouchableOpacity>
          </View>
          {mode === "gogo" ? (
            <GogoEventCreator
              conversation={conversation}
              isDonationEvent={isDonationEvent}
              onOpenSection={openSheet}
              onReview={reviewDraft}
            />
          ) : (
            <ScrollView style={tw`w-full`} keyboardShouldPersistTaps="handled">
              <CustomView style={tw`px-5`}>
                <Controller
                  name="imgUrl"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <View>
                      <CoverImagePicker
                        value={value || null}
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

                <EventStoryFields control={control} setValue={setValue} />
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
                  {!errors.startDate && startDate && (
                    <CheckCheck color="#0FF1CF" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={tw`bg-[#101C45] p-5 my-2 rounded-xl flex-row justify-between items-center`}
                  onPress={() => openSheet("Location")}
                >
                  <View style={tw`flex-1 pr-3`}>
                    <Text style={tw`text-white text-base`}>Location</Text>
                    {errors.location ? (
                      <Text style={tw`text-red-500`}>
                        {errors.location.message}
                      </Text>
                    ) : (
                      <Text style={tw`mt-1 text-xs text-[#8FA1CB]`}>
                        {isPhysicalEvent
                          ? location || "Add the physical venue"
                          : "No physical meetup"}
                      </Text>
                    )}
                  </View>
                  {!errors.location &&
                    (Boolean(location) || !isPhysicalEvent) && (
                      <CheckCheck color="#0FF1CF" />
                    )}
                </TouchableOpacity>

                {registrationType !== "volunteer" ? (
                  <TouchableOpacity
                    style={tw`bg-[#101C45] p-5 my-2 rounded-xl flex-row justify-between items-center`}
                    onPress={() => openSheet("Pricing")}
                  >
                    <View>
                      <Text style={tw`text-white text-base`}>
                        {pricingSectionTitle}
                      </Text>
                      {(isDonationEvent
                        ? errors.donationTarget
                        : errors.registrationType) && (
                        <Text style={tw`text-red-500`}>
                          {isDonationEvent
                            ? errors.donationTarget?.message
                            : errors.registrationType?.message}
                        </Text>
                      )}
                    </View>
                    {!errors.registrationType &&
                      !errors.donationTarget &&
                      (isDonationEvent ? donationTarget : registrationType) && (
                        <CheckCheck color="#0FF1CF" />
                      )}
                  </TouchableOpacity>
                ) : null}
              </CustomView>

              <CustomView style={tw`bg-[#1B2A50]/40 h-2 w-full`} />

              <VolunteerSetupFields control={control} setValue={setValue} />
              {errors.volunteerRoles?.message ? (
                <Text style={tw`px-5 text-red-400`}>
                  {errors.volunteerRoles.message}
                </Text>
              ) : null}
              <EventFundraisingFields control={control} setValue={setValue} />

              <EventLinks
                links={watch("links") || []}
                onChange={(value) =>
                  setValue("links", value, { shouldValidate: true })
                }
                error={errors.links?.message}
              />

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
          )}
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
                  </View>
                  <SheetCloseButton
                    accessibilityLabel="Close event section"
                    onPress={closeSheet}
                  />
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={tw`pt-4 pb-6`}
                  keyboardShouldPersistTaps="handled"
                >
                  {renderSheetContent()}
                  {mode === "gogo" &&
                  (activeSection === "Story" ||
                    activeSection === "Volunteering" ||
                    activeSection === "Cover" ||
                    activeSection === "Links") ? (
                    <CustomButton
                      onPress={finishSection}
                      title="Continue with Gogo"
                      showArrow={false}
                      buttonClassName="bg-[#0FF1CF] w-full !border-none mt-5"
                      textClassName="!text-black"
                    />
                  ) : null}
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
                  </View>
                  <SheetCloseButton
                    accessibilityLabel="Close ticket sheet"
                    onPress={closeSheetTicket}
                  />
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
                  />
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default NewEvent;
