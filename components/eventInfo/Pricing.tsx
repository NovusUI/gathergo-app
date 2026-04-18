import { EventPricing, EventTicket, eventPricingSchema } from "@/schemas/event";
import { showGlobalError } from "@/utils/globalErrorHandler";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, PlusCircle } from "lucide-react-native";
import { useEffect, useMemo } from "react";
import { Controller, Resolver, useForm } from "react-hook-form";
import { Text, TouchableOpacity, View } from "react-native";
import tw, { style as twStyle } from "twrnc";
import CustomSwitcher from "../CustomSwitcher";
import CustomView from "../View";
import CustomButton from "../buttons/CustomBtn1";
import Input from "../inputs/CustomInput1";
import PricingCard from "./TicketCard";

interface Props {
  createTicket: () => void;
  onSave: (data: EventPricing) => void;
  tickets: EventTicket[] | undefined;
  initialData?: EventPricing | null;
  setTicket: (updated: EventTicket[]) => void;
  onEdit?: (data: EventTicket) => void;
  editMode?: boolean;
  insideBottomSheet?: boolean;
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
    helper: "Set a fundraising goal. The impact stays locked to 100%.",
  },
  ticket: {
    label: "Ticket",
    helper: "Offer multiple ticket tiers for the same event.",
  },
  registration: {
    label: "Registration",
    helper: "Use a single free or paid entry option.",
  },
} satisfies Record<
  EventPricing["registrationType"],
  { label: string; helper: string }
>;

