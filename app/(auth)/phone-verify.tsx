import CustomButton from "@/components/buttons/CustomBtn1";
import { usePhoneAuthFlow } from "@/hooks/usePhoneAuthFlow";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, ShieldCheck } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

const PhoneVerifyScreen = () => {
  const router = useRouter();
  const { phone, verificationId } = useLocalSearchParams<{
    phone?: string | string[];
    verificationId?: string | string[];
  }>();
  const [code, setCode] = useState("");
  const { verifyAndSignIn, isPending } = usePhoneAuthFlow();

  const normalizedPhone = Array.isArray(phone) ? phone[0] : phone || "";
  const normalizedVerificationId = Array.isArray(verificationId)
    ? verificationId[0]
    : verificationId;

  const canSubmit = useMemo(() => code.trim().length >= 4, [code]);

  const submitCode = () => {
    verifyAndSignIn({
      phoneNumber: normalizedPhone,
      smsCode: code,
      verificationId: normalizedVerificationId,
    });
  };

  return (
    <View style={tw`flex-1 bg-[#01082E] px-5 pt-14 pb-8`}>
      <TouchableOpacity onPress={() => router.back()} style={tw`self-start p-2`}>
        <ArrowLeft color="white" size={20} />
      </TouchableOpacity>

      <View style={tw`mt-8 gap-2`}>
        <Text style={tw`text-white text-3xl font-bold`}>Verify phone</Text>
        <Text style={tw`text-gray-300 text-sm`}>
          Enter the code sent to {normalizedPhone || "your phone"}.
        </Text>
      </View>

      <View style={tw`mt-10 rounded-xl bg-[#1B2A50]/40 border border-[#2A3D6A] px-4 py-3`}>
        <View style={tw`flex-row items-center gap-3`}>
          <ShieldCheck color="#94A3B8" size={18} />
          <TextInput
            style={tw`flex-1 text-white py-2 tracking-widest`}
            placeholder="Enter verification code"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
            maxLength={8}
          />
        </View>
      </View>

      <Text style={tw`text-gray-400 text-xs mt-3`}>
        If this is your first setup pass, use backend-provided verification
        artifact mapping for Firebase PNV.
      </Text>

      <View style={tw`mt-auto gap-3`}>
        <CustomButton
          onPress={submitCode}
          title={isPending ? "Verifying..." : "Verify & sign in"}
          buttonClassName="bg-[#0FF1CF] border-0 w-full"
          textClassName="!text-black"
          arrowCircleColor="bg-[#0A7F7F]"
          disabled={!canSubmit || isPending}
        />
      </View>
    </View>
  );
};

export default PhoneVerifyScreen;

