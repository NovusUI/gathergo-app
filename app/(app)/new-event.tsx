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
import { useCreateEvent } from "@/services/mutations";
import { extractDate } from "@/utils/dateTimeHandler";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { CHACHE_KEYS } from "@/utils/keys";
import { useLockedRouter } from "@/utils/navigation";
import { getItem, removeItem, saveItem } from "@/utils/storage";
import { convertUndefinedToNull, objectToFormData } from "@/utils/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
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

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [dateTimeData, setDateTimeData] = useState<DateTimeFormData | null>(
    null
  );
  const [pricingData, setPricingData] = useState<EventPricing | null>(null);
  const [isTicketSheetOpen, setIsTicketSheetOpen] = useState(false);

  const [editingTicket, setEditingTicket] = useState<EventTicket | null>(null);

  const onEdit = (data: EventTicket) => {
    setEditingTicket(data);

    openSheetTicket();
  };

  const openSheet = useCallback((section: string) => {
    setActiveSection(section);
  }, []);

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
    setDateTimeData(data);

    // Update the main form with date/time data
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
    setPricingData(data);
    setValue("registrationType", data.registrationType);
    setValue("registrationAttendees", data.registrationAttendees);
    setValue("registrationFee", data.registrationFee);
    setValue("donationTarget", data.donationTarget);
    setValue("tickets", data.tickets || []);
    if (data.registrationType === "donation") {
      setValue("impactPercentage", 100);
    }
    closeSheet();
    clearErrors(
      isDonationEvent ? ["registrationType", "donationTarget"] : "registrationType"
    );
  };

  const renderSheetContent = () => {
    switch (activeSection) {
      case "Date and Time":
        return (
          <DateAndTime
            initialData={dateTimeData}
            onSave={handleDateTimeSave}
            editMode={false}
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
      impactTitle: DEFAULT_IMPACT_CAUSE.title,
      impactDescription: DEFAULT_IMPACT_CAUSE.description,
      impactPercentage: isDonationEvent ? 100 : DEFAULT_IMPACT_PERCENTAGE,
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
    },
  });

  const startDate = watch("startDate");
  const isPhysicalEvent = watch("isPhysicalEvent");
  const location = watch("location");
  const registrationType = watch("registrationType");
  const donationTarget = watch("donationTarget");
  const impactTitle = watch("impactTitle");
  const impactDescription = watch("impactDescription");
  const impactPercentage = watch("impactPercentage");

  const buildPricingState = useCallback(
    (values: Partial<EventFormData>): EventPricing | null => {
      const nextRegistrationType = isDonationEvent
        ? "donation"
        : values.registrationType;

      if (!nextRegistrationType) {
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
                  Number(values.registrationAttendees) !== 100000
              )
            : false,
        registrationAttendees:
          nextRegistrationType === "registration"
            ? values.registrationAttendees
            : undefined,
        tickets: nextRegistrationType === "ticket" ? values.tickets || [] : [],
      };
    },
    [isDonationEvent]
  );

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const cached = await getItem(eventFormCacheKey);
      if (cached) {
        try {
          const parsed = {
            isPhysicalEvent: true,
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
    setValue("impactPercentage", 100);
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
      (value: any) => value?.message
    ) as { message?: string } | undefined;

    showGlobalError(firstErrorMessage?.message || "Error in form");
    console.log(errors);
  };

  const { mutateAsync, isPending } = useCreateEvent({
    onSuccess: async (data) => {
      const createdEventType = watch("registrationType");
      const hasPaidRegistration = createdEventType === "registration" && Number(watch("registrationFee") || 0) > 0;
      const hasDonationFlow = createdEventType === "donation";
      const hasPaidTickets = createdEventType === "ticket" && (watch("tickets") || []).some((ticket: any) => Number(ticket?.price || 0) > 0);
      const shouldPromptWallet = hasPaidRegistration || hasDonationFlow || hasPaidTickets;

      showGlobalSuccess(
        data.data.isImageProcessing
          ? "Event created! Image uploading in background..."
          : "Event created successfully!"
      );
      await removeItem(eventFormCacheKey);
      await removeItem(CHACHE_KEYS.eventFormKey);
      router.replace(
        shouldPromptWallet
          ? `/event/${data.data.id}?openPayoutSetup=1`
          : `/event/${data.data.id}`
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
      impactTitle,
      impactDescription,
      impactPercentage,
      startDate,
      endDate,
      endRepeat,
      tickets,
      donationTarget,
      links,
      isPhysicalEvent,
      ...rest
    } = data;

    tickets?.map(({ paid, limited, isNew, ...rest }) => ({ rest }));
    const finalRegistrationType = isDonationEvent
      ? "donation"
      : registrationType;
    const impactAwareTags = mergeImpactTags(rest.tags, impactTitle);
    const resolvedImpactPercentage = resolveImpactPercentage(
      finalRegistrationType,
      Number(impactPercentage || DEFAULT_IMPACT_PERCENTAGE)
    );

    const correctedData = {
      ...rest,
      title: eventName,
      links: normalizeEventLinks(links),
      tags: impactAwareTags,
      impactTitle,
      impactDescription: buildImpactDescription(impactTitle, impactDescription),
      impactPercentage: resolvedImpactPercentage,
      reoccurring: repeat,
      isPhysicalEvent,
      location: isPhysicalEvent ? rest.location : "",
      ...(finalRegistrationType === "registration"
        ? finalRegistrationType === "registration" && !registrationAttendees
          ? { registrationAttendees: 100000 }
          : { registrationAttendees }
        : {}),
      ...(finalRegistrationType === "registration"
        ? finalRegistrationType === "registration" && !registrationFee
          ? { registrationFee: 0 }
          : { registrationFee }
        : {}),
      ...(finalRegistrationType === "donation" && donationTarget
        ? { donationTarget }
        : {}),
      registrationType: finalRegistrationType,
      startDate: `${extractDate(startDate)}T${startTime}:00Z`,
      endDate: `${extractDate(endDate)}T${endTime}:00Z`,
      ...(endRepeat ? { endRepeat: extractDate(endRepeat) } : {}),
      ...(finalRegistrationType === "ticket"
        ? {
            tickets: tickets?.map(({ paid, limited, isNew, ...rest }) =>
              JSON.stringify({ ...rest })
            ),
          }
        : {}),
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
            title={isDonationEvent ? "New Donation Event" : "New Event"}
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

            <CustomView style={tw`gap-2 mt-2`}>
              <FormLabel text="event impact" />
              <ImpactSelector
                impactTitle={impactTitle}
                impactDescription={impactDescription}
                impactPercentage={Number(impactPercentage || DEFAULT_IMPACT_PERCENTAGE)}
                registrationType={registrationType}
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
              {!errors.location && (Boolean(location) || !isPhysicalEvent) && (
                <CheckCheck color="#0FF1CF" />
              )}
            </TouchableOpacity>

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
          </CustomView>

          <CustomView style={tw`bg-[#1B2A50]/40 h-2 w-full`} />

          <EventLinks
            links={watch("links") || []}
            onChange={(value) =>
              setValue("links", value, { shouldValidate: true })
            }
            error={errors.links?.message}
          />

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
                    Set the name, perks, quantity, visibility, and price for
                    this ticket tier.
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
