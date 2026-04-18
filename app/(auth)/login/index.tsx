import CustomSwitcher from "@/components/CustomSwitcher";
import CustomButton from "@/components/buttons/CustomBtn1";
import GoogleLoginBtn from "@/components/buttons/GoogleLoginBtn";
import Input from "@/components/inputs/CustomInput1";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import LocalSvgAsset from "@/components/ui/LocalSvgAsset";
import { GOOGLE_AUTH_URL } from "@/constants/network";
import { useAuth } from "@/context/AuthContext";
import { useLogin } from "@/services/mutations";
import { useAuthStore } from "@/store/auth";
import {
  showGlobalError,
  showGlobalSuccess,
  showGlobalWarning,
} from "@/utils/globalErrorHandler";
import { useLockedRouter } from "@/utils/navigation";
import { getItem, removeItem, saveItem } from "@/utils/storage";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { jwtDecode } from "jwt-decode";
import { Key, Mail, XIcon } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import * as z from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

interface DecodedToken {
  role?: "ARTISAN" | "CLIENT";
  exp?: number;
  sub: string;
  email: string;
  hasPreferences?: boolean;
  isProfileComplete?: boolean;
  username?: string;
}

type LoginFormData = z.infer<typeof loginSchema>;
const REMEMBER_ME_KEY = "remember_me_credentials";
type GoogleAuthPhase = "idle" | "opening" | "completing";

