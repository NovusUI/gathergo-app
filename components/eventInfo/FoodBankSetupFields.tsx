import { Controller, type Control } from "react-hook-form";
import { Text, View } from "react-native";
import type { EventFormData } from "@/schemas/event";
import { useAppTheme } from "@/hooks/useAppTheme";
import Input from "@/components/inputs/CustomInput1";
import InfoDisclosure from "@/components/ui/InfoDisclosure";

const fields = [
  {
    name: "foodBankTotalMeals",
    label: "Total meals available",
    placeholder: "e.g. 1000",
  },
  {
    name: "foodBankSlotCapacity",
    label: "People per arrival window",
    placeholder: "e.g. 25",
  },
  {
    name: "foodBankSlotMinutes",
    label: "Minutes per window (5–120)",
    placeholder: "e.g. 15",
  },
] as const;

export default function FoodBankSetupFields({
  control,
}: {
  control: Control<EventFormData>;
}) {
  const { tw } = useAppTheme();
  return (
    <View style={tw`gap-4`}>
      <InfoDisclosure
        label="Collection info"
        message="Each person receives one meal pass. Arrival windows help pace visits; staff can serve people earlier or later while collection is open. Use the event dates as planned collection hours. Manage collection lets you start, pause, close or reschedule. Meal capacity and arrival settings lock after the first pass."
      />
      {fields.map(({ name, label, placeholder }) => (
        <View key={name} style={tw`gap-2`}>
          <Text style={tw`text-foreground dark:text-white`}>{label}</Text>
          <Controller
            name={name}
            control={control}
            render={({ field, fieldState }) => (
              <Input
                numeric
                accessibilityLabel={label}
                placeholder={placeholder}
                value={field.value === undefined ? "" : String(field.value)}
                onChangeText={(text) =>
                  field.onChange(text === "" ? undefined : Number(text))
                }
                error={fieldState.error?.message}
              />
            )}
          />
        </View>
      ))}
      <Controller
        name="donationTarget"
        control={control}
        render={({ field, fieldState }) => (
          <Input
            numeric
            moneyFormat
            accessibilityLabel="Optional fundraising target in naira"
            placeholder="Optional fundraising target in ₦"
            value={field.value === undefined ? "" : String(field.value / 100)}
            onChangeText={(text) =>
              field.onChange(
                text === "" ? undefined : Math.round(Number(text) * 100),
              )
            }
            error={fieldState.error?.message}
          />
        )}
      />
    </View>
  );
}
