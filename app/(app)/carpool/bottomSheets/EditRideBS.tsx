import CustomEventInfoSelector from "@/components/CustomEventInfoSelector";
import CustomButton from "@/components/buttons/CustomBtn1";
import Input from "@/components/inputs/CustomInput1";
import { QUERY_KEYS } from "@/services/queryKeys";
import { useUpdateCarpool } from "@/services/mutations";
import { extractTime } from "@/utils/dateTimeHandler";
import {
  showGlobalError,
  showGlobalSuccess,
  showGlobalWarning,
} from "@/utils/globalErrorHandler";
import { formatTo12Hour } from "@/utils/utils";
import { useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

export type EditRideBSRef = {
  open: () => void;
  close: () => void;
};

type EditRideBSProps = {
  carpoolId: string;
  origin: string;
  departureTime: string;
  note?: string | null;
};

const EditRideBS = forwardRef<EditRideBSRef, EditRideBSProps>(
  ({ carpoolId, origin, departureTime, note }, ref) => {
    const queryClient = useQueryClient();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["88%"], []);
    const [pickupLocation, setPickupLocation] = useState(origin || "");
    const [nextDepartureTime, setNextDepartureTime] = useState(
      departureTime || ""
    );
    const [rideNote, setRideNote] = useState(note ?? "");
    const [showTimePicker, setShowTimePicker] = useState(false);

    useEffect(() => {
      setPickupLocation(origin || "");
    }, [origin]);

    useEffect(() => {
      setNextDepartureTime(departureTime || "");
    }, [departureTime]);

    useEffect(() => {
      setRideNote(note ?? "");
    }, [note]);

    const { mutateAsync, isPending } = useUpdateCarpool(carpoolId, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.carpoolDetails, carpoolId],
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.carpoolForYou,
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.eventCarpoolsPaginated,
        });

        showGlobalSuccess("Ride details updated");
        bottomSheetRef.current?.close();
      },
      onError: (error) => {
        const axiosError = error as AxiosError<{ message?: string }>;
        showGlobalError(
          axiosError.response?.data?.message ||
            axiosError.message ||
            "Couldn't update ride details"
        );
      },
    });

    const saveRideDetails = async () => {
      const trimmedPickupLocation = pickupLocation.trim();
      const trimmedOriginalLocation = origin.trim();
      const trimmedRideNote = rideNote.trim();
      const trimmedOriginalNote = (note ?? "").trim();

      if (!trimmedPickupLocation) {
        showGlobalError("Pickup location is required");
        return;
      }

      if (!nextDepartureTime) {
        showGlobalError("Choose a departure time");
        return;
      }

      const payload: {
        origin?: string;
        departureTime?: string;
        note?: string;
      } = {};

      if (trimmedPickupLocation !== trimmedOriginalLocation) {
        payload.origin = trimmedPickupLocation;
      }

      if (nextDepartureTime !== departureTime) {
        payload.departureTime = nextDepartureTime;
      }

      if (trimmedRideNote !== trimmedOriginalNote) {
        payload.note = trimmedRideNote;
      }

      if (Object.keys(payload).length === 0) {
        showGlobalWarning("No ride details changed");
        bottomSheetRef.current?.close();
        return;
      }

      await mutateAsync(payload);
    };

    useImperativeHandle(ref, () => ({
      open: () => bottomSheetRef.current?.snapToIndex(0),
      close: () => bottomSheetRef.current?.close(),
    }));

    return (
      <>
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={(props) => (
            <BottomSheetBackdrop
              {...props}
              disappearsOnIndex={-1}
              appearsOnIndex={0}
            />
          )}
          backgroundStyle={{ backgroundColor: "#041130" }}
        >
          <BottomSheetScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 180,
            }}
          >
            <View style={tw`gap-5`}>
              <View style={tw`flex-row items-start justify-between gap-4`}>
                <View style={tw`flex-1 gap-2`}>
                  <Text style={tw`text-2xl font-semibold text-white`}>
                    Edit ride details
                  </Text>
                  <Text style={tw`text-sm leading-5 text-[#A8BAE4]`}>
                    Update the pickup point, departure time, or note. Riders in
                    the carpool will get the update in chat.
                  </Text>
                </View>
                <TouchableOpacity onPress={() => bottomSheetRef.current?.close()}>
                  <Text style={tw`text-sm font-semibold text-[#9FB0D8]`}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={tw`rounded-[28px] bg-[#0A173F] p-5 gap-4`}>
                <View style={tw`gap-2`}>
                  <Text style={tw`text-sm font-semibold text-white`}>
                    Pickup location
                  </Text>
                  <Input
                    insideBottomSheet
                    placeholder="Where riders should meet you"
                    value={pickupLocation}
                    onChangeText={setPickupLocation}
                  />
                </View>

                <View style={tw`gap-2`}>
                  <Text style={tw`text-sm font-semibold text-white`}>
                    Departure time
                  </Text>
                  <CustomEventInfoSelector
                    title="set time"
                    value={
                      nextDepartureTime ? formatTo12Hour(nextDepartureTime) : ""
                    }
                    onPress={() => setShowTimePicker(true)}
                  />
                </View>

                <View style={tw`gap-2`}>
                  <Text style={tw`text-sm font-semibold text-white`}>
                    Ride note
                  </Text>
                  <View
                    style={tw`rounded-2xl bg-[#1B2A50]/40 px-4 py-4 min-h-[132px]`}
                  >
                    <BottomSheetTextInput
                      value={rideNote}
                      onChangeText={setRideNote}
                      multiline
                      textAlignVertical="top"
                      maxLength={200}
                      placeholder="Add anything riders should know"
                      placeholderTextColor="#9CA3AF"
                      style={tw`min-h-[96px] text-base text-white`}
                    />
                    <Text style={tw`mt-2 text-right text-xs text-[#7F93C2]`}>
                      {rideNote.length}/200
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </BottomSheetScrollView>

          <View style={tw`w-screen max-w-[500px] p-5`}>
            <CustomButton
              title={isPending ? "Saving changes" : "Save changes"}
              buttonClassName="bg-[#0FF1CF] w-full border-0"
              textClassName="!text-black"
              showArrow={false}
              onPress={saveRideDetails}
              disabled={isPending}
            />
          </View>
        </BottomSheet>

        <DateTimePickerModal
          isVisible={showTimePicker}
          mode="time"
          onConfirm={(selectedDate) => {
            setNextDepartureTime(extractTime(selectedDate));
            setShowTimePicker(false);
          }}
          onCancel={() => setShowTimePicker(false)}
        />
      </>
    );
  }
);

EditRideBS.displayName = "EditRideBS";

export default EditRideBS;
