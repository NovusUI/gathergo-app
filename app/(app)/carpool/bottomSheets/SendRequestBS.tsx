import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import SheetCloseButton from "@/components/buttons/SheetCloseButton";
import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import Input from "@/components/inputs/CustomInput1";
import TextArea from "@/components/inputs/CustomTextArea";
import { useLocationManager } from "@/hooks/useLocationManager";
import { carpoolSchema } from "@/schemas/carpool";
import { useRequestCarpool } from "@/services/mutations";
import { QUERY_KEYS } from "@/services/queryKeys";
import {
  showGlobalError,
  showGlobalSuccess,
  showGlobalWarning,
} from "@/utils/globalErrorHandler";
import { useQueryClient } from "@tanstack/react-query";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";

export type SendRequestBSRef = {
  open: () => void;
  close: () => void;
};

export type SendRequestProp = {
  carpoolId: string;
  onRequestSuccess?: (response: any) => void;
  onHasExistingCarpool?: (response: any) => void;
};

const SendRequestBS = forwardRef<SendRequestBSRef, SendRequestProp>(
  ({ carpoolId, onRequestSuccess, onHasExistingCarpool }, ref) => {
  const { tw } = useAppTheme();
    const { coords, requestLocation, error, openSettings } =
      useLocationManager();
    const [useCurrentLocation, setUseCurrentLocation] = useState(false);

    const toggleNearby = async () => {
      const c = await requestLocation(true);
      if (!c) {
        showGlobalWarning(
          "Enable location in settings to use current location"
        );
        setUseCurrentLocation(false);
        return;
      }
    };

    const queryClient = useQueryClient();

    useEffect(() => {
      if (useCurrentLocation) {
        toggleNearby();
      }
    }, [useCurrentLocation]);

    const [poolLocation, setPoolLocation] = useState("");
    const [notes, setNotes] = useState("");
    const [isVisible, setIsVisible] = useState(false);

    // expose open/close methods
    useImperativeHandle(ref, () => ({
      open: () => {
        // Reset form when opening
        setPoolLocation("");
        setNotes("");
        setUseCurrentLocation(false);
        setIsVisible(true);
      },
      close: () => setIsVisible(false),
    }));

    const { mutateAsync, isPending } = useRequestCarpool(carpoolId, {
      onSuccess: (response) => {
        // Check if user has an existing carpool
        if (response.data.hasExistingCarpool) {
          // Pass the response to parent component to handle the modal
          if (onHasExistingCarpool) {
            onHasExistingCarpool(response);
          }
          return;
        }

        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.carpoolDetails, carpoolId],
        });

        if (response.data.message) {
          showGlobalSuccess(response.message);
        } else {
          showGlobalSuccess("Request sent successfully");
        }
        setIsVisible(false);

        // Notify parent of success
        if (onRequestSuccess) {
          onRequestSuccess(response);
        }
      },
      onError: () => {
        showGlobalError("Error requesting carpool");
      },
    });

    const sendRequest = () => {
      const trimmedLocation = poolLocation.trim();
      const parsed = carpoolSchema.safeParse({
        isToEvent: true,
        poolLocation:
          trimmedLocation || (useCurrentLocation ? "Current location" : ""),
        useCurrentLocation,
        poolDestination: "",
        departureTime: "00:00",
        availableSeats: 1,
        notes,
      });

      if (!parsed.success) {
        showGlobalWarning(
          parsed.error.issues[0]?.message ||
            "Tell the pooler where you are requesting from"
        );
        return;
      }

      mutateAsync({
        origin: trimmedLocation || "Current location",
        ...(notes.trim().length ? { note: notes.trim() } : {}),
        ...(useCurrentLocation && coords ? { startPoint: coords } : {}),
      });
    };

    return (
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsVisible(false)}
      >
        <KeyboardAvoidingView
          style={tw`flex-1 justify-end bg-black/55`}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <SafeAreaView edges={["left", "right", "bottom"]}
            style={tw`w-full max-w-[680px] self-center max-h-[88%] rounded-t-[32px] bg-background dark:bg-[#041130] px-5 pb-4 pt-5`}
          >
            <View
              style={tw`mb-4 h-1.5 w-14 self-center rounded-full bg-surfaceMuted dark:bg-[#2B3C66]`}
            />

            <View style={tw`flex-row items-center justify-between`}>
              <View style={tw`flex-1 pr-4`}>
                <Text style={tw`text-xl font-semibold text-foreground dark:text-white`}>
                  Request a ride
                </Text>
              </View>
              <SheetCloseButton
                accessibilityLabel="Close ride request sheet"
                onPress={() => setIsVisible(false)}
              />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={tw`pt-4 pb-5`}
            >
              {Boolean(error) && (
                <View
                  style={tw`rounded-[24px] border border-border dark:border-[#7B2C2C] bg-dangerSoft dark:bg-[#5A1818] px-4 py-4`}
                >
                  <Text style={tw`text-sm leading-5 text-foreground dark:text-white`}>{error}</Text>
                  <Text
                    onPress={openSettings}
                    style={tw`mt-2 text-sm font-semibold text-foreground dark:text-[#FFD1D1]`}
                  >
                    Open settings
                  </Text>
                </View>
              )}

              <View style={tw`mt-5 rounded-[28px] bg-surface dark:bg-[#0A173F] p-5`}>
                <Text style={tw`text-sm font-semibold text-foreground dark:text-white`}>
                  Keep pickup simple
                </Text>
                <Text style={tw`mt-2 text-sm leading-5 text-secondary dark:text-[#A8BAE4]`}>
                  A clear landmark and a short note make it much easier for the
                  pooler to decide quickly and find you smoothly.
                </Text>
              </View>

              <CustomView style={tw`mt-5`}>
                <Text style={tw`mb-2 text-foreground dark:text-white`}>Request location</Text>
                <Input
                  style={tw`h-12`}
                  placeholder="Enter a landmark, bus stop, or area"
                  onChangeText={setPoolLocation}
                  value={poolLocation}
                />
              </CustomView>

              <View
                style={tw`mt-4 rounded-2xl bg-surface dark:bg-[#0A173F] px-4 py-4 flex-row items-center justify-between gap-4`}
              >
                <View style={tw`flex-1`}>
                  <Text style={tw`text-foreground dark:text-white font-semibold`}>
                    Use my current location
                  </Text>
                  <Text style={tw`mt-1 text-xs leading-5 text-muted dark:text-[#8FA1CB]`}>
                    Turn this on if you are already close to where you want the
                    pooler to meet you.
                  </Text>
                </View>
                <Switch
                  value={useCurrentLocation}
                  onValueChange={setUseCurrentLocation}
                  thumbColor={useCurrentLocation ? "#0FF1CF" : "#555"}
                  trackColor={{ false: "#1A2755", true: "#1A2755" }}
                />
              </View>

              <CustomView style={tw`mt-4`}>
                <Text style={tw`mb-2 text-foreground dark:text-white`}>More details</Text>
                <TextArea
                  placeholder="Anything the pooler should know?"
                  maxLength={100}
                  className="min-h-[100px]"
                  onChange={setNotes}
                  value={notes}
                />
              </CustomView>
            </ScrollView>

            <View
              style={tw`border-t border-border dark:border-[#1B2A50] bg-background dark:bg-[#041130] px-1 pb-1 pt-4`}
            >
              <CustomButton
                title={isPending ? "Sending request" : "Send ride request"}
                buttonClassName="bg-accentFill dark:bg-[#0FF1CF] w-full border-0 rounded-[18px]"
                textClassName="!text-onAccent dark:text-black"
                showArrow={false}
                onPress={sendRequest}
                disabled={isPending}
              />
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    );
  }
);

SendRequestBS.displayName = "SendRequestBS";

export default SendRequestBS;
