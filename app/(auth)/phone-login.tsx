import CustomButton from "@/components/buttons/CustomBtn1";
import { useRouter } from "expo-router";
import { ArrowLeft, Smartphone } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

const PhoneLoginScreen = () => {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");

  const canContinue = useMemo(
    () => phoneNumber.replace(/[^\d+]/g, "").trim().length >= 8,
    [phoneNumber]
  );

  const requestCode = () => {
    const normalized = phoneNumber.replace(/[^\d+]/g, "").trim();
    router.push({
      pathname: "/phone-verify",
      params: { phone: normalized, verificationId: "pnv-session-pending" },
    });
  };

  return (
    <View style={tw`flex-1 bg-[#01082E] px-5 pt-14 pb-8`}>
      <TouchableOpacity onPress={() => router.back()} style={tw`self-start p-2`}>
        <ArrowLeft color="white" size={20} />
      </TouchableOpacity>

      <View style={tw`mt-8 gap-2`}>
        <Text style={tw`text-white text-3xl font-bold`}>Sign in with phone</Text>
        <Text style={tw`text-gray-300 text-sm`}>
          Use your phone number to continue. We&apos;ll verify and sign you in.
        </Text>
      </View>

      <View style={tw`mt-10 rounded-xl bg-[#1B2A50]/40 border border-[#2A3D6A] px-4 py-3`}>
        <View style={tw`flex-row items-center gap-3`}>
          <Smartphone color="#94A3B8" size={18} />
          <TextInput
            style={tw`flex-1 text-white py-2`}
            placeholder="+2348012345678"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>
      </View>

      <Text style={tw`text-gray-400 text-xs mt-3`}>
        Phone Number Verification (PNV) is finalized in backend endpoint
        `/auth/phone/firebase-token`.
      </Text>

      <View style={tw`mt-auto`}>
        <CustomButton
          onPress={requestCode}
          title="Continue with phone"
          buttonClassName="bg-[#0FF1CF] border-0 w-full"
          textClassName="!text-black"
          arrowCircleColor="bg-[#0A7F7F]"
          disabled={!canContinue}
        />
      </View>
    </View>
  );
};

export default PhoneLoginScreen;

