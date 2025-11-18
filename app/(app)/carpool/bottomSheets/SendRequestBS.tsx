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
import tw from "twrnc";

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
      open: () => bottomSheetReqRef.current?.snapToIndex(0),
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
        <BottomSheetScrollView style={tw`p-5`}>
          <View style={tw`py-5`}>
            {error && (
              <View
                style={tw`mt-auto bg-red-600 py-3 px-4 rounded flex-row justify-between items-center`}
              >
                <Text style={tw`text-white flex-1`}>{error}</Text>
                <Text
                  onPress={openSettings}
                  style={tw`text-white font-bold ml-3`}
                >
                  Open Settings
                </Text>
              </View>
            )}
            <CustomView>
              <Text style={tw`text-white mb-1`}>Request location</Text>
              <Input
                className="h-16"
                placeholder="Enter a landmark, busstop, or area"
                onChangeText={setPoolLocation}
                value={poolLocation}
              />
            </CustomView>

            <CustomView style={tw`gap-2 flex-row items-center justify-between`}>
              <Text style={tw`text-white`}>Close to current location?</Text>
              <Switch
                value={useCurrentLocation}
                onValueChange={setUseCurrentLocation}
                thumbColor={useCurrentLocation ? "#0FF1CF" : "#555"}
              />
            </CustomView>

            <CustomView>
              <Text style={tw`text-white mb-1`}>More details</Text>
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

        <View style={tw`w-screen max-w-[500px] p-5`}>
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
