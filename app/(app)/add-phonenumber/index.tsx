import CustomButton from "@/components/buttons/CustomBtn1"
import PhoneNumberInput from "@/components/inputs/PhoneNumberInput"
import { useRouter } from "expo-router"
import { InfoIcon } from "lucide-react-native"
import { Text, View } from "react-native"


const index = () => {
    const router = useRouter()
  return (
    <View className="flex-1 bg-[#01082E] flex flex-col  items-center px-5 py-10 gap-5 overflow-scroll">
        <Text className="text-white">Add your Phone number</Text>
        <Text className="text-white text-xs">frank.ze@myemail.com</Text>
        <View className="flex-1 flex flex-col w-full max-w-[500px] justify-center items-center gap-10">
            <PhoneNumberInput />
            <View className="gap-3 flex flex-row">
                <InfoIcon color={"white"}/>
                <Text className="text-white">
                    Please note that you have to use a local a phone number for recovery phone number
                </Text>
            </View>

            <Text className="text-white">
                We'll send you a code to verify this mobile number. Message and data rates may apply.
            </Text>
            <Text className="text-white">
            Your emails and phone numbers will be used to offer relevant features, content and advertising as covered in our Privacy Policy.
            </Text>
        </View>
        <CustomButton onPress={()=>router.replace("/verify-phonenumber")} title="Get code by sms" buttonClassName='bg-[#0FF1CF] border-0 w-full' textClassName="!text-black" showArrow={false}/>

    </View>
  )
}

export default index
