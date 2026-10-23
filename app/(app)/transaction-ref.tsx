import { useAppTheme } from "@/hooks/useAppTheme";
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import { EventDetails } from "@/components/ui/EventDetails";
import { useAuth } from "@/context/AuthContext";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useLockedRouter } from "@/utils/navigation";
import { Calendar, CircleCheckIcon, MapIcon, Ticket } from "lucide-react-native";
import { useCallback, useMemo, useRef } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Svg, { Line } from 'react-native-svg';

const DashedLine = () => (
  <Svg height="2" width="100%">
    <Line
      x1="0"
      y1="0"
      x2="100%"
      y2="0"
      stroke="#3D50DF"
      strokeWidth="2"
      strokeDasharray="4,4" // pattern: dash, gap
    />
  </Svg>
);

const TransactionRef = () => {
  const { tw, color } = useAppTheme();

    const router = useLockedRouter()
    const {user} =useAuth()

    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ["100"], []);

    const openSheet = useCallback(() => {

        bottomSheetRef.current?.snapToIndex(1);
      }, []);

  return (
    <View style={tw.style("flex-1 pt-10 bg-background dark:bg-[#01082E] flex flex-col items-center w-full")}>
         <CustomView className="px-3">
      <CustomeTopBarNav
        title="Transaction ref"
        onClickBack={() => router.replace("/")}

      />
      </CustomView>
       <ScrollView style={tw.style("w-full max-w-500 py-10 px-5")} >
            <View style={tw.style("px-4 py-8 bg-surface dark:bg-[#010E3A] rounded-lg gap-8")}>
                <View style={tw.style("flex-row justify-between gap-4 ")}>
                    <CircleCheckIcon size={70} color="#20C963"/>
                    <TouchableOpacity style={tw.style("gap-1 w-4/5")} onPress={openSheet}>
                        <Text style={tw.style("text-foreground dark:text-white text-2xl")}>Success</Text>
                        <Text style={tw.style("text-foreground dark:text-white text-xs mr-16")}>Your Ticket purchase to this event was successful. Thank you.</Text>
                    </TouchableOpacity>
                </View>
                <View style={tw.style("border-[1px] border-borderStrong dark:border-white rounded-2xl py-5 px-8 gap-3")}>

                    <Text style={tw.style("text-foreground dark:text-white")}>Ticket Details</Text>
                    <View style={tw.style("flex-row justify-between")}>
                        <Text style={tw.style("text-foreground dark:text-white")}>Event Name:</Text>
                        <Text style={tw.style("text-foreground dark:text-white w-2/4 ")} numberOfLines={1} >Smart-Som Fashion Art and Tech</Text>
                    </View>
                    <View style={tw.style("flex-row justify-between")}>
                        <Text style={tw.style("text-foreground dark:text-white")}>Amount Paid:</Text>
                        <Text style={tw.style("text-foreground dark:text-white text-ellipsis")} >250000</Text>
                    </View>
                    <Text style={tw.style("text-foreground dark:text-white")}>Thank you!</Text>
                </View>
            </View>
            <View style={tw.style("px-4 py-8 bg-surface dark:bg-[#010E3A] rounded-lg gap-8 mt-5")}>
                <Text style={tw.style("text-foreground dark:text-white text-lg")}>Hello {user?.name}  👋</Text>
                <Text style={tw.style("text-foreground dark:text-white")}>
                We’ve  noticed you will be going for event name,
how about you help us with our environmental
goals by reducing carbon footprint, maybe
make new friends, or create a community. 
Going to this event together with someone with 
our carpool feature.
                </Text>
            </View>
        </ScrollView>
        <View style={tw.style("w-screen max-w-[500px] p-5 ")}>
                    <CustomButton onPress={()=>router.replace("/")}  title="View event feed" buttonClassName="bg-accentFill dark:bg-[#0FF1CF] w-full border-0" textClassName="!text-onAccent dark:text-black" arrowCircleColor="bg-accentFill dark:bg-[#0C7F7F]" showArrow/>
        </View>

        <BottomSheet

                index={-1}
                ref={bottomSheetRef}
                snapPoints={snapPoints}
                enablePanDownToClose={true}
                backdropComponent={(props) => (
                    <BottomSheetBackdrop
                      {...props}
                      disappearsOnIndex={0}
                      appearsOnIndex={1}
                    />
                  )}
               backgroundStyle={{backgroundColor:color("#01082E", "background")}}
              >
                <View style={tw.style("flex flex-row justify-between items-center p-5")}>
                        <Text style={tw.style("text-foreground dark:text-white")}>Tickets</Text>
                </View>

                <BottomSheetScrollView  className="p-5  ">
                    <View style={tw.style("rounded-2xl bg-surface dark:bg-[#010E3A] px-5")}>
                <View style={tw.style("flex flex-row  gap-8 p-5 items-center")}>
                    <Image style={tw.style("w-20 h-20 rounded-md bg-surface dark:bg-white")}/>
                    <View style={tw.style("py-2 w-2/3")}>
                        <TouchableOpacity style={tw.style("px-5 py-2 rounded-3xl bg-accentFill dark:bg-[#0FF1CF] self-start")}>
                            <Text style={tw.style("capitalize text-onAccent dark:text-[#01082E]")}>Concert</Text>
                        </TouchableOpacity>

                        <Text style={tw.style("text-foreground dark:text-[#fff] text-lg")}>Smart-Som Fashion Runway (D-Vibe)</Text>
                    </View>
                </View>
                <DashedLine/>
                <View style={tw.style("ml-3 my-8 gap-8")}>
                <View style={tw.style("flex flex-row gap-5 items-center")}>
                    <Calendar color={color("white", "foreground")}/>
                    <EventDetails title="date & time" subtitle="24 April, 2023. 10:00 PM"/>
                </View>
                <View style={tw.style("flex flex-row gap-5 items-center")}>
                    <MapIcon color={color("white", "foreground")}/>
                    <EventDetails title="Location" subtitle="Urban Rooftop, Art Gallery, or Pop-Up in 
a Smart City District"/>
                </View>
                <View style={tw.style("flex flex-row gap-5 items-center")}>
                    <Ticket color={color("white", "foreground")}/>
                    <EventDetails title="Ticket" subtitle="4 Tickets Types, 40,000.00 - 100,000.00"/>
                </View>

            </View>

            <DashedLine/>
            <View style={tw.style("max-w-[500px] w-full py-8 flex-row justify-center items-center")}>
                <View style={tw.style("w-48 h-48 rounded-2xl bg-surface dark:bg-[#FFFDFD]")}>

                </View>
            </View>
            </View>

                </BottomSheetScrollView>
                 <View style={tw.style("w-screen max-w-[500px] p-5 ")}>
                    <CustomButton onPress={()=>router.replace("/")}  title="view event feed" buttonClassName=" w-full !border-accent dark:border-[#0FF1CF]" textClassName="!text-accent dark:text-[#0FF1CF]" showArrow={false}/>
                 </View>
      </BottomSheet>

    </View>

  )
}

export default TransactionRef
