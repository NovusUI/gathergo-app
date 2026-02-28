// In Pricing.tsx, update the component:

import { EventPricing, EventTicket, eventPricingSchema } from "@/schemas/event";
import { showGlobalError, showGlobalWarning } from "@/utils/globalErrorHandler";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, PlusCircle } from "lucide-react-native";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
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
}

const Pricing = ({
  createTicket,
  tickets,
  onSave,
  initialData,
  setTicket,
  onEdit,
  editMode = false,
}: Props) => {
  const {
    control,
    watch,
    setValue,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventPricing>({
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

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const registrationType = watch("registrationType");
  const paid = watch("paid");
  const limited = watch("limited");

  const ErrorText = ({ message }: { message?: string }) =>
    message ? <Text style={tw`text-red-500`}>{message}</Text> : null;
  const onError = (errors: any) => {
    showGlobalError("Error in form");
    console.log(errors);
  };

  useEffect(() => {
    const subscription = watch((value) => {
      console.log("Form changed:", value);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    if (tickets) setValue("tickets", tickets);
  }, [tickets]);

  const onSubmit = (data: EventPricing) => {
    onSave(data);
    console.log(data);
  };

  const onDelete = (id: string) => {
    const updatedTickets = tickets?.filter((ticket) => ticket.id !== id);
    setTicket(updatedTickets ?? []);
  };

  const changePricing = (
    type: "registration" | "ticket" | "donation", // Add donation
    onChange: (event: any) => void
  ) => {
    if (editMode) {
      if (registrationType !== type)
        showGlobalWarning("you can't change pricing types");
      return;
    }

    onChange(type);
  };

  return (
    <>
      <CustomView style={tw`mb-16`}>
        <Controller
          control={control}
          name="registrationType"
          render={({ field: { value, onChange } }) => (
            <CustomView style={tw`flex-row justify-between flex-wrap`}>
              <TouchableOpacity
                onPress={() => changePricing("donation", onChange)} // Add this
                style={tw`${
                  registrationType === "donation"
                    ? "bg-[#0FF1CF]"
                    : "bg-[#101C45]"
                } p-5 rounded-xl mt-3 w-[30%] justify-center items-center`}
              >
                <Text
                  style={tw`${
                    registrationType === "donation"
                      ? "text-black"
                      : "text-white"
                  } text-center text-sm`}
                >
                  Donation
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => changePricing("ticket", onChange)}
                style={tw`${
                  registrationType === "ticket"
                    ? "bg-[#0FF1CF]"
                    : "bg-[#101C45]"
                } p-5 rounded-xl mt-3 w-[30%] justify-center items-center`}
              >
                <Text
                  style={tw`${
                    registrationType === "ticket" ? "text-black" : "text-white"
                  } text-center text-sm`}
                >
                  Ticket
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => changePricing("registration", onChange)}
                style={tw`${
                  registrationType === "registration"
                    ? "bg-[#0FF1CF]"
                    : "bg-[#101C45]"
                } p-5 rounded-xl mt-3 w-[30%] justify-center items-center`}
              >
                <Text
                  style={tw`${
                    registrationType === "registration"
                      ? "text-black"
                      : "text-white"
                  } text-center text-sm`}
                >
                  Registration
                </Text>
              </TouchableOpacity>
            </CustomView>
          )}
        />

        {!registrationType && (
          <View style={tw`mt-5 gap-5 flex-row px-5`}>
            <Info color="white" size={15} />
            <Text style={tw`text-white text-sm`}>
              • Ticket: Multiple price options (up to 5 different ticket types)
              {"\n"}• Registration: Single price tag only
              {"\n"}• Donation: Set a fundraising target (minimum ₦50,000)
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

        {registrationType === "donation" && ( // Add this new section
          <CustomView>
            <CustomView>
              <Text style={tw`text-white text-lg mb-3 font-semibold`}>
                Set Donation Target
              </Text>
              <Text style={tw`text-gray-400 mb-4 text-sm`}>
                Minimum donation target: ₦50,000
              </Text>

              <Controller
                name="donationTarget"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <>
                    <Input
                      numeric
                      moneyFormat
                      onChangeText={onChange}
                      value={value?.toString()}
                      placeholder="₦50,000 minimum"
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
