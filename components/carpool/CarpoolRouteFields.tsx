import Input from "@/components/inputs/CustomInput1";
import type { CarpoolFormValues } from "@/schemas/carpool";
import { Ionicons } from "@expo/vector-icons";
import { Controller, useWatch, type UseFormReturn } from "react-hook-form";
import { Switch, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

type Props = Pick<UseFormReturn<CarpoolFormValues>, "control" | "setValue"> & {
  eventLocation: string;
};

export default function CarpoolRouteFields({
  control,
  setValue,
  eventLocation,
}: Props) {
  const isToEvent = useWatch({ control, name: "isToEvent" });
  const locationField = isToEvent ? "poolLocation" : "poolDestination";
  const locationLabel = isToEvent ? "Pickup location" : "Destination";
  const venue = (
    <View key="venue" style={tw`flex-row items-start gap-3`}>
      <Ionicons
        name="flag-outline"
        size={20}
        color="#0FF1CF"
        style={tw`mt-1`}
      />
      <View style={tw`flex-1 gap-1`}>
        <Text style={tw`text-xs text-[#8FA5E2]`}>
          {isToEvent ? "Destination · Event venue" : "Pickup · Event venue"}
        </Text>
        <Text style={tw`text-sm font-semibold leading-5 text-white`}>
          {eventLocation}
        </Text>
      </View>
    </View>
  );
  const location = (
    <View key={locationField} style={tw`flex-row items-start gap-3`}>
      <Ionicons
        name="location-outline"
        size={20}
        color="#31C6F6"
        style={tw`mt-1`}
      />
      <View style={tw`flex-1 gap-2`}>
        <Text style={tw`text-sm font-medium text-white`}>{locationLabel}</Text>
        <Controller
          key={locationField}
          control={control}
          name={locationField}
          render={({ field, fieldState }) => (
            <Input
              accessibilityLabel={locationLabel}
              placeholder={
                isToEvent
                  ? "Where will riders meet you?"
                  : "Where are you heading after the event?"
              }
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        {isToEvent && (
          <View style={tw`flex-row items-center justify-between gap-3`}>
            <Text style={tw`flex-1 text-sm text-[#A8BAE4]`}>
              I’m near this pickup spot
            </Text>
            <Controller
              control={control}
              name="useCurrentLocation"
              render={({ field }) => (
                <Switch
                  accessibilityLabel="I’m near this pickup spot"
                  value={field.value}
                  onValueChange={field.onChange}
                  thumbColor={field.value ? "#0FF1CF" : "#555"}
                />
              )}
            />
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={tw`gap-4`}>
      <Controller
        control={control}
        name="isToEvent"
        render={({ field }) => (
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Ride direction"
            style={tw`flex-row rounded-2xl bg-[#0A173F] p-1`}
          >
            {[true, false].map((toEvent) => (
              <TouchableOpacity
                key={String(toEvent)}
                accessibilityRole="radio"
                accessibilityState={{ checked: field.value === toEvent }}
                onPress={() => {
                  field.onChange(toEvent);
                  if (!toEvent) setValue("useCurrentLocation", false);
                }}
                style={[
                  tw`flex-1 min-h-[44px] items-center justify-center rounded-xl px-3 py-3`,
                  field.value === toEvent && tw`bg-[#0FF1CF]`,
                ]}
              >
                <Text
                  style={[
                    tw`text-sm font-semibold`,
                    field.value === toEvent
                      ? tw`text-[#01082E]`
                      : tw`text-[#A8BAE4]`,
                  ]}
                >
                  {toEvent ? "To the event" : "From the event"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />
      <View
        style={tw`gap-3 rounded-2xl border border-[#1B2A50] bg-[#0A173F] p-4`}
      >
        {isToEvent ? location : venue}
        <View style={tw`ml-2 h-4 border-l border-[#34516A]`} />
        {isToEvent ? venue : location}
      </View>
    </View>
  );
}
