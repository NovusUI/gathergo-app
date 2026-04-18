import CustomButton from "@/components/buttons/CustomBtn1";
import { useAuth } from "@/context/AuthContext";
import {
  DEFAULT_RESEND_COOLDOWN_SECONDS,
  useResendCooldown,
} from "@/hooks/useResendCooldown";
import {
  useResendEmailVerificationCode,
  useVerifyEmailCode,
} from "@/services/mutations";
import { useAuthStore } from "@/store/auth";
import { AuthData } from "@/types/auth";
import {
  showGlobalError,
  showGlobalSuccess,
  showGlobalWarning,
} from "@/utils/globalErrorHandler";
import { safeGoBack } from "@/utils/navigation";
import { useLockedRouter } from "@/utils/navigation";
import { saveItem } from "@/utils/storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, ShieldCheck } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

const EmailVerifyScreen = () => {
  const router = useLockedRouter();
  const { setUser } = useAuth();
  const { email, sentAt } = useLocalSearchParams<{
    email?: string | string[];
    sentAt?: string | string[];
  }>();
  const [code, setCode] = useState("");
  const { mutate: verifyEmailCode, isPending: isVerifying } =
    useVerifyEmailCode();
  const { mutate: resendCode, isPending: isResending } =
    useResendEmailVerificationCode();

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
    () => normalizedEmail.length > 0 && normalizedCode.length >= 4,
    [normalizedCode.length, normalizedEmail.length]
  );

  const completeAuthSession = async (authData: AuthData) => {
    const { login } = useAuthStore.getState();
    await login(authData.accessToken, authData.refreshToken);
    setUser(authData.user);
    await saveItem("user", JSON.stringify(authData.user));
  };

  const handleVerify = () => {
    if (!normalizedEmail) {
      showGlobalError("We could not find the email to verify.");
      router.replace("/signup");
      return;
    }

    verifyEmailCode(
      { email: normalizedEmail, code: normalizedCode },
      {
        onSuccess: async (response) => {
          try {
            await completeAuthSession(response.data);
            showGlobalSuccess(response.message);
          } catch {
            showGlobalError(
              "Email verified, but we could not finish signing you in."
            );
          }
        },
        onError: (err: any) =>
          showGlobalError(
            err?.response?.data?.message ||
              err?.message ||
              "Verification failed"
          ),
      }
    );
  };

  const handleResend = () => {
    if (isCoolingDown) {
      return;
    }

    if (!normalizedEmail) {
      showGlobalError("We could not find the email to resend to.");
      router.replace("/signup");
      return;
    }

    resendCode(
      { email: normalizedEmail },
      {
        onSuccess: (response) => {
          if (!response.data.requiresVerification) {
            showGlobalWarning(response.message);
            router.replace("/login");
            return;
          }

          restart();
          showGlobalSuccess(response.message, 4);
        },
        onError: (err: any) => {
          const message =
            err?.response?.data?.message ||
            err?.message ||
            "Could not resend verification code";

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
    <View style={tw`flex-1 bg-[#01082E] px-5 pt-14 pb-8`}>
      <TouchableOpacity
        onPress={() => safeGoBack(router, "/signup")}
        style={tw`self-start p-2`}
      >
        <ArrowLeft color="white" size={20} />
      </TouchableOpacity>

      <View style={tw`mt-8 gap-2`}>
        <Text style={tw`text-white text-3xl font-bold`}>Verify email</Text>
        <Text style={tw`text-gray-300 text-sm leading-5`}>
          Enter the 6-digit code sent to {normalizedEmail || "your email"} to
          finish setting up your GatherGo account.
        </Text>
      </View>

      <View
        style={tw`mt-10 rounded-xl bg-[#1B2A50]/40 border border-[#2A3D6A] px-4 py-3`}
      >
        <View style={tw`flex-row items-center gap-3`}>
          <ShieldCheck color="#94A3B8" size={18} />
          <TextInput
            style={tw`flex-1 text-white py-2 tracking-widest`}
            placeholder="Enter verification code"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            value={normalizedCode}
            onChangeText={(text) => setCode(text.replace(/\D/g, ""))}
            maxLength={6}
          />
        </View>
      </View>

      <Text style={tw`text-gray-400 text-xs mt-3 leading-5`}>
        The code expires after a few minutes. If it is missing, check spam or
        request a fresh code below.
      </Text>

      {isCoolingDown ? (
        <Text style={tw`mt-6 text-[#8FA1CB] font-medium`}>
          Resend code in {formattedRemaining}
        </Text>
      ) : (
        <TouchableOpacity
          onPress={handleResend}
          disabled={isResending}
          style={tw`mt-6 self-start`}
        >
          <Text style={tw`text-[#0FF1CF] font-semibold`}>
            {isResending ? "Sending another code..." : "Resend code"}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => router.replace("/login")}
        style={tw`mt-3 self-start`}
      >
        <Text style={tw`text-gray-300`}>Back to sign in</Text>
      </TouchableOpacity>

      <View style={tw`mt-auto gap-3`}>
        <CustomButton
          onPress={handleVerify}
          title={isVerifying ? "Verifying..." : "Verify & sign in"}
          buttonClassName="bg-[#0FF1CF] border-0 w-full"
          textClassName="!text-black"
          arrowCircleColor="bg-[#0A7F7F]"
          disabled={!canSubmit || isVerifying}
        />
      </View>
    </View>
  );
};

export default EmailVerifyScreen;
