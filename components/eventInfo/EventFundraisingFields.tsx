import CustomSwitcher from "@/components/CustomSwitcher";
import Input from "@/components/inputs/CustomInput1";
import type { EventData } from "@/types/auth";
import type { EventFormData } from "@/schemas/event";
import { Controller, useWatch, type UseFormReturn } from "react-hook-form";
import { Text, View } from "react-native";
import tw from "twrnc";

export default function EventFundraisingFields({
  control,
  setValue,
  savedTarget,
}: Pick<UseFormReturn<EventFormData>, "control" | "setValue"> & {
  savedTarget?: EventData["donationTarget"];
}) {
  const [registrationType, enabled] = useWatch({
    control,
    name: ["registrationType", "donationsEnabled"],
  });
  if (registrationType !== "volunteer") return null;
  return (
    <View style={tw`gap-3 px-5 py-5`}>
      <View style={tw`flex-row items-center gap-3`}>
        <View style={tw`flex-1`}>
          <Text style={tw`text-lg font-semibold text-white`}>
            Optional donations
          </Text>
          <Text style={tw`mt-1 text-sm leading-5 text-[#A8BAE4]`}>
            Let people support the event financially. Donating is separate from
            taking part.
          </Text>
        </View>
        <CustomSwitcher
          accessibilityLabel="Accept optional donations"
          isEnabled={enabled}
          setIsEnabled={(value) => {
            setValue("donationsEnabled", value, { shouldValidate: true });
            if (!value)
              setValue("donationTarget", undefined, { shouldValidate: true });
          }}
        />
      </View>
      {enabled ? (
        <Controller
          name="donationTarget"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <Input
                accessibilityLabel="Optional donation target in naira"
                placeholder="Optional target in ₦ (minimum ₦5,000)"
                numeric
                moneyFormat
                value={
                  field.value === undefined ? "" : String(field.value / 100)
                }
                onChangeText={(text) =>
                  field.onChange(
                    text === "" ? undefined : Math.round(Number(text) * 100),
                  )
                }
                error={fieldState.error?.message}
              />
              {field.value === undefined &&
              savedTarget !== undefined &&
              savedTarget !== null ? (
                <Text style={tw`text-xs leading-5 text-[#A8BAE4]`}>
                  Leaving this blank keeps the saved goal. Turn donations off to
                  remove it.
                </Text>
              ) : null}
            </>
          )}
        />
      ) : null}
    </View>
  );
}