const Pricing = ({
  createTicket,
  tickets,
  onSave,
  initialData,
  setTicket,
  onEdit,
  editMode = false,
  insideBottomSheet = false,
  allowedRegistrationTypes = ALL_REGISTRATION_TYPES,
}: Props) => {
  const allowedTypesKey = allowedRegistrationTypes.join("|");
  const normalizedAllowedRegistrationTypes = useMemo(
    () =>
      (allowedTypesKey
        ? allowedTypesKey.split("|")
        : [...ALL_REGISTRATION_TYPES]) as EventPricing["registrationType"][],
    [allowedTypesKey]
  );

  const {
    control,
    watch,
    setValue,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<EventPricing>({
    resolver: zodResolver(eventPricingSchema) as Resolver<EventPricing>,
    defaultValues: initialData || {
      registrationType: undefined as unknown as EventPricing["registrationType"],
      paid: false,
      registrationFee: undefined,
      donationTarget: undefined,
      limited: false,
      registrationAttendees: undefined,
      tickets: [],
    },
  });

  useEffect(() => {
    if (initialData) {
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
  }, [initialData, normalizedAllowedRegistrationTypes, reset]);

  const registrationType = watch("registrationType");
  const paid = watch("paid");
  const limited = watch("limited");
  const isPricingTypeLocked = editMode && Boolean(registrationType);
  const showTypeSelector =
    normalizedAllowedRegistrationTypes.length > 1 && !isPricingTypeLocked;
  const ticketsSignature = JSON.stringify(tickets ?? []);
  const syncedTickets = useMemo(
    () => JSON.parse(ticketsSignature) as EventTicket[],
    [ticketsSignature]
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

  const onSubmit = (data: EventPricing) => {
    onSave(data);
  };

  const onDelete = (id: string) => {
    const updatedTickets = tickets?.filter((ticket) => ticket.id !== id);
    setTicket(updatedTickets ?? []);
  };

  const changePricing = (
    type: "registration" | "ticket" | "donation",
    onChange: (event: EventPricing["registrationType"]) => void
  ) => {
    if (
      isPricingTypeLocked ||
      !normalizedAllowedRegistrationTypes.includes(type)
    ) {
      return;
    }

    onChange(type);
  };

  return (
    <>
      <CustomView style={tw`mb-16`}>
        {showTypeSelector ? (
          <Controller
            control={control}
            name="registrationType"
            render={({ field: { onChange } }) => (
              <CustomView style={tw`flex-row justify-between flex-wrap`}>
                {normalizedAllowedRegistrationTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    disabled={isPricingTypeLocked}
                    onPress={() => changePricing(type, onChange)}
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
                        registrationType === type ? "text-black" : "text-white"
                      )}
                    >
                      {registrationTypeContent[type].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </CustomView>
            )}
          />
        ) : (
          <View style={tw`mt-3 rounded-2xl bg-[#08143B] p-4`}>
            <Text style={tw`text-sm font-semibold text-white`}>
              {
                registrationTypeContent[normalizedAllowedRegistrationTypes[0]]
                  .label
              }{" "}
              setup
            </Text>
            <Text style={tw`mt-2 text-sm leading-5 text-[#A9B8DD]`}>
              {
                registrationTypeContent[normalizedAllowedRegistrationTypes[0]]
                  .helper
              }
            </Text>
          </View>
        )}

        {isPricingTypeLocked && (
          <Text style={tw`mt-3 text-xs text-gray-400`}>
            Pricing type cannot be changed after the event is created.
          </Text>
        )}

        {!registrationType && showTypeSelector && (
          <View style={tw`mt-5 gap-5 flex-row px-5`}>
            <Info color="white" size={15} />
            <Text style={tw`text-white text-sm`}>
              • Ticket: Multiple price options (up to 5 different ticket types)
              {"\n"}• Registration: Single price tag only
            </Text>
          </View>
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
                  isNew={ticket.isNew}
                  title={ticket.type}
                  description={ticket.description}
                  price={ticket?.price || "Free"}
                  isEdit
                  onDelete={() => onDelete(ticket.id)}
                  onEdit={() => (onEdit ? onEdit(ticket) : null)}
                />
              </CustomView>
            ))}

            <CustomButton
              onPress={handleSubmit(onSubmit, onError)}
              disabled={tickets?.length === 0}
              showArrow={false}
              buttonClassName="bg-[#0FF1CF] w-full mt-10"
              textClassName="!text-black"
              title="Save and Continue"
            />
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
                  render={({ field: { value, onChange } }) => (
                    <CustomSwitcher isEnabled={value} setIsEnabled={onChange} />
                  )}
                />
              </View>

              {limited && (
                <Controller
                  name="registrationAttendees"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <>
                      <Input
                        insideBottomSheet={insideBottomSheet}
                        numeric
                        moneyFormat
                        onChangeText={onChange}
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
                  render={({ field: { value, onChange } }) => (
                    <CustomSwitcher isEnabled={value} setIsEnabled={onChange} />
                  )}
                />
              </View>

              {paid && (
                <Controller
                  name="registrationFee"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <>
                      <Input
                        insideBottomSheet={insideBottomSheet}
                        onChangeText={onChange}
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

            <CustomButton
              onPress={handleSubmit(onSubmit, onError)}
              showArrow={false}
              buttonClassName="bg-[#0FF1CF] w-full mt-10"
              textClassName="!text-black"
              title="Save and Continue"
            />
          </CustomView>
        )}

        {registrationType === "donation" && (
          <CustomView>
            <CustomView>
              <Text style={tw`text-white text-lg mb-3 font-semibold`}>
                Set Donation Target
              </Text>
              <Text style={tw`text-gray-400 mb-4 text-sm`}>
                Minimum donation target: ₦500,000
              </Text>

              <Controller
                name="donationTarget"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <>
                    <Input
                      insideBottomSheet={insideBottomSheet}
                      numeric
                      moneyFormat
                      onChangeText={onChange}
                      value={value?.toString()}
                      placeholder="₦500,000 minimum"
                    />
                    <ErrorText message={errors.donationTarget?.message} />
                    <Text style={tw`text-gray-400 mt-2 text-xs`}>
                      This is the fundraising goal for your event
                    </Text>
                  </>
                )}
              />
            </CustomView>

            <CustomButton
              onPress={handleSubmit(onSubmit, onError)}
              showArrow={false}
              buttonClassName="bg-[#0FF1CF] w-full mt-10"
              textClassName="!text-black"
              title="Save and Continue"
            />
          </CustomView>
        )}
      </CustomView>
    </>
  );
};

export default Pricing;
