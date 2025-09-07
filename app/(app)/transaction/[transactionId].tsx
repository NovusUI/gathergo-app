import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import QRCodeGenerator from "@/components/QRCodeGen";
import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import { EventDetails } from "@/components/ui/EventDetails";
import { useAuth } from "@/context/AuthContext";
import { useTicketOrRegByTransactionRef, useTransactionRef } from "@/services/queries";
import { formatEventDateTime } from "@/utils/dateTimeHandler";
import { showGlobalError } from "@/utils/globalErrorHandler";
import { numberWithCommas } from "@/utils/utils";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView
} from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Calendar, CircleCheckIcon, CircleXIcon, LoaderIcon } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

    const router = useRouter()
    const { transactionId:id } = useLocalSearchParams(); // eventId
    const transactionId = Array.isArray(id) ? id[0] : id;

    const {user} =useAuth()
    
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ["100"], []);

    const openSheet = useCallback(() => {
        
        bottomSheetRef.current?.snapToIndex(1);
      }, []);


    const {data,isPending,isError} =  useTransactionRef(transactionId,{
        enabled: !!transactionId, // prevent running when no ID
        refetchInterval: (query) => {
          const status = query.state.data?.data?.status;
          return status === "PENDING" ? 3000 : false; // poll every 3s if pending
        },
      
    })

    const transactionType = data?.data?.metadata?.type;
    const isStatuSSuccess = data?.data.status === "SUCCESS"


    const {data:TicketsOrReg,isPending:ticketOrRegPending, isFetching,} =  useTicketOrRegByTransactionRef(transactionId,transactionType || "TICKETS",{
        enabled: !!transactionId  && !!isStatuSSuccess // prevent running when no ID
      
    })

    useEffect(()=>{

        console.log(TicketsOrReg)
    },[TicketsOrReg])

    const [currentIndex, setCurrentIndex] = useState(0);
const tickets = TicketsOrReg?.data || [];

const handleNext = () => {
  if (currentIndex < tickets.length - 1) setCurrentIndex(currentIndex + 1);
};

const handlePrev = () => {
  if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
};


  
    useEffect(()=>{
        if(isError)
            showGlobalError("Error in transaction")
    },[isError])
    console.log(data)
      
  return (
    <View className="flex-1 pt-10 bg-[#01082E] flex flex-col items-center w-full">
         <CustomView className="px-3">
      <CustomeTopBarNav
        title="Transaction ref"
        onClickBack={() => router.back()}
        
      />
      </CustomView>
       <ScrollView className="w-full max-w-500 py-10 px-5" >
            <View className="px-4 py-8 bg-[#010E3A] rounded-lg gap-8">
                <View className="flex-row justify-between gap-4 ">
                    {data?.data.status === "SUCCESS" && !isPending &&<CircleCheckIcon size={70} color="#20C963"/>}
                    {data?.data.status === "FAILURE" && !isPending &&<CircleXIcon size={70} color="red"/>}
                    {(data?.data.status === "PENDING" || isPending) &&<LoaderIcon size={70} color="yellow"/>}
                    <TouchableOpacity className="gap-1 w-4/5" onPress={isStatuSSuccess ? openSheet:()=>null}>
                        <Text className="text-white text-2xl">{data?.data.status || "Pending"}</Text>
                        <Text className="text-white text-xs mr-16">Your Ticket purchase to this event was successful. Thank you.</Text>
                        {isStatuSSuccess && TicketsOrReg &&  <Text className="text-white text-xs mr-16">CLICK TO SEE TICKETS! </Text>}
                    </TouchableOpacity>
                </View>
                <View className="border-[1px] border-white rounded-2xl py-5 px-8 gap-3">
                    
                    <Text className="text-white">Ticket Details</Text>
                   
                    <View className="flex-row justify-between">
                        <Text className="text-white">Amount Paid:</Text>
                        <Text className="text-white text-ellipsis" >{numberWithCommas(data?.data.amount,true,null)}</Text>
                    </View>
                    <Text className="text-white">Thank you!</Text>
                </View>
            </View>
            <View className="px-4 py-8 bg-[#010E3A] rounded-lg gap-8 mt-5">
                <Text className="text-white text-lg">Hello {user?.name}  👋</Text>
                <Text className="text-white">
                We’ve  noticed you will be going for event name,
how about you help us with our environmental
goals by reducing carbon footprint, maybe
make new friends, or create a community. 
Going to this event together with someone with 
our carpool feature.
                </Text>
            </View>
        </ScrollView>
        <View className="w-screen max-w-[500px] p-5 ">
                    <CustomButton onPress={()=>router.replace("/")}  title="View event feed" buttonClassName="bg-[#0FF1CF] w-full border-0" textClassName="!text-black" arrowCircleColor="bg-[#0C7F7F]" showArrow/>
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
               backgroundStyle={{backgroundColor:"#01082E"}}
              >
                <View className="flex flex-row justify-between items-center p-5">
                        <Text className="text-white">Tickets</Text>
                        <Text className="text-white text-xs">{tickets.length} purchased</Text>
                </View>
                
                <BottomSheetScrollView className="p-5">
  {tickets.length > 0 && (
    <View className="rounded-2xl bg-[#010E3A] px-5">
      <View className="flex flex-row gap-8 p-5 items-center">
        <Image
          src={tickets[currentIndex]?.event?.thumbnailUrl}
          className="w-20 h-20 rounded-md bg-white"
        />
        <View className="py-2 w-2/3">
          <TouchableOpacity className="px-5 py-2 rounded-3xl bg-[#0FF1CF] self-start">
            <Text className="capitalize">
              {transactionType === "REGISTRATION" ? "Registration" : tickets[currentIndex]?.eventTicketType}
            </Text>
          </TouchableOpacity>
          <Text className="text-[#fff] text-lg">{tickets[currentIndex]?.event?.title}</Text>
        </View>
      </View>

      <DashedLine />

      <View className="ml-3 my-8 gap-8">
        <View className="flex flex-row gap-5 items-center">
          <Calendar color={"white"} />
          <EventDetails
            title="date & time"
            subtitle={formatEventDateTime(tickets[currentIndex]?.event?.startDate, tickets[currentIndex]?.event?.endDate)}
          />
        </View>
      </View>

      <DashedLine />

      <View className="max-w-[500px] w-full py-8 flex-row justify-center items-center">
        <View className="w-48 h-48 rounded-2xl bg-[#FFFDFD] flex-row justify-center items-center">
          <QRCodeGenerator value={tickets[currentIndex]?.qrCode} />
        </View>
      </View>

      {/* Prev / Next Buttons */}
      <View className="flex-row justify-between py-4">
        <TouchableOpacity
          disabled={currentIndex === 0}
          onPress={handlePrev}
          className="px-4 py-2 bg-gray-700 rounded-lg"
        >
          <Text className="text-white">Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={currentIndex === tickets.length - 1}
          onPress={handleNext}
          className="px-4 py-2 bg-[#0FF1CF] rounded-lg"
        >
          <Text className="text-black">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  )}
</BottomSheetScrollView>

                 <View className="w-screen max-w-[500px] p-5 ">
                    <CustomButton onPress={()=>router.replace("/")}  title="view event feed" buttonClassName=" w-full !border-[#0FF1CF]" textClassName="!text-[#0FF1CF]" showArrow={false}/>
                 </View>
      </BottomSheet>
      

    </View>

  )
}

export default TransactionRef
