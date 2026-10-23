import type { EventFormData } from "@/schemas/event";
import { Text, TouchableOpacity, View } from "react-native";
import tw, { style as twStyle } from "twrnc";
import CustomView from "../View";
import CustomButton from "../buttons/CustomBtn1";
import Input from "../inputs/CustomInput1";

interface LocationProps {
  value: string;
  isPhysicalEvent?: boolean;
  onChange: (
    payload: Pick<EventFormData, "location" | "isPhysicalEvent">,
  ) => void;
  onSave?: () => void;
  insideBottomSheet?: boolean;
  physicalOnly?: boolean;
  submitLabel?: string;
}

const Location = ({
  value,
  isPhysicalEvent = true,
  onChange,
  onSave,
  insideBottomSheet = false,
  physicalOnly = false,
  submitLabel = "Save and Continue",
}: LocationProps) => {
  const physicalEvent = physicalOnly || isPhysicalEvent;

  return (
    <View style={tw`w-full`}>
      {!physicalOnly && (
        <View style={tw`mb-5 flex-row gap-3`}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onChange({ location: value, isPhysicalEvent: true })}
            style={twStyle(
              "flex-1 rounded-2xl border px-4 py-4",
              physicalEvent
                ? "border-[#0FF1CF] bg-[#0FF1CF]/12"
                : "border-[#24345A] bg-[#0A173F]",
            )}
          >
            <Text
              style={twStyle(
                "text-base font-semibold",
                physicalEvent ? "text-white" : "text-[#D7E2FF]",
              )}
            >
              Physical event
            </Text>
            <Text
              style={twStyle(
                "mt-1 text-xs",
                physicalEvent ? "text-[#B9FFF4]" : "text-[#7F93C2]",
              )}
            >
              Venue, landmark, or address
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onChange({ location: "", isPhysicalEvent: false })}
            style={twStyle(
              "flex-1 rounded-2xl border px-4 py-4",
              !physicalEvent
                ? "border-[#0FF1CF] bg-[#0FF1CF]/12"
                : "border-[#24345A] bg-[#0A173F]",
            )}
          >
            <Text
              style={twStyle(
                "text-base font-semibold",
                !physicalEvent ? "text-white" : "text-[#D7E2FF]",
              )}
            >
              No physical meetup
            </Text>
            <Text
              style={twStyle(
                "mt-1 text-xs",
                !physicalEvent ? "text-[#B9FFF4]" : "text-[#7F93C2]",
              )}
            >
              Online, remote, or off-site support
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {physicalEvent ? (
        <CustomView style={onSave ? tw`mb-10` : undefined}>
          <Input
            insideBottomSheet={insideBottomSheet}
            placeholder="Venue, landmark, or address"
            onChangeText={(location) =>
              onChange({ location, isPhysicalEvent: physicalEvent })
            }
            value={value}
          />
        </CustomView>
      ) : null}

      {onSave ? (
        <CustomButton
          onPress={onSave}
          disabled={physicalEvent && value.trim().length === 0}
          showArrow={false}
          buttonClassName="bg-[#0FF1CF] w-full"
          textClassName="!text-black"
          title={submitLabel}
        />
      ) : null}
    </View>
  );
};

export default Location;
