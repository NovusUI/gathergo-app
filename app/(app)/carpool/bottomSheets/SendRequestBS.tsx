import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import Input from "@/components/inputs/CustomInput1";
import TextArea from "@/components/inputs/CustomTextArea";
import { useLocationManager } from "@/hooks/useLocationManager";
import { useRequestCarpool } from "@/services/mutations";
import { QUERY_KEYS } from "@/services/queryKeys";
import {
  showGlobalError,
  showGlobalSuccess,
  showGlobalWarning,
} from "@/utils/globalErrorHandler";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useQueryClient } from "@tanstack/react-query";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Switch, Text, View } from "react-native";

export type SendRequestBSRef = {
  open: () => void;
  close: () => void;
};

export type SendRequestProp = {
  carpoolId: string;
};

const SendRequestBS = forwardRef<SendRequestBSRef, SendRequestProp>(
  ({ carpoolId }, ref) => {
    const { coords, requestLocation, error, openSettings } =
      useLocationManager();
    const [useCurrentLocation, setUseCurrentLocation] = useState(false);

    const toggleNearby = async () => {
      const c = await requestLocation(true);
      if (!c) {
        alert("Enable location in settings to use this filter");
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

    const bottomSheetReqRef = useRef<BottomSheetModal>(null);
    const snapPoints2 = useMemo(() => ["80%"], []);

    // expose open/close methods
    useImperativeHandle(ref, () => ({
      open: () => bottomSheetReqRef.current?.snapToIndex(1),
      close: () => bottomSheetReqRef.current?.close(),
    }));

    const { mutateAsync, isPending } = useRequestCarpool(carpoolId, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.carpoolDetails, carpoolId],
        });
        showGlobalSuccess("Request sent successfully");
        bottomSheetReqRef.current?.close();
      },
      onError: () => {
        showGlobalError("Error requesting carpool");
      },
    });

    const sendRequest = () => {
      console.log(poolLocation, notes, coords);

      if (poolLocation.trim().length > 0) {
        mutateAsync({
          origin: poolLocation,
          ...(notes.length ? { note: notes } : {}),
          ...(coords ? { startPoint: coords } : {}),
        });
      } else {
        showGlobalWarning("where are you requesting from");
      }
    };

    return (
      <BottomSheet
        index={-1}
        ref={bottomSheetReqRef}
        snapPoints={snapPoints2}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={0}
            appearsOnIndex={0}
          />
        )}
        backgroundStyle={{ backgroundColor: "#01082E" }}
      >
        <BottomSheetScrollView className="p-5">
          <View className="py-5 gap-5">
            {error && (
              <View
                style={{
                  marginTop: "auto", // pushes it to the bottom
                  backgroundColor: "#e74c3c",
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", flex: 1 }}>{error}</Text>
                <Text
                  onPress={openSettings}
                  style={{
                    color: "white",
                    fontWeight: "bold",
                    marginLeft: 12,
                  }}
                >
                  Open Settings
                </Text>
              </View>
            )}
            <CustomView>
              <Text className="text-white mb-1">Request location</Text>
              <Input
                className="h-16"
                placeholder="Enter a landmark, busstop, or area"
                onChangeText={setPoolLocation}
                value={poolLocation}
              />
            </CustomView>

            <CustomView className="gap-2">
              <Text className="text-white">Close to current location?</Text>
              <Switch
                value={useCurrentLocation}
                onValueChange={setUseCurrentLocation}
                thumbColor={useCurrentLocation ? "#0FF1CF" : "#555"}
              />
            </CustomView>

            <CustomView>
              <Text className="text-white mb-1">More details</Text>
              <TextArea
                placeholder="Any detail for the pooler?"
                maxLength={100}
                className="min-h-[50px]"
                onChange={setNotes}
                value={notes}
              />
            </CustomView>
          </View>
        </BottomSheetScrollView>

        <View className="w-screen max-w-[500px] p-5">
          <CustomButton
            title={isPending ? "Requesting Carpool" : "Send Request"}
            buttonClassName="bg-[#0FF1CF] w-full border-0"
            textClassName="!text-black"
            showArrow={false}
            onPress={sendRequest}
            disabled={isPending}
          />
        </View>
      </BottomSheet>
    );
  }
);

export default SendRequestBS;
