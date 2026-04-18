import { usePhoneFirebaseAuth } from "@/services/mutations";
import { useAuthStore } from "@/store/auth";
import { PhoneVerificationArtifact } from "@/types/auth";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { saveItem } from "@/utils/storage";
import { useRouter } from "expo-router";
import { Platform } from "react-native";

const normalizePhoneNumber = (value: string) =>
  value.replace(/[^\d+]/g, "").trim();

type VerifyPhoneParams = {
  phoneNumber: string;
  smsCode: string;
  verificationId?: string;
};

export const usePhoneAuthFlow = () => {
  const router = useRouter();
  const { mutateAsync, isPending } = usePhoneFirebaseAuth();

  const verifyAndSignIn = async ({
    phoneNumber,
    smsCode,
    verificationId,
  }: VerifyPhoneParams) => {
    const cleanPhoneNumber = normalizePhoneNumber(phoneNumber);
    const cleanSmsCode = smsCode.trim();

    if (!cleanPhoneNumber || cleanPhoneNumber.length < 8) {
      showGlobalError("Enter a valid phone number");
      return;
    }

    if (!cleanSmsCode || cleanSmsCode.length < 4) {
      showGlobalError("Enter a valid verification code");
      return;
    }

    const artifact: PhoneVerificationArtifact = {
      provider: "firebase_pnv",
      verificationId,
      smsCode: cleanSmsCode,
    };

    try {
      const data = await mutateAsync({
        phoneNumber: cleanPhoneNumber,
        verificationArtifact: artifact,
        deviceInfo: {
          platform: Platform.OS,
        },
      });

      const { login } = useAuthStore.getState();
      await login(data.data.accessToken, data.data.refreshToken);
      await saveItem("user", JSON.stringify(data.data.user));
      showGlobalSuccess("Phone verified successfully");
      router.replace("/");
    } catch (err: any) {
      showGlobalError(
        err?.response?.data?.message ||
          err?.message ||
          "Phone verification failed"
      );
    }
  };

  return { verifyAndSignIn, isPending };
};

