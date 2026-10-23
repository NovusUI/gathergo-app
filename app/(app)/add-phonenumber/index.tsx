import { useAppTheme } from "@/hooks/useAppTheme";
import CustomButton from "@/components/buttons/CustomBtn1"
import PhoneNumberInput from "@/components/inputs/PhoneNumberInput"
import { useLockedRouter } from "@/utils/navigation";
import { useRouter } from "expo-router"
import { InfoIcon } from "lucide-react-native"
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native"

const AddPhoneNumberScreen = () => {
  const { tw, color } = useAppTheme();
    const router = useLockedRouter()
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: color("#01082E", "background") }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, alignItems: "center", paddingHorizontal: 20, paddingVertical: 40, rowGap: 20 }}
      >
        <Text style={tw.style("text-foreground dark:text-white")}>Add your Phone number</Text>
        <Text style={tw.style("text-foreground dark:text-white text-xs")}>frank.ze@myemail.com</Text>
        <View style={tw.style("flex-1 flex flex-col w-full max-w-[500px] justify-center items-center gap-10")}>
            <PhoneNumberInput />
            <View style={tw.style("gap-3 flex flex-row")}>
                <InfoIcon color={color("white", "foreground")}/>
                <Text style={tw.style("text-foreground dark:text-white")}>
                    Please note that you have to use a local a phone number for recovery phone number
                </Text>
            </View>

            <Text style={tw.style("text-foreground dark:text-white")}>
            We&apos;ll send you a code to verify this mobile number. Message and data rates may apply.
            </Text>
            <Text style={tw.style("text-foreground dark:text-white")}>
            Your emails and phone numbers will be used to offer relevant features, content and advertising as covered in our Privacy Policy.
            </Text>
        </View>
        <CustomButton onPress={()=>router.replace("/verify-phonenumber")} title="Get code by sms" buttonClassName='bg-accentFill dark:bg-[#0FF1CF] border-0 w-full' textClassName="!text-onAccent dark:text-black" showArrow={false}/>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default AddPhoneNumberScreen
