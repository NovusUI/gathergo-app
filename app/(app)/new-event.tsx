import { useAppTheme } from "@/hooks/useAppTheme";
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
import { normalizeEventLinks } from "@/constants/eventLinks";
import {
  DEFAULT_REGISTRATION_CAPACITY,
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
import { removeItem } from "@/utils/storage";
import { convertUndefinedToNull, objectToFormData } from "@/utils/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFocusEffect } from "expo-router";
import EventDraftPrompt from "@/components/gogo/tasks/eventCreation/EventDraftPrompt";
import {
  loadEventDrafts,
  discardEventDraft,
  type SavedEventDraft,
} from "@/components/gogo/tasks/eventCreation/draftStorage";
import { useEventDraftPersistence } from "@/components/gogo/tasks/eventCreation/useEventDraftPersistence";
import ImpactPageLoader from "@/components/ui/ImpactPageLoader";
import { MascotMoment } from "@/components/gogo/mascot/MascotMoment";
import EventTypePicker from "@/components/gogo/tasks/eventCreation/EventTypePicker";
import type { Registration } from "@/types/auth";
import { CheckCheck } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
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


type CreationScreen =
  | { kind: "checking" | "picker" | "error" }
  | { kind: "resume"; draft: SavedEventDraft }
  | { kind: "editing"; type: Registration; draft: SavedEventDraft | null };

const NewEvent = () => {
  const { tw } = useAppTheme();
  const router = useLockedRouter();
  const [screen, setScreen] = useState<CreationScreen>({ kind: "checking" });
  const [drafts, setDrafts] = useState<SavedEventDraft[]>([]);
  const [discarding, setDiscarding] = useState(false);
  const loadCycle = useRef(0);
  const checkDrafts = useCallback(async (offerResume = true) => {
    const cycle = ++loadCycle.current;
    setScreen({ kind: "checking" });
    try {
      const saved = await loadEventDrafts();
      if (loadCycle.current !== cycle) return;
      setDrafts(saved);
      setScreen(
        offerResume && saved.length
          ? { kind: "resume", draft: saved[0] }
          : { kind: "picker" },
      );
    } catch {
      if (loadCycle.current === cycle) setScreen({ kind: "error" });
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void checkDrafts();
      return () => {
        loadCycle.current += 1;
      };
    }, [checkDrafts]),
  );
  const discardDraft = async (draft: SavedEventDraft) => {
    if (discarding) return;
    const cycle = loadCycle.current;
    setDiscarding(true);
    try {
      await discardEventDraft(draft.values.registrationType);
      if (loadCycle.current !== cycle) return;
      setDrafts((current) =>
        current.filter(
          (item) =>
            item.values.registrationType !== draft.values.registrationType,
        ),
      );
      setScreen({ kind: "picker" });
    } catch {
      showGlobalError("Couldn’t discard your draft. Please try again.");
    } finally {
      setDiscarding(false);
    }
  };
  if (screen.kind === "editing") {
    return (
      <EventCreationForm
        key={screen.type}
        participationType={screen.type}
        initialDraft={screen.draft}
        onChangeType={() => void checkDrafts(false)}
      />
    );
  }
  return (
    <View style={[tw`flex-1 bg-background dark:bg-[#01082E]`, { paddingTop: spacing.xxl }]}>
      <View style={tw`px-5`}>
        <CustomeTopBarNav
          title="New Event"
          onClickBack={() => router.replace("/")}
        />
      </View>
      {screen.kind === "checking" ? (
        <ImpactPageLoader />
      ) : screen.kind === "error" ? (
        <View style={tw`flex-1 justify-center gap-4 px-6`}>
          <MascotMoment
            layout="stacked"
            variant="error"
            title="Couldn’t load your draft"
            message="Try again to pick up where you left off."
          />
          <CustomButton
            title="Try again"
            onPress={() => void checkDrafts()}
            showArrow={false}
          />
        </View>
      ) : screen.kind === "resume" ? (
        <EventDraftPrompt
          title={screen.draft.values.eventName}
          busy={discarding}
          onContinue={() =>
            setScreen({
              kind: "editing",
              type: screen.draft.values.registrationType,
              draft: screen.draft,
            })
          }
          onDiscard={() => void discardDraft(screen.draft)}
        />
      ) : (
        <EventTypePicker
          onSelect={(type) => {
            const saved = drafts.find(
              (draft) => draft.values.registrationType === type,
            );
            setScreen(
              saved
                ? { kind: "resume", draft: saved }
                : { kind: "editing", type, draft: null },
            );
          }}
        />
      )}
    </View>
  );
};

const EventCreationForm = ({
  participationType,
  initialDraft,
  onChangeType,
}: {
  participationType: Registration;
  initialDraft: SavedEventDraft | null;
  onChangeType: () => void;
}) => {
  const { tw, color } = useAppTheme();
  const router = useLockedRouter();
  const isDonationEvent = participationType === "donation";
  const pricingSectionTitle = isDonationEvent
    ? "Fundraising goal"
    : participationType === "ticket"
      ? "Tickets"
      : "Registration";

  const [mode, setMode] = useState<"gogo" | "manual">(
    initialDraft?.mode ?? "gogo",
  );
  const [activeSection, setActiveSection] =
    useState<EventCreationSection | null>(null);
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

    void finishSection("Date and Time");
  };

  const handlePricingSave = (data: EventPricing) => {
    handlePricingChange(data);
    void finishSection("Pricing");
  };

  const renderSectionContent = (section: EventCreationSection | null) => {
    switch (section) {
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
      case "Impact story":
      case "Impact map":
      case "Interests":
        return (
          <EventStoryFields
            control={control}
            setValue={setValue}
            section={section}
          />
        );
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
                  physicalOnly={
                    participationType === "volunteer" ||
                    watch("volunteerRoles").length > 0
                  }
                  submitLabel="Continue"
                  onChange={({ location, isPhysicalEvent }) => {
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
                  }}
                  onSave={
                    mode === "gogo"
                      ? () => void finishSection("Location")
                      : undefined
                  }
                  value={value}
                />
              </View>
            )}
          />
        );
      case "Pricing":
        if (participationType === "volunteer") return null;
        if (participationType === "donation")
          return (
            <View style={tw`gap-4`}>
              <Controller
                name="donationTarget"
                control={control}
                render={({ field, fieldState }) => (
                  <Input
                    accessibilityLabel="Fundraising target in naira"
                    numeric
                    moneyFormat
                    placeholder="Target in ₦ (minimum ₦5,000)"
                    value={
                      field.value === undefined ? "" : String(field.value / 100)
                    }
                    onChangeText={(text) =>
                      field.onChange(
                        text === ""
                          ? undefined
                          : Math.round(Number(text) * 100),
                      )
                    }
                    error={fieldState.error?.message}
                  />
                )}
              />
              {mode === "gogo" ? (
                <CustomButton
                  onPress={() => void finishSection("Pricing")}
                  title="Continue"
                  showArrow={false}
                  buttonClassName="bg-accentFill dark:bg-[#0FF1CF] w-full !border-none"
                  textClassName="!text-onAccent dark:text-black"
                />
              ) : null}
            </View>
          );
        return (
          <Pricing
            onEdit={onEdit}
            initialData={pricingData}
            onChange={handlePricingChange}
            onSave={mode === "gogo" ? handlePricingSave : undefined}
            setTicket={(updated: EventTicket[]) => setValue("tickets", updated)}
            tickets={watch("tickets") || []}
            allowedRegistrationTypes={[participationType]}
            compact
            submitLabel="Continue"
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
    trigger,
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
      registrationType: participationType,
      description: "",
      isRecurring: false,
      tickets: [],
      registrationAttendees: undefined,
      registrationFee: undefined,
      donationTarget: undefined,
      donationsEnabled: false,
      volunteerRoles: [],
      ...initialDraft?.values,
    },
  });

  const handlePricingChange = useCallback(
    (data: EventPricing) => {
      setValue("registrationType", data.registrationType);
      setValue("registrationAttendees", data.registrationAttendees, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("registrationFee", data.registrationFee, {
        shouldDirty: true,
        shouldValidate: true,
      });
      if (data.registrationType === "donation")
        setValue("donationTarget", data.donationTarget, {
          shouldDirty: true,
          shouldValidate: true,
        });
      setValue("tickets", data.tickets);
      clearErrors("registrationType");
    },
    [clearErrors, setValue],
  );

  const conversation = useGogoEventCreation({
    getValues,
    setValue,
    isDonationEvent,
    initialState: initialDraft?.conversation,
  });
  const { getDraftState } = conversation;
  const getDraft = useCallback(
    (): SavedEventDraft => ({
      values: getValues(),
      mode,
      conversation: getDraftState(),
    }),
    [getValues, mode, getDraftState],
  );
  const draftPersistence = useEventDraftPersistence({
    watch,
    getDraft,
    onLeave: conversation.cancel,
  });
  const reviewDraft = () => {
    conversation.cancel();
    setMode("manual");
  };
  const changeEventType = async () => {
    conversation.cancel();
    try {
      await draftPersistence.flush();
      onChangeType();
    } catch {
      showGlobalError("Couldn’t keep your draft. Please try again.");
    }
  };

  const finishSection = async (
    section: EventCreationSection | null = activeSection,
  ) => {
    const fields =
      section === "Impact story"
        ? (["impactDescription"] as const)
        : section === "Links"
          ? (["links"] as const)
          : section === "Story"
            ? (["eventName", "description"] as const)
            : section === "Pricing" && isDonationEvent
              ? (["donationTarget"] as const)
              : section === "Volunteering"
                ? (["volunteerRoles", "donationTarget"] as const)
                : null;
    if (fields && !(await trigger([...fields]))) return;
    const completed = section;
    closeSheet();
    if (mode === "gogo")
      void conversation.continueFromDraft(completed ?? undefined);
  };

  const startDate = watch("startDate");
  const registrationFee = watch("registrationFee");
  const registrationAttendees = watch("registrationAttendees");
  const tickets = watch("tickets");
  const registrationType = watch("registrationType");

  const pricingData = useMemo<EventPricing | null>(() => {
    if (registrationType === "volunteer" || registrationType === "donation")
      return null;
    return {
      registrationType,
      paid: registrationType === "registration" && (registrationFee ?? 0) > 0,
      registrationFee:
        registrationType === "registration" ? registrationFee : undefined,
      limited:
        registrationType === "registration" &&
        registrationAttendees !== undefined &&
        registrationAttendees !== DEFAULT_REGISTRATION_CAPACITY,
      registrationAttendees:
        registrationType === "registration" ? registrationAttendees : undefined,
      tickets: registrationType === "ticket" ? (tickets ?? []) : [],
    };
  }, [registrationType, registrationFee, registrationAttendees, tickets]);

  const openSheet = (section: EventCreationSection) => {
    conversation.cancel();
    if (section === "Impact story" && conversation.suggestedImpactStory) {
      setValue("impactDescription", conversation.suggestedImpactStory, {
        shouldDirty: true,
      });
    }
    setActiveSection(section);
  };

  const onError = (errors: any) => {
    const firstErrorMessage = Object.values(errors || {}).find(
      (value: any) => value?.message,
    ) as { message?: string } | undefined;

    showGlobalError(firstErrorMessage?.message || "Error in form");
    console.log(errors);
  };

  const { mutateAsync, isPending } = useCreateEvent({
    onSuccess: async (data) => {
      showGlobalSuccess(
        data.data.isImageProcessing
          ? "Event created! Image uploading in background..."
          : "Event created successfully!",
      );
      await draftPersistence.clear();
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
      style={tw`flex-1 bg-background dark:bg-[#01082E]`}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
    >
      <View
        style={[
          tw`flex-1 pb-10 bg-background dark:bg-[#01082E] items-center w-full`,
          { paddingTop: spacing.xxl },
        ]}
      >
        <View style={tw`flex-1 w-full max-w-[500px]`}>
          <CustomView style={tw`px-5`}>
            <CustomeTopBarNav
              title={
                {
                  donation: "New Fundraiser",
                  ticket: "New ticket event",
                  registration: "New registration event",
                  volunteer: "New volunteer event",
                }[participationType]
              }
              onClickBack={() => void changeEventType()}
            />
          </CustomView>
          <View style={tw`px-5 flex-row items-center justify-between`}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => void changeEventType()}
              style={tw`min-h-[44px] justify-center py-2`}
            >
              <Text style={tw`text-sm text-secondary dark:text-[#AFC0F4]`}>Change event type</Text>
            </TouchableOpacity>
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
              <Text style={tw`text-sm font-medium text-accent dark:text-[#0FF1CF]`}>
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
              draftTitle={watch("eventName")}
              impactStory={watch("impactDescription")}
              renderInlineSection={(section) =>
                section === "Location" || section === "Pricing"
                  ? renderSectionContent(section)
                  : null
              }
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
                        <Text style={tw`text-danger dark:text-red-500`}>
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
                          <Text style={tw`text-danger dark:text-red-500`}>
                            {errors.eventName.message}
                          </Text>
                        )}
                      </View>
                    )}
                  />
                </CustomView>

                <EventStoryFields control={control} setValue={setValue} />
              </CustomView>

              <CustomView style={tw`bg-surface/40 dark:bg-[#1B2A50]/40 h-2`} />

              {/* Event Information */}
              <CustomView style={tw`px-5`}>
                <CustomView>
                  <FormLabel text="event information" />
                </CustomView>

                <TouchableOpacity
                  style={tw`bg-surface dark:bg-[#101C45] p-5 my-2 rounded-xl flex-row justify-between items-center`}
                  onPress={() => openSheet("Date and Time")}
                >
                  <View>
                    <Text style={tw`text-foreground dark:text-white text-base`}>Date and Time</Text>
                    {errors.startDate && (
                      <Text style={tw`text-danger dark:text-red-500`}>
                        {errors.startDate.message}
                      </Text>
                    )}
                  </View>
                  {!errors.startDate && startDate && (
                    <CheckCheck color={color("#0FF1CF", "accent")} />
                  )}
                </TouchableOpacity>

                <View style={tw`mt-5 gap-3`}>
                  <Text style={tw`text-base font-semibold text-foreground dark:text-white`}>
                    Location
                  </Text>
                  {renderSectionContent("Location")}
                  {errors.location ? (
                    <Text style={tw`text-danger dark:text-red-500`}>
                      {errors.location.message}
                    </Text>
                  ) : null}
                </View>
                {registrationType !== "volunteer" ? (
                  <View style={tw`mt-6 gap-3`}>
                    <Text style={tw`text-base font-semibold text-foreground dark:text-white`}>
                      {pricingSectionTitle}
                    </Text>
                    {renderSectionContent("Pricing")}
                  </View>
                ) : null}
              </CustomView>

              <CustomView style={tw`bg-surface/40 dark:bg-[#1B2A50]/40 h-2 w-full`} />

              <VolunteerSetupFields control={control} setValue={setValue} />
              {errors.volunteerRoles?.message ? (
                <Text style={tw`px-5 text-danger dark:text-red-400`}>
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

              <CustomView style={tw`bg-surface/40 dark:bg-[#1B2A50]/40 h-2 w-full`} />

              <CustomView style={tw`items-center px-5`}>
                <CustomButton
                  disabled={isPending}
                  onPress={handleSubmit(onSubmit, onError)}
                  title={isPending ? "publishing.." : "publish event"}
                  showArrow={false}
                  buttonClassName="bg-accentFill dark:bg-[#0FF1CF] w-full !border-none"
                  textClassName="!text-onAccent dark:text-black"
                />
              </CustomView>
            </ScrollView>
          )}
          <Modal
            visible={Boolean(
              activeSection &&
                activeSection !== "Location" &&
                activeSection !== "Pricing",
            )}
            animationType="slide"
            transparent
            onRequestClose={closeSheet}
          >
            <KeyboardAvoidingView
              style={tw`flex-1 justify-end bg-black/55`}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <View
                style={tw`max-h-[88%] rounded-t-[32px] bg-background dark:bg-[#041130] px-5 pb-8 pt-5`}
              >
                <View
                  style={tw`mb-4 h-1.5 w-14 self-center rounded-full bg-surfaceMuted dark:bg-[#2B3C66]`}
                />

                <View style={tw`flex-row items-start justify-between gap-4`}>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-xl font-semibold text-foreground dark:text-white`}>
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
                  {renderSectionContent(activeSection)}
                  {mode === "gogo" &&
                  (activeSection === "Story" ||
                    activeSection === "Impact story" ||
                    activeSection === "Impact map" ||
                    activeSection === "Interests" ||
                    activeSection === "Volunteering" ||
                    activeSection === "Cover" ||
                    activeSection === "Links") ? (
                    <CustomButton
                      onPress={() => void finishSection()}
                      title="Continue with Gogo"
                      showArrow={false}
                      buttonClassName="bg-accentFill dark:bg-[#0FF1CF] w-full !border-none mt-5"
                      textClassName="!text-onAccent dark:text-black"
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
                style={tw`max-h-[88%] rounded-t-[32px] bg-background dark:bg-[#041130] px-5 pb-8 pt-5`}
              >
                <View
                  style={tw`mb-4 h-1.5 w-14 self-center rounded-full bg-surfaceMuted dark:bg-[#2B3C66]`}
                />

                <View style={tw`flex-row items-start justify-between gap-4`}>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-xl font-semibold text-foreground dark:text-white`}>
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
