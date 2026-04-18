import CustomButton from "@/components/buttons/CustomBtn1";
import Input from "@/components/inputs/CustomInput1";
import LocalSvgAsset from "@/components/ui/LocalSvgAsset";
import { useForgotPassword } from "@/services/mutations";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { useLockedRouter } from "@/utils/navigation";
import { Mail, XIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  KeyboardEvent,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";

const ResetPassword = () => {
  const router = useLockedRouter();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [email, setEmail] = useState("");
  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const handleSendCode = () => {
    const sanitizedEmail = email.replace(/\s+/g, "").trim();
    const isValidEmail = /\S+@\S+\.\S+/.test(sanitizedEmail);

    if (!isValidEmail) {
      showGlobalError("Enter a valid email address");
      return;
    }

    forgotPassword(
      { email: sanitizedEmail },
      {
        onSuccess: (response) => {
          showGlobalSuccess(response.message, 4);
          router.push({
            pathname: "/password-reset/verify",
            params: {
              email: response.data?.email || sanitizedEmail,
              sentAt: String(Date.now()),
            },
          });
        },
        onError: (err: any) =>
          showGlobalError(
            err?.response?.data?.message ||
              err?.message ||
              "Could not send reset code"
          ),
      }
    );
  };

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
        <LocalSvgAsset
          name="vector1"
          width={109}
          height={106}
          style={tw`absolute -top-14 left-10`}
        />
        <LocalSvgAsset name="gglogo" width={80} height={80} />
      </View>

      {/* Title & Description */}
      <Text style={tw`text-white text-lg font-semibold`}>Reset Password</Text>
      <Text style={tw`text-gray-300 text-center max-w-80`}>
        Enter the email address linked to your account, and we’ll send you a
        6-digit code to reset your password.
      </Text>

      {/* Email Input */}
      <Input
        placeholder="Enter your email"
        LeftIcon={Mail}
        value={email}
        onChangeText={(text) => setEmail(text.replace(/\s+/g, ""))}
      />

      {/* Submit Button */}
      <CustomButton
        title={isPending ? "Sending code..." : "Send reset code"}
        buttonClassName="!w-full bg-[#0FF1CF] border-0"
        arrowCircleColor="bg-[#0C7F7F]"
        textClassName="!text-black"
        onPress={handleSendCode}
        disabled={isPending}
      />

      {/* Back to Login */}
      <TouchableOpacity
        style={tw`w-full max-w-96 flex flex-row justify-center mt-5`}
        onPress={() => router.replace("/login")}
      >
        <Text style={tw`text-white`}>Back to Sign in</Text>
      </TouchableOpacity>

      {/* Decorative vectors */}
      <View style={tw`flex flex-row items-end absolute bottom-0 left-0`}>
        <LocalSvgAsset name="vector2" width={78} height={76} />
        <LocalSvgAsset name="vector3" width={53} height={35} />
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ResetPassword;
