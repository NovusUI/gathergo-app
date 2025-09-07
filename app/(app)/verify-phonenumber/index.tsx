import CustomButton from "@/components/buttons/CustomBtn1"
import FourDigitCodeInput from "@/components/inputs/FourDigitInput"
import { useRouter } from "expo-router"
import { useState } from "react"
import { Text, View } from "react-native"


const index = () => {
    const router = useRouter()
    const [code, setCode] = useState("");
  return (
    <View className="flex-1 bg-[#01082E] flex flex-col  items-center px-5 py-10 gap-5 overflow-scroll">
       
        <Text className="text-white text-xs">frank.ze@myemail.com</Text>
        <View className="flex-1 flex flex-col w-full max-w-96 justify-center items-center gap-5">
          

            <Text className="text-white">
                Enter verification code            
            </Text>
            <Text className="text-white">
                You’ll get a code on +248 584 5856            
            </Text>
            <FourDigitCodeInput onChange={setCode} />
        </View>
        <CustomButton onPress={()=>router.replace("/preference")} title="Submit" buttonClassName='bg-[#0FF1CF] border-0 w-full' textClassName="!text-black" showArrow={false}/>

    </View>
  )
}

export default index
