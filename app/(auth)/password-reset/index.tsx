import CustomButton from "@/components/buttons/CustomBtn1";
import Input from "@/components/inputs/CustomInput1";
import { useRouter } from "expo-router";
import { Mail, XIcon } from "lucide-react-native";
import { Image, Text, TouchableOpacity, View } from "react-native";

const ResetPassword = () => {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#01082E] flex flex-col justify-center items-center px-5 py-14 gap-5">
      {/* Back Button */}
      <TouchableOpacity
        className="absolute top-10 left-8"
        onPress={() => router.replace('/login')}
      >
        <XIcon color="white"/>
      </TouchableOpacity>

      {/* Logo */}
      <View className="flex flex-col justify-center items-center relative">
        <Image
          source={require("../../../assets/images/vector1.png")}
          className="absolute -top-14 left-10"
        />
        <Image source={require("../../../assets/images/gglogo.png")} />
      </View>

      {/* Title & Description */}
      <Text className="text-white text-lg font-semibold">Reset Password</Text>
      <Text className="text-gray-300 text-center max-w-80">
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
        className="w-full max-w-96 flex flex-row justify-center mt-5"
        onPress={() => router.replace("/login")}
      >
        <Text className="text-white">Back to Sign in</Text>
      </TouchableOpacity>

      {/* Decorative vectors */}
      <View className="flex flex-row items-baseline absolute bottom-0 left-0">
        <Image source={require("../../../assets/images/vector2.png")} />
        <Image source={require("../../../assets/images/vector3.png")} />
      </View>
    </View>
  );
};

export default ResetPassword;
