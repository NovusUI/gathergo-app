import { EventTicket, eventTicketSchema } from "@/schemas/event";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef } from "react";
import { Controller, Resolver, useForm } from "react-hook-form";
import { Text, View } from "react-native";
import "react-native-get-random-values";
import tw from "twrnc";
import { v4 as uuidv4 } from "uuid";
import CustomSwitcher from "../CustomSwitcher";
import CustomView from "../View";
import CustomButton from "../buttons/CustomBtn1";
import Input from "../inputs/CustomInput1";
import TextArea from "../inputs/CustomTextArea";
import PerksList from "./PerkList";

interface Props {
  setTicket: (updated: EventTicket[]) => void;
  tickets: EventTicket[] | undefined;
  close: () => void;
  editingTicket?: EventTicket | null;
  editMode?: boolean;
  insideBottomSheet?: boolean;
}

const CreateTicket = ({
  setTicket,
  tickets,
  close,
  editingTicket,
  editMode = false,
  insideBottomSheet = false,
}: Props) => {
  const draftTicketIdRef = useRef(uuidv4());
  const createEmptyTicket = useCallback(
    (ticketId = draftTicketIdRef.current): EventTicket => ({
      description: "",
      limited: true,
      quantity: undefined,
      paid: true,
      price: undefined,
      type: "",
      perks: [],
      updatedPrice: undefined,
      isVisible: true,
      isNew: true,
      id: ticketId,
    }),
    []
  );
  const {
    control,
    watch,
    formState: { errors },
    reset,
    handleSubmit,
    setValue,
  } = useForm<EventTicket>({
    resolver: zodResolver(eventTicketSchema) as Resolver<EventTicket>,
    defaultValues: createEmptyTicket(),
  });

  useEffect(() => {
    if (editingTicket) {
      reset(editingTicket); // ✅ Populate form with existing ticket values
    } else {
      reset(createEmptyTicket());
    }
  }, [createEmptyTicket, editingTicket, reset]);

  const ErrorText = ({ message }: { message?: string }) =>
    message ? <Text style={tw`text-sm text-red-400`}>{message}</Text> : null;

  const limited = watch("limited");
  const paid = watch("paid");
  const isNew = watch("isNew");

  const onError = (errors: any) => {
    showGlobalError("Error in form");
    console.log(errors);
  };

  useEffect(() => {
    if (!limited) {
      setValue("quantity", 1000000);
    }
    if (!paid) {
      if (editMode && !isNew) setValue("updatedPrice", 0);
      if (!editMode) setValue("price", 0);
    }
  }, [editMode, isNew, limited, paid, setValue]);

  const resetToNewDraft = () => {
    draftTicketIdRef.current = uuidv4();
    reset(createEmptyTicket(draftTicketIdRef.current));
  };

  const onSubmit = async (data: EventTicket) => {
    const updatedTickets =
      tickets?.filter((ticket) => ticket.id !== data.id) || [];

    setTicket([...updatedTickets, data]);
    close();
    resetToNewDraft();
  };

  const onSubmitAndAddNew = async (data: EventTicket) => {
    const updatedTickets =
      tickets?.filter((ticket) => ticket.id !== data.id) || [];
    setTicket([...updatedTickets, data]);

    showGlobalSuccess("saved successfully");
    resetToNewDraft();
  };

  return (
    <CustomView style={tw`gap-7`}>
      <View style={tw`gap-3`}>
        <View style={tw`gap-1`}>
          <Text style={tw`text-base font-semibold text-white`}>Ticket name</Text>
          <Text style={tw`text-sm leading-5 text-[#8EA3D1]`}>
            Give this tier a clear name people will recognize at checkout.
          </Text>
        </View>
        <Controller
          control={control}
          name="type"
          render={({ field: { value, onChange } }) => (
            <>
              <Input
                insideBottomSheet={insideBottomSheet}
                value={value}
                onChangeText={onChange}
                placeholder="Basic"
              />
              <ErrorText message={errors.type?.message} />
            </>
          )}
        />
      </View>
      <View style={tw`gap-3`}>
        <View style={tw`gap-1`}>
          <Text style={tw`text-base font-semibold text-white`}>
            Ticket description
          </Text>
          <Text style={tw`text-sm leading-5 text-[#8EA3D1]`}>
            Summarize what this ticket covers and who it is best for.
          </Text>
        </View>
        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange } }) => (
            <>
              <TextArea
                insideBottomSheet={insideBottomSheet}
                maxLength={100}
                onChange={onChange}
                value={value}
                placeholder="Perfect for early supporters who want the essentials."
              />
              <ErrorText message={errors.description?.message} />
            </>
          )}
        />
      </View>
      <CustomView style={tw`gap-3`}>
        <View style={tw`gap-1`}>
          <Text style={tw`text-base font-semibold text-white`}>Perks</Text>
          <Text style={tw`text-sm leading-5 text-[#8EA3D1]`}>
            Call out the extras that make this ticket tier worth picking.
          </Text>
        </View>
        <Controller
          control={control}
          name="perks"
          defaultValue={[]}
          render={({ field: { value, onChange } }) => (
            <PerksList
              insideBottomSheet={insideBottomSheet}
              value={value || []}
              onChange={onChange}
            />
          )}
        />
      </CustomView>
      <View style={tw`gap-3`}>
        <View style={tw`flex flex-row justify-between items-center gap-3`}>
          <Text style={tw`text-base font-semibold text-white`}>
            {limited ? "Limited" : "Unlimited"}
          </Text>
          <Controller
            control={control}
            name="limited"
            render={({ field: { value, onChange } }) => (
              <CustomSwitcher isEnabled={value} setIsEnabled={onChange} />
            )}
          />
        </View>
        {limited && (
          <Controller
            control={control}
            name="quantity"
            render={({ field: { value, onChange } }) => (
              <>
                <Input
                  insideBottomSheet={insideBottomSheet}
                  numeric
                  moneyFormat
                  onChangeText={onChange}
                  value={value?.toString() ?? ""}
                  placeholder="enter quantity"
                />
                <ErrorText message={errors.quantity?.message} />
              </>
            )}
          />
        )}
      </View>

      <View style={tw`gap-3`}>
        <View style={tw`flex flex-row justify-between items-center gap-3`}>
          <Text style={tw`text-base font-semibold text-white`}>
            {paid ? "Paid" : "Free"}
          </Text>
          <Controller
            control={control}
            name="paid"
            render={({ field: { value, onChange } }) => (
              <CustomSwitcher isEnabled={value} setIsEnabled={onChange} />
            )}
          />
        </View>
        {paid && (
          <Controller
            control={control}
            name={editMode && !isNew ? "updatedPrice" : "price"}
            render={({ field: { value, onChange } }) => (
              <>
                <Input
                  insideBottomSheet={insideBottomSheet}
                  numeric
                  moneyFormat
                  placeholder="enter price"
                  onChangeText={onChange}
                  value={value?.toString() ?? ""}
                />
                <ErrorText
                  message={
                    editMode && !isNew
                      ? errors.updatedPrice?.message
                      : errors.price?.message
                  }
                />
              </>
            )}
          />
        )}
      </View>
      <View style={tw`gap-3`}>
        <View style={tw`flex flex-row justify-between items-center gap-3`}>
          <Text style={tw`text-base font-semibold text-white`}>
            {watch("isVisible") ? "Visible" : "Hidden"}
          </Text>
          <Controller
            control={control}
            name="isVisible"
            render={({ field: { value, onChange } }) => (
              <CustomSwitcher isEnabled={value} setIsEnabled={onChange} />
            )}
          />
        </View>
      </View>
      <CustomView style={tw`gap-5`}>
        <CustomButton
          onPress={handleSubmit(onSubmit, onError)}
          buttonClassName="bg-[#0FF1CF] w-full"
          showArrow={false}
          textClassName="!text-black"
          title="Save ticket"
        />
        <CustomButton
          onPress={handleSubmit(onSubmitAndAddNew, onError)}
          buttonClassName={"border-[#0FF1CF] w-full"}
          textClassName="!text-[#0FF1CF]"
          showArrow={false}
          title="Save and add new ticket"
        />
      </CustomView>
    </CustomView>
  );
};

export default CreateTicket;
