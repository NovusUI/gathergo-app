import {
  EventPricing,
  EventPricingFormData,
  EventTicket,
  eventPricingSchema,
} from "@/schemas/event";
import { normalizeEventPricing } from "@/utils/eventForm";
import { showGlobalError } from "@/utils/globalErrorHandler";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle } from "lucide-react-native";
import { useEffect, useMemo, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, TouchableOpacity, View } from "react-native";
import tw, { style as twStyle } from "twrnc";
import CustomSwitcher from "../CustomSwitcher";
import CustomView from "../View";
import CustomButton from "../buttons/CustomBtn1";
import Input from "../inputs/CustomInput1";
import PricingCard from "./TicketCard";

interface Props {
  createTicket: () => void;
  onSave?: (data: EventPricing) => void;
  onChange?: (data: EventPricing) => void;
  tickets: EventTicket[] | undefined;
  initialData?: EventPricing | null;
  setTicket: (updated: EventTicket[]) => void;
  onEdit?: (data: EventTicket) => void;
  editMode?: boolean;
  insideBottomSheet?: boolean;
  compact?: boolean;
  submitLabel?: string;
  allowedRegistrationTypes?: readonly EventPricing["registrationType"][];
}

const ALL_REGISTRATION_TYPES = [
  "donation",
  "ticket",
  "registration",
] as const satisfies readonly EventPricing["registrationType"][];

const registrationTypeContent = {
  donation: {
    label: "Donation",
    helper: "Fundraising goal",
  },
  ticket: {
    label: "Ticket",
    helper: "Multiple ticket types",
  },
  registration: {
    label: "Registration",
    helper: "Free or paid entry",
  },
} satisfies Record<
  EventPricing["registrationType"],
  { label: string; helper: string }
>;

