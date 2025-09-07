import AvatarGroup from "@/components/AvatarGroup";
import AvatarWithLabel from "@/components/AvatarWithLabel";
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import RequestCard from "@/components/carpool/RequestCard";
import Input from "@/components/inputs/CustomInput1";
import TextArea from "@/components/inputs/CustomTextArea";
import { EventDetails } from "@/components/ui/EventDetails";
import { useAuth } from "@/context/AuthContext";
import { dummy } from "@/utils/utils";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MessagesSquareIcon } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { Switch, Text, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Svg, { Line } from "react-native-svg";

const VerticalDashedLine = () => (
  <Svg height="25" width="2">
    <Line
      x1="0"
      y1="0"
      x2="0"
      y2="100%"
      stroke="#31C6F6"
      strokeWidth="2"
      strokeDasharray="4,4" // dash length, gap length
    />
  </Svg>
);

const CarpoolPage = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [poolLocation, setPoolLocation] = useState("");
  const [notes, setNotes] = useState("");

  const owner = false;
  const rideUnavailable = false;

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["60"], []);
  const openSheet = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  //bottomsheet for request form

  const bottomSheetReqRef = useRef<BottomSheetModal>(null);
  const snapPoints2 = useMemo(() => ["80"], []);
  const openReqSheet = useCallback(() => {
    bottomSheetReqRef.current?.snapToIndex(1);
  }, []);

  return (
    <View className="flex-1 pt-10 bg-[#01082E] flex flex-col items-center w-full">
      <CustomView className="px-5">
        <CustomeTopBarNav
          title="Smart-Som Fashion Runway (D-Vibe)"
          onClickBack={() => router.back()}
        />
      </CustomView>
      <ScrollView className="w-full max-w-500">
        <CustomView className="!bg-[#1B2A50]/40 h-2 w-full" />
        <CustomView className="px-4">
          <CustomView>
            <Text className="text-lg text-white">CARPOOL DETAILS</Text>
            <Text className="text-[#ADADAD]">2:30 pm</Text>

            <CustomView className="my-5">
              <View className="flex-row gap-5 items-center">
                <View className="rounded-full w-4 h-4 bg-[#0FF1CF]"></View>
                <Text className="text-white"> Justrite Omole</Text>
              </View>
              <View className="w-4 flex-row justify-center items-center h-6">
                <VerticalDashedLine />
              </View>
              <View className="flex-row gap-5 items-center">
                <View className="rounded-full w-4 h-4 bg-[#31C6F6]"></View>
                <Text className="text-white"> Queen's park event center</Text>
              </View>
            </CustomView>
            <Text className="text-white">Free</Text>
          </CustomView>
        </CustomView>
        <CustomView className="!bg-[#1B2A50]/40 h-2 w-full" />
        <View className="m-5 flex-row justify-between items-center">
          <AvatarGroup />
          <TouchableOpacity>
            <MessagesSquareIcon color={"white"} />
          </TouchableOpacity>
        </View>
        <CustomView className="!bg-[#1B2A50]/40 h-2 w-full" />

        <CustomView className="mx-5 gap-5">
          <Text className="text-lg text-white">CAR DETAILS</Text>
          <EventDetails title="car model" subtitle="Benz gle" />
          <EventDetails title="color" subtitle="WIne" />
        </CustomView>
        <CustomView className="!bg-[#1B2A50]/40 h-2 w-full" />
        <CustomView className="mx-5 gap-5">
          <Text className="text-lg text-white">Pooler's note</Text>
          <Text className="text-white mr-5">
            All i have to say is that, don't come in my car with body odor, a
            pet, load, cigerrette, or an extra passenger. That's all i ask. And
            also let's have a really nice ride together. ysuii
          </Text>
        </CustomView>
      </ScrollView>
      <CustomView className="px-5 pt-6 flex-row justify-between items-center">
        <AvatarWithLabel imageUrl={dummy} username={"Smartsom"} role="Pooler" />
        {user?.id || (
          <TouchableOpacity className="p-3 rounded-lg bg-[#0c1447]">
            <Text className="text-white">Follow</Text>
          </TouchableOpacity>
        )}
      </CustomView>
      <CustomView className="px-5 pb-5">
        {owner && (
          <CustomButton
            onPress={openSheet}
            buttonClassName="bg-[#0FF1CF] border-0 w-full max-w-[500px]"
            textClassName="!text-black"
            arrowCircleColor="bg-[#0C7F7F]"
            //disabled={true}
            title="View Request"
          />
        )}
        {!owner && (
          <CustomButton
            onPress={openReqSheet}
            buttonClassName="bg-[#0FF1CF] border-0 w-full max-w-[500px]"
            textClassName="!text-black"
            arrowCircleColor="bg-[#0C7F7F]"
            disabled={rideUnavailable}
            title={rideUnavailable ? "Unavalable" : "Join Carpool"}
          />
        )}
      </CustomView>
      {/* BottomSheet for Tickets */}
      <BottomSheet
        index={-1}
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={0}
            appearsOnIndex={1}
          />
        )}
        backgroundStyle={{ backgroundColor: "#01082E" }}
      >
        {/* <View className="p-5">
        <Text className="text-white">Requests</Text>
        
      </View> */}

        <BottomSheetScrollView className="p-5">
          <View className="py-5 gap-5">
            <RequestCard name="deybee" message="justrite" imageUrl={dummy} />
            <RequestCard name="deybee" message="justrite" imageUrl={dummy} />
          </View>
        </BottomSheetScrollView>

        <View className="w-screen max-w-[500px] p-5">
          <CustomButton
            title={`Accept all`}
            buttonClassName="bg-[#0FF1CF] w-full border-0"
            textClassName="!text-black"
            showArrow={false}
          />
        </View>
      </BottomSheet>

      <BottomSheet
        index={-1}
        ref={bottomSheetReqRef}
        snapPoints={snapPoints2}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={0}
            appearsOnIndex={1}
          />
        )}
        backgroundStyle={{ backgroundColor: "#01082E" }}
      >
        {/* <View className="p-5">
        <Text className="text-white">Requests</Text>
        
      </View> */}

        <BottomSheetScrollView className="p-5">
          <View className="py-5 gap-5">
            <CustomView>
              <Text className="text-white mb-1">Request location</Text>

              <CustomView className=" ">
                <Input
                  className="h-16"
                  placeholder="Enter a landmark, busstop, or area"
                  onChangeText={setPoolLocation}
                  value={poolLocation}
                />
              </CustomView>
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
              <Text className="text-white mb-1">Notes</Text>

              <CustomView className="flex-1 mb-5">
                <TextArea
                  placeholder="Any extra details?"
                  maxLength={100}
                  className="min-h-[50px]"
                  onChange={setNotes}
                  value={notes}
                />
              </CustomView>
            </CustomView>
          </View>
        </BottomSheetScrollView>

        <View className="w-screen max-w-[500px] p-5">
          <CustomButton
            title={`Send Request`}
            buttonClassName="bg-[#0FF1CF] w-full border-0"
            textClassName="!text-black"
            showArrow={false}
          />
        </View>
      </BottomSheet>
    </View>
  );
};

export default CarpoolPage;
