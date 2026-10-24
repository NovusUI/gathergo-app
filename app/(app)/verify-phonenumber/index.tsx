import { useAppTheme } from "@/hooks/useAppTheme";
import CustomButton from "@/components/buttons/CustomBtn1"
import FourDigitCodeInput from "@/components/inputs/FourDigitInput"
import { useLockedRouter } from "@/utils/navigation";
import { useRouter } from "expo-router"
import { useState } from "react"
import { Text, View } from "react-native"

const VerifyPhoneNumber = () => {
    const { tw } = useAppTheme();
    const router = useLockedRouter()
    const [code, setCode] = useState("");
  return (
    <View style={tw`flex-1 bg-background dark:bg-[#01082E] flex flex-col  items-center px-5 py-10 gap-5 overflow-scroll`}>

        <Text style={tw`text-foreground dark:text-white text-xs`}>frank.ze@myemail.com</Text>
        <View style={tw`flex-1 flex flex-col w-full max-w-96 justify-center items-center gap-5`}>

            <Text style={tw`text-foreground dark:text-white`}>
                Enter verification code            
            </Text>
            <Text style={tw`text-foreground dark:text-white`}>
                You’ll get a code on +248 584 5856            
            </Text>
            <FourDigitCodeInput onChange={setCode} />
        </View>
        <CustomButton onPress={()=>router.replace("/preference")} title="Submit" buttonClassName='bg-accentFill dark:bg-[#0FF1CF] border-0 w-full' textClassName="!text-onAccent dark:text-black" showArrow={false}/>

    </View>
  )
}

export default VerifyPhoneNumber
