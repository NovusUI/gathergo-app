import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw, { style as twStyle } from "twrnc";
import CustomView from "../View";
import CustomButton from "../buttons/CustomBtn1";
import Input from "../inputs/CustomInput1";

interface LocationProps {
  value: string;
  isPhysicalEvent?: boolean;
  onSave: (payload: { location: string; isPhysicalEvent: boolean }) => void;
  insideBottomSheet?: boolean;
}

const Location = ({
  value,
  isPhysicalEvent = true,
  onSave,
  insideBottomSheet = false,
}: LocationProps) => {
  const [location, setLocation] = useState(value || "");
  const [physicalEvent, setPhysicalEvent] = useState(isPhysicalEvent);

  return (
    <View style={tw`w-full`}>
      <View style={tw`mb-5 gap-2`}>
        <Text style={tw`text-lg font-semibold text-white`}>
          Is there a physical meetup?
        </Text>
        <Text style={tw`text-sm leading-5 text-[#A8BAE4]`}>
          Physical events can unlock carpool. If it&apos;s not happening in a
          real-world location, we&apos;ll skip carpool and location prompts.
        </Text>
      </View>

      <View style={tw`mb-5 flex-row gap-3`}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setPhysicalEvent(true)}
          style={twStyle(
            "flex-1 rounded-2xl border px-4 py-4",
            physicalEvent
              ? "border-[#0FF1CF] bg-[#0FF1CF]/12"
              : "border-[#24345A] bg-[#0A173F]"
          )}
        >
          <Text
            style={twStyle(
              "text-base font-semibold",
              physicalEvent ? "text-white" : "text-[#D7E2FF]"
            )}
          >
            Physical event
          </Text>
          <Text
            style={twStyle(
              "mt-1 text-xs",
              physicalEvent ? "text-[#B9FFF4]" : "text-[#7F93C2]"
            )}
          >
            Venue, landmark, or address
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setPhysicalEvent(false)}
          style={twStyle(
            "flex-1 rounded-2xl border px-4 py-4",
            !physicalEvent
              ? "border-[#0FF1CF] bg-[#0FF1CF]/12"
              : "border-[#24345A] bg-[#0A173F]"
          )}
        >
          <Text
            style={twStyle(
              "text-base font-semibold",
              !physicalEvent ? "text-white" : "text-[#D7E2FF]"
            )}
          >
            No physical meetup
          </Text>
          <Text
            style={twStyle(
              "mt-1 text-xs",
              !physicalEvent ? "text-[#B9FFF4]" : "text-[#7F93C2]"
            )}
          >
            Online, remote, or off-site support
          </Text>
        </TouchableOpacity>
      </View>

      {physicalEvent ? (
        <CustomView style={tw`mb-10`}>
          <Input
            insideBottomSheet={insideBottomSheet}
            placeholder="Venue, landmark, or address"
            onChangeText={setLocation}
            value={location}
          />
        </CustomView>
      ) : (
        <View style={tw`mb-10 rounded-2xl border border-[#24345A] bg-[#0A173F] p-4`}>
          <Text style={tw`text-sm leading-5 text-[#B7C5E9]`}>
            Since this event isn&apos;t physical, people won&apos;t see location
            or carpool prompts for it.
          </Text>
        </View>
      )}

      <CustomButton
        onPress={() =>
          onSave({
            location: physicalEvent ? location.trim() : "",
            isPhysicalEvent: physicalEvent,
          })
        }
        disabled={physicalEvent && location.trim().length === 0}
        showArrow={false}
        buttonClassName="bg-[#0FF1CF] w-full"
        textClassName="!text-black"
        title="Save and Continue"
      />
    </View>
  );
};

export default Location;