const LoginScreen = () => {
  const router = useLockedRouter();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [googleAuthPhase, setGoogleAuthPhase] =
    useState<GoogleAuthPhase>("idle");
  const { mutate: login, isPending: loginPending } = useLogin();
  const { setUser } = useAuth();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    const sanitizedEmail = data.email.replace(/\s+/g, "").trim();

    login(
      { email: sanitizedEmail, password: data.password },
      {
        onSuccess: async (data) => {
          try {
            showGlobalSuccess("Logged in successfully");
            try {
              if (rememberMe) {
                await saveItem(
                  REMEMBER_ME_KEY,
                  JSON.stringify({
                    email: sanitizedEmail,
                    password: data.password,
                  })
                );
              } else {
                await removeItem(REMEMBER_ME_KEY);
              }
            } catch (error) {
              console.log("failed to update remember me credentials", error);
            }

            await completeLogin(data.data.accessToken, data.data.refreshToken);
          } catch (error) {
            console.log("failed to complete email login", error);
            showGlobalError(
              "You were authenticated, but we could not finish signing you in."
            );
          }
        },
        onError: (err: any) => {
          const errorData = err?.response?.data;
          const errorMessage =
            typeof errorData?.message === "string"
              ? errorData.message
              : err?.message || "Login failed";

          if (
            errorData?.code === "EMAIL_NOT_VERIFIED" &&
            typeof errorData?.email === "string"
          ) {
            showGlobalWarning(errorMessage);
            router.push({
              pathname: "/email-verify",
              params: { email: errorData.email },
            });
            return;
          }

          showGlobalError(errorMessage);
        },
      }
    );
  };

  const handleRememberMeChange = (isEnabled: boolean) => {
    setRememberMe(isEnabled);
    if (!isEnabled) {
      removeItem(REMEMBER_ME_KEY).catch((error) => {
        console.log("failed to clear remember me credentials", error);
      });
    }
  };

  const handleGoogleLogin = async () => {
    if (googleAuthPhase !== "idle") {
      return;
    }

    try {
      const redirectUrl = Linking.createURL("login");
      const authUrl = `${GOOGLE_AUTH_URL}?redirect=${encodeURIComponent(
        redirectUrl
      )}`;

      setGoogleAuthPhase("opening");
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type !== "success") {
        setGoogleAuthPhase("idle");
        return;
      }

      const parsed = Linking.parse(result.url);
      const token = String(parsed.queryParams?.token || "");
      const refreshToken = String(parsed.queryParams?.refreshToken || "");

      if (!token || !refreshToken) {
        setGoogleAuthPhase("idle");
        showGlobalError("Google login did not return the required tokens.");
        return;
      }

      setGoogleAuthPhase("completing");
      await completeLogin(token, refreshToken);
    } catch (error) {
      setGoogleAuthPhase("idle");
      showGlobalError("Google login could not be completed. Please try again.");
    }
  };

  useEffect(() => {
    const loadRememberedCredentials = async () => {
      try {
        const saved = await getItem(REMEMBER_ME_KEY);
        if (!saved) return;
        const parsed = JSON.parse(saved);
        if (parsed?.email) {
          setValue("email", parsed.email);
        }
        if (parsed?.password) {
          setValue("password", parsed.password);
        }
        setRememberMe(true);
      } catch (error) {
        console.log("failed to load remembered credentials", error);
      }
    };

    loadRememberedCredentials();
  }, [setValue]);

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

  const completeLogin = async (token: string, reFreshToken: string) => {
    const { login } = useAuthStore.getState();
    const decodedUser = jwtDecode<DecodedToken>(token);
    const resolvedUser = {
      id: decodedUser.sub,
      email: decodedUser.email,
      hasPreferences: Boolean(decodedUser.hasPreferences),
      isProfileComplete: Boolean(decodedUser.isProfileComplete),
      username: decodedUser.username,
    };

    setUser(resolvedUser);
    await saveItem("user", JSON.stringify(resolvedUser));
    await login(token, reFreshToken);
  };

  const scrollToInputArea = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  if (googleAuthPhase !== "idle") {
    return (
      <FullScreenLoader
        title={
          googleAuthPhase === "opening"
            ? "Connecting to Google"
            : "Logging you in"
        }
        message={
          googleAuthPhase === "opening"
            ? "Finish choosing your account and we will bring you right back."
            : "Please hold on while we finish your GatherGo sign-in."
        }
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-[#01082E]`}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          tw`flex-grow justify-center items-center px-5 py-14 gap-6`,
          keyboardHeight > 0 ? tw`justify-start` : tw`justify-center`,
          Platform.OS === "android" && keyboardHeight > 0
            ? { paddingBottom: keyboardHeight + 24 }
            : null,
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
      {/* Close Button */}
      <TouchableOpacity
        style={tw.style("absolute top-10 left-8")}
        onPress={() => router.replace("/onboarding")}
      >
        <XIcon color="white" />
      </TouchableOpacity>

      {/* Logo */}
      <View style={tw`justify-center items-center relative`}>
        <LocalSvgAsset
          name="vector1"
          width={109}
          height={106}
          style={tw.style({ position: "absolute", top: -56, left: 40 })}
        />
        <LocalSvgAsset name="gglogo" width={80} height={80} />
      </View>

      {/* Title */}
      <Text style={tw`text-white text-2xl font-semibold mt-4`}>Sign in</Text>

      {/* Google Login Button */}
      <GoogleLoginBtn
        onPress={handleGoogleLogin}
        disabled={googleAuthPhase !== "idle"}
      />
      <CustomButton
        title="Continue with phone"
        buttonClassName="w-full border border-[#0FF1CF]"
        textClassName="text-[#0FF1CF]"
        arrowCircleColor="bg-[#0FF1CF]"
        onPress={() => router.push("/phone-login")}
      />

      {/* Divider */}
      <View
        style={tw.style("flex-row justify-between items-center w-full", {
          maxWidth: 500,
          marginVertical: 4,
        })}
      >
        <View
          style={tw.style("bg-white", { flex: 1, height: 1, marginRight: 8 })}
        />
        <Text style={tw`text-white`}>OR</Text>
        <View
          style={tw.style("bg-white", { flex: 1, height: 1, marginLeft: 8 })}
        />
      </View>

      {/* Email Input */}
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <Input
            placeholder="Enter your email"
            LeftIcon={Mail}
            value={value}
            onChangeText={(text) => onChange(text.replace(/\s+/g, ""))}
            onFocus={scrollToInputArea}
          />
        )}
      />
      {errors.email && (
        <Text style={tw`text-red-500 self-start`}>{errors.email.message}</Text>
      )}

      {/* Password Input */}
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <Input
            placeholder="Enter your password"
            LeftIcon={Key}
            secureTextEntry
            value={value}
            onChangeText={onChange}
            onFocus={scrollToInputArea}
          />
        )}
      />
      {errors.password && (
        <Text style={tw`text-red-500 self-start`}>
          {errors.password.message}
        </Text>
      )}

      {/* Remember Me & Forgot Password */}
      <View
        style={tw.style("flex-row justify-between items-center w-full", {
          maxWidth: 500,
        })}
      >
        <View style={tw`flex-row items-center gap-2`}>
          <CustomSwitcher
            isEnabled={rememberMe}
            setIsEnabled={handleRememberMeChange}
          />
          <Text style={tw`text-white`}>Remember me</Text>
        </View>
        <TouchableOpacity onPress={() => router.replace("/password-reset")}>
          <Text style={tw`text-white`}>Forgot password?</Text>
        </TouchableOpacity>
      </View>

      {/* Sign In Button */}
      <CustomButton
        title={loginPending ? "Signing in..." : "Sign In"}
        buttonClassName="bg-[#0FF1CF] w-full border-0"
        arrowCircleColor="bg-[#0C7F7F]"
        textClassName="text-black"
        onPress={handleSubmit(onSubmit)}
        disabled={loginPending}
      />

      {/* Sign Up Link */}
      <TouchableOpacity
        onPress={() => router.replace("/signup")}
        style={tw.style("flex-row justify-center w-full", { maxWidth: 500 })}
      >
        <Text style={tw`text-white`}>
          Do not have an account? <Text style={tw`font-semibold`}>Sign up</Text>
        </Text>
      </TouchableOpacity>

      {/* Bottom Decorative Images */}
      {keyboardHeight === 0 && (
        <View
          style={tw.style("flex-row items-end absolute bottom-0 left-0")}
        >
          <LocalSvgAsset name="vector2" width={78} height={76} />
          <LocalSvgAsset name="vector3" width={53} height={35} />
        </View>
      )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
