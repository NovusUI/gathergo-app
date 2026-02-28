import CustomButton from "@/components/buttons/CustomBtn1";
import Input from "@/components/inputs/CustomInput1";
import { useRouter } from "expo-router";
import { Mail, XIcon } from "lucide-react-native";
import {
  Image,
  Keyboard,
  KeyboardEvent,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import tw from "twrnc";

const ResetPassword = () => {
  const router = useRouter();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      "keyboardDidShow",
      (event: KeyboardEvent) => {
        setKeyboardHeight(event.endCoordinates?.height ?? 0);
      }
    );
    const frameSub = Keyboard.addListener(
      "keyboardDidChangeFrame",
      (event: KeyboardEvent) => {
        setKeyboardHeight(event.endCoordinates?.height ?? 0);
      }
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      frameSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#01082E" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 56,
          paddingBottom:
            Platform.OS === "android" && keyboardHeight > 0
              ? keyboardHeight + 24
              : 56,
          gap: 20,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
      {/* Back Button */}
      <TouchableOpacity
        style={tw`absolute top-10 left-8`}
        onPress={() => router.replace('/login')}
      >
        <XIcon color="white"/>
      </TouchableOpacity>

      {/* Logo */}
      <View style={tw`flex flex-col justify-center items-center relative`}>
        <Image
          source={require("../../../assets/images/vector1.png")}
          style={tw`absolute -top-14 left-10`}
        />
        <Image source={require("../../../assets/images/gglogo.png")} />
      </View>

      {/* Title & Description */}
      <Text style={tw`text-white text-lg font-semibold`}>Reset Password</Text>
      <Text style={tw`text-gray-300 text-center max-w-80`}>
        Enter the email address linked to your account, and we’ll send you
        instructions to reset your password.
      </Text>

      {/* Email Input */}
      <Input placeholder="Enter your email" LeftIcon={Mail} />

      {/* Submit Button */}
      <CustomButton
        title={"Send Reset Link"}
        buttonClassName="!w-full bg-[#0FF1CF] border-0"
        arrowCircleColor="bg-[#0C7F7F]"
        textClassName="!text-black"
      />

      {/* Back to Login */}
      <TouchableOpacity
        style={tw`w-full max-w-96 flex flex-row justify-center mt-5`}
        onPress={() => router.replace("/login")}
      >
        <Text style={tw`text-white`}>Back to Sign in</Text>
      </TouchableOpacity>

      {/* Decorative vectors */}
      <View style={tw`flex flex-row items-baseline absolute bottom-0 left-0`}>
        <Image source={require("../../../assets/images/vector2.png")} />
        <Image source={require("../../../assets/images/vector3.png")} />
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ResetPassword;