const Pricing = ({
  createTicket,
  tickets,
  onSave,
  onChange,
  initialData,
  setTicket,
  onEdit,
  editMode = false,
  insideBottomSheet = false,
  compact = false,
  submitLabel = "Save and Continue",
  allowedRegistrationTypes = ALL_REGISTRATION_TYPES,
}: Props) => {
  const allowedTypesKey = allowedRegistrationTypes.join("|");
  const normalizedAllowedRegistrationTypes = useMemo(
    () =>
      (allowedTypesKey
        ? allowedTypesKey.split("|")
        : [...ALL_REGISTRATION_TYPES]) as EventPricing["registrationType"][],
    [allowedTypesKey],
  );

  const {
    control,
    watch,
    setValue,
    reset,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<EventPricingFormData, undefined, EventPricing>({
    resolver: zodResolver(eventPricingSchema),
    defaultValues: initialData || {
      registrationType: undefined,
      paid: false,
      registrationFee: undefined,
      donationTarget: undefined,
      limited: false,
      registrationAttendees: undefined,
      tickets: [],
    },
  });

  const lastEmitted = useRef<EventPricing | null>(null);

  useEffect(() => {
    if (initialData) {
      const emitted = lastEmitted.current;
      // A parent echo must not reset unfinished Paid or Limited fields.
      if (
        onChange &&
        emitted &&
        initialData.registrationType === emitted.registrationType &&
        initialData.registrationFee === emitted.registrationFee &&
        initialData.registrationAttendees === emitted.registrationAttendees &&
        initialData.donationTarget === emitted.donationTarget &&
        JSON.stringify(initialData.tickets) === JSON.stringify(emitted.tickets)
      )
        return;
      reset(initialData);
      return;
    }

    if (normalizedAllowedRegistrationTypes.length === 1) {
      reset({
        registrationType: normalizedAllowedRegistrationTypes[0],
        paid: false,
        registrationFee: undefined,
        donationTarget: undefined,
        limited: false,
        registrationAttendees: undefined,
        tickets: [],
      });
    }
  }, [initialData, normalizedAllowedRegistrationTypes, onChange, reset]);

  const registrationType = watch("registrationType");
  const paid = watch("paid");
  const limited = watch("limited");
  const isPricingTypeLocked = editMode && Boolean(registrationType);
  const showTypeSelector =
    normalizedAllowedRegistrationTypes.length > 1 && !isPricingTypeLocked;
  const ticketsSignature = JSON.stringify(tickets ?? []);
  const syncedTickets = useMemo(
    () => JSON.parse(ticketsSignature) as EventTicket[],
    [ticketsSignature],
  );

  const ErrorText = ({ message }: { message?: string }) =>
    message ? <Text style={tw`text-red-500`}>{message}</Text> : null;
  const onError = (errors: any) => {
    showGlobalError("Error in form");
    console.log(errors);
  };

  useEffect(() => {
    if (
      registrationType &&
      !normalizedAllowedRegistrationTypes.includes(registrationType)
    ) {
      setValue("registrationType", normalizedAllowedRegistrationTypes[0], {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }
  }, [
    normalizedAllowedRegistrationTypes,
    allowedTypesKey,
    registrationType,
    setValue,
  ]);

  useEffect(() => {
    setValue("tickets", syncedTickets, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [setValue, syncedTickets]);

  useEffect(() => {
    if (!onChange) return;
    const data = normalizeEventPricing({
      ...getValues(),
      tickets: syncedTickets,
    });
    lastEmitted.current = data;
    onChange(data);
  }, [getValues, onChange, syncedTickets]);

  const changeField: typeof setValue = (name, value) => {
    setValue(name, value, {
      shouldDirty: true,
      shouldValidate: Boolean(onChange),
    });
    if (onChange) {
      const data = normalizeEventPricing({
        ...getValues(),
        tickets: syncedTickets,
      });
      lastEmitted.current = data;
      onChange(data);
    }
  };

  const onSubmit = (data: EventPricing) => {
    onSave?.(normalizeEventPricing(data));
  };

  const onDelete = (id: string) => {
    const updatedTickets = tickets?.filter((ticket) => ticket.id !== id);
    setTicket(updatedTickets ?? []);
  };

  const changePricing = (type: EventPricing["registrationType"]) => {
    if (
      isPricingTypeLocked ||
      !normalizedAllowedRegistrationTypes.includes(type)
    ) {
      return;
    }

    changeField("registrationType", type);
  };

  return (
    <>
      <CustomView style={compact ? tw`mb-4` : tw`mb-16`}>
        {showTypeSelector ? (
          <Controller
            control={control}
            name="registrationType"
            render={() => (
              <CustomView style={tw`flex-row justify-between flex-wrap`}>
                {normalizedAllowedRegistrationTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    disabled={isPricingTypeLocked}
                    onPress={() => changePricing(type)}
                    style={[
                      tw`mt-3 items-center justify-center rounded-xl p-5`,
                      registrationType === type
                        ? tw`bg-[#0FF1CF]`
                        : tw`bg-[#101C45]`,
                      {
                        width:
                          normalizedAllowedRegistrationTypes.length === 2
                            ? "48%"
                            : "30%",
                      },
                    ]}
                  >
                    <Text
                      style={twStyle(
                        "text-center text-sm",
                        registrationType === type
                          ? "text-[#01082E]"
                          : "text-white",
                      )}
                    >
                      {registrationTypeContent[type].label}
                    </Text>
                    <Text
                      style={[
                        tw`mt-1 text-center text-xs`,
                        registrationType === type
                          ? tw`text-[#153B47]`
                          : tw`text-[#8FA5E2]`,
                      ]}
                    >
                      {registrationTypeContent[type].helper}
                    </Text>
                  </TouchableOpacity>
                ))}
              </CustomView>
            )}
          />
        ) : (
          <></>
        )}

        {isPricingTypeLocked && (
          <Text style={tw`mt-3 text-xs text-gray-400`}>
            Participation type is fixed after publishing.
          </Text>
        )}

        {registrationType === "ticket" && (
          <CustomView>
            <TouchableOpacity
              style={tw`flex-row gap-3 items-center mt-4`}
              onPress={() => createTicket()}
            >
              <PlusCircle size={15} color="#0FF1CF" />
              <Text style={tw`text-[#0FF1CF]`}>Add New Ticket</Text>
            </TouchableOpacity>

            {tickets?.map((ticket) => (
              <CustomView key={ticket.id} style={tw`my-5`}>
                <PricingCard
                  updatedPrice={ticket.updatedPrice}
                  isVisible={ticket.isVisible}
                  isNew={editMode ? false : ticket.isNew}
                  title={ticket.type}
                  description={ticket.description}
                  price={ticket?.price || "Free"}
                  isEdit
                  onDelete={editMode ? undefined : () => onDelete(ticket.id)}
                  onEdit={() => (onEdit ? onEdit(ticket) : null)}
                />
              </CustomView>
            ))}
          </CustomView>
        )}

        {registrationType === "registration" && (
          <CustomView>
            <CustomView>
              <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text style={tw`text-white`}>
                  {limited ? "Limited" : "Unlimited"}
                </Text>
                <Controller
                  name="limited"
                  control={control}
                  render={({ field: { value } }) => (
                    <CustomSwitcher
                      isEnabled={value}
                      setIsEnabled={(value) => changeField("limited", value)}
                    />
                  )}
                />
              </View>

              {limited && (
                <Controller
                  name="registrationAttendees"
                  control={control}
                  render={({ field: { value } }) => (
                    <>
                      <Input
                        insideBottomSheet={insideBottomSheet}
                        numeric
                        moneyFormat
                        onChangeText={(text) =>
                          changeField("registrationAttendees", text)
                        }
                        value={value?.toString()}
                        placeholder="Number of attendees"
                      />
                      <ErrorText
                        message={errors.registrationAttendees?.message}
                      />
                    </>
                  )}
                />
              )}
            </CustomView>

            <CustomView>
              <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text style={tw`text-white`}>{paid ? "Paid" : "Free"}</Text>
                <Controller
                  name="paid"
                  control={control}
                  render={({ field: { value } }) => (
                    <CustomSwitcher
                      isEnabled={value}
                      setIsEnabled={(value) => changeField("paid", value)}
                    />
                  )}
                />
              </View>

              {paid && (
                <Controller
                  name="registrationFee"
                  control={control}
                  render={({ field: { value } }) => (
                    <>
                      <Input
                        insideBottomSheet={insideBottomSheet}
                        onChangeText={(text) =>
                          changeField("registrationFee", text)
                        }
                        value={value?.toString()}
                        placeholder="Price"
                        moneyFormat
                      />
                      <ErrorText message={errors.registrationFee?.message} />
                    </>
                  )}
                />
              )}
            </CustomView>
          </CustomView>
        )}

        {registrationType === "donation" && (
          <CustomView>
            <CustomView>
              <Controller
                name="donationTarget"
                control={control}
                render={({ field: { value } }) => (
                  <>
                    <Input
                      insideBottomSheet={insideBottomSheet}
                      numeric
                      moneyFormat
                      onChangeText={(text) =>
                        changeField(
                          "donationTarget",
                          text === ""
                            ? undefined
                            : Math.round(Number(text) * 100),
                        )
                      }
                      value={
                        value === undefined || value === ""
                          ? ""
                          : String(Number(value) / 100)
                      }
                      placeholder="Target in ₦ (minimum ₦5,000)"
                    />
                    <ErrorText message={errors.donationTarget?.message} />
                  </>
                )}
              />
            </CustomView>
          </CustomView>
        )}
        {onSave && registrationType ? (
          <CustomButton
            onPress={handleSubmit(onSubmit, onError)}
            disabled={registrationType === "ticket" && tickets?.length === 0}
            showArrow={false}
            buttonClassName="bg-[#0FF1CF] w-full mt-10"
            textClassName="!text-black"
            title={submitLabel}
          />
        ) : null}
      </CustomView>
    </>
  );
};

export default Pricing;
