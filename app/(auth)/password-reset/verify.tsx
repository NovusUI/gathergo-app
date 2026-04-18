import CustomButton from "@/components/buttons/CustomBtn1";
import {
  DEFAULT_RESEND_COOLDOWN_SECONDS,
  useResendCooldown,
} from "@/hooks/useResendCooldown";
import Input from "@/components/inputs/CustomInput1";
import { useForgotPassword, useResetPassword } from "@/services/mutations";
import {
  showGlobalError,
  showGlobalSuccess,
  showGlobalWarning,
} from "@/utils/globalErrorHandler";
import { safeGoBack } from "@/utils/navigation";
import { useLockedRouter } from "@/utils/navigation";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Key, ShieldCheck } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";

const PasswordResetVerifyScreen = () => {
  const router = useLockedRouter();
  const { email, sentAt } = useLocalSearchParams<{
    email?: string | string[];
    sentAt?: string | string[];
  }>();
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { mutate: resetPassword, isPending: isResetting } = useResetPassword();
  const { mutate: resendResetCode, isPending: isResending } =
    useForgotPassword();

  const normalizedEmail = Array.isArray(email) ? email[0] : email || "";
  const normalizedSentAt = Number(
    Array.isArray(sentAt) ? sentAt[0] : sentAt || ""
  );
  const normalizedCode = code.replace(/\D/g, "");
  const { formattedRemaining, isCoolingDown, restart, syncFromMessage } =
    useResendCooldown({
      cooldownSeconds: DEFAULT_RESEND_COOLDOWN_SECONDS,
      startedAtMs: Number.isFinite(normalizedSentAt)
        ? normalizedSentAt
        : undefined,
    });
  const canSubmit = useMemo(
    () =>
      normalizedEmail.length > 0 &&
      normalizedCode.length >= 4 &&
      newPassword.length >= 6 &&
      newPassword === confirmPassword,
    [confirmPassword, newPassword, normalizedCode.length, normalizedEmail.length]
  );

  const handleResetPassword = () => {
    if (!normalizedEmail) {
      showGlobalError("We could not find the email for this reset.");
      router.replace("/password-reset");
      return;
    }

    if (newPassword !== confirmPassword) {
      showGlobalError("Passwords do not match");
      return;
    }

    resetPassword(
      {
        email: normalizedEmail,
        code: normalizedCode,
        newPassword,
      },
      {
        onSuccess: (response) => {
          showGlobalSuccess(response.message);
          router.replace("/login");
        },
        onError: (err: any) =>
          showGlobalError(
            err?.response?.data?.message ||
              err?.message ||
              "Could not reset password"
          ),
      }
    );
  };

  const handleResendCode = () => {
    if (isCoolingDown) {
      return;
    }

    if (!normalizedEmail) {
      showGlobalError("We could not find the email for this reset.");
      router.replace("/password-reset");
      return;
    }

    resendResetCode(
      { email: normalizedEmail },
      {
        onSuccess: (response) => {
          restart();
          showGlobalSuccess(response.message, 4);
        },
        onError: (err: any) => {
          const message =
            err?.response?.data?.message ||
            err?.message ||
            "Could not resend reset code";

          if (syncFromMessage(message) > 0) {
            showGlobalWarning(message);
            return;
          }

          showGlobalError(message);
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-[#01082E]`}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
    >
      <ScrollView
        contentContainerStyle={tw`flex-grow px-5 pt-14 pb-10`}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => safeGoBack(router, "/password-reset")}
          style={tw`self-start p-2 mb-8`}
        >
          <ArrowLeft color="white" size={20} />
        </TouchableOpacity>

        <View style={tw`gap-2`}>
          <Text style={tw`text-white text-3xl font-bold`}>
            Enter reset code
          </Text>
          <Text style={tw`text-gray-300 text-sm leading-5`}>
            Use the code sent to {normalizedEmail || "your email"} and choose a
            new password for your GatherGo account.
          </Text>
        </View>

        <View
          style={tw`mt-10 rounded-xl bg-[#1B2A50]/40 border border-[#2A3D6A] px-4 py-3`}
        >
          <View style={tw`flex-row items-center gap-3`}>
            <ShieldCheck color="#94A3B8" size={18} />
            <TextInput
              style={tw`flex-1 text-white py-2 tracking-widest`}
              placeholder="Enter reset code"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              value={normalizedCode}
              onChangeText={(text) => setCode(text.replace(/\D/g, ""))}
              maxLength={6}
            />
          </View>
        </View>

        <View style={tw`mt-6 gap-4`}>
          <Input
            placeholder="Create a new password"
            LeftIcon={Key}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <Input
            placeholder="Confirm your new password"
            LeftIcon={Key}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        {isCoolingDown ? (
          <Text style={tw`mt-6 text-[#8FA1CB] font-medium`}>
            Resend code in {formattedRemaining}
          </Text>
        ) : (
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={isResending}
            style={tw`mt-6 self-start`}
          >
            <Text style={tw`text-[#0FF1CF] font-semibold`}>
              {isResending ? "Sending another code..." : "Resend code"}
            </Text>
          </TouchableOpacity>
        )}

        <View style={tw`mt-auto pt-10 gap-3`}>
          <CustomButton
            onPress={handleResetPassword}
            title={isResetting ? "Resetting..." : "Reset password"}
            buttonClassName="bg-[#0FF1CF] border-0 w-full"
            textClassName="!text-black"
            arrowCircleColor="bg-[#0A7F7F]"
            disabled={!canSubmit || isResetting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PasswordResetVerifyScreen;
