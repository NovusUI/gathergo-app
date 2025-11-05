import CustomSwitcher from "@/components/CustomSwitcher";
import CustomButton from "@/components/buttons/CustomBtn1";
import GoogleLoginBtn from "@/components/buttons/GoogleLoginBtn";
import Input from "@/components/inputs/CustomInput1";
import { useAuth } from "@/context/AuthContext";
import { useLogin } from "@/services/mutations";
import { useAuthStore } from "@/store/auth";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { saveItem } from "@/utils/storage";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { jwtDecode } from "jwt-decode";
import { Key, Mail, XIcon } from "lucide-react-native";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Image, Text, TouchableOpacity, View } from "react-native";
import * as z from "zod";

// Your backend Google auth URL
const GOOGLE_AUTH_URL = "http://192.168.114.150:4000/api/v1/auth/google"; // Update this!

// Zod schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
interface DecodedToken {
  role?: "ARTISAN" | "CLIENT";
  exp?: number;
  [key: string]: any;
}

type LoginFormData = z.infer<typeof loginSchema>;

const LoginScreen = () => {
  const router = useRouter();
  const { mutate: login, isPending: loginPending } = useLogin();
  const { setUser } = useAuth();

  // React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Regular email/password login
  const onSubmit = (data: LoginFormData) => {
    login(
      { email: data.email, password: data.password },
      {
        onSuccess: () => {
          showGlobalSuccess("Logged in successfully");
          router.replace("/");
        },
        onError: (err: any) => {
          showGlobalError(
            err?.response?.data?.message || err?.message || "Login failed"
          );
        },
      }
    );
  };

  // Handle Google login via backend URL
  const handleGoogleLogin = async () => {
    try {
      // Create the redirect URL for your app
      const redirectUrl = Linking.createURL("onboarding");

      console.log(redirectUrl, "rurl");
      // Open your backend's Google auth URL with the redirect
      const authUrl = `${GOOGLE_AUTH_URL}?redirect=${encodeURIComponent(
        redirectUrl
      )}`;

      await WebBrowser.openBrowserAsync(authUrl);
    } catch (error) {
      showGlobalError("Failed to open Google login");
    }
  };

  //Deep link listener - catches token when backend redirects back
  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      console.log("Redirected URL:", url);
      const parsed = Linking.parse(url);
      const queryParams = parsed.queryParams;
      const token = String(queryParams?.token || "");
      const refreshToken = String(queryParams?.refreshToken || "");

      // Check if tokens are not empty strings
      if (token && token !== "" && refreshToken && refreshToken !== "") {
        completeLogin(token, refreshToken);
      } else {
        console.log("Missing or invalid tokens");
      }

      WebBrowser.dismissBrowser();
    });

    return () => subscription.remove();
  }, []);

  const completeLogin = async (token: string, reFreshToken: string) => {
    const { login } = useAuthStore.getState();
    login(token, reFreshToken);
    const { sub, email, hasPreferences }: DecodedToken = jwtDecode(token);

    console.log(sub, email, hasPreferences);
    setUser({ id: sub, email, hasPreferences: hasPreferences });
    await saveItem(
      "user",
      JSON.stringify({
        id: sub,
        email,
        hasPreferences: hasPreferences,
      })
    );
  };

  return (
    <View className="flex-1 bg-[#01082E] flex flex-col justify-center items-center px-5 py-14 gap-5">
      {/* Close Button */}
      <TouchableOpacity
        className="absolute top-10 left-8 z-10"
        onPress={() => router.replace("/onboarding")}
      >
        <XIcon color="white" />
      </TouchableOpacity>

      {/* Logo */}
      <View className="flex flex-col justify-center items-center relative">
        <Image
          source={require("../../../assets/images/vector1.png")}
          className="absolute -top-14 left-10"
        />
        <Image source={require("../../../assets/images/gglogo.png")} />
      </View>

      {/* Title */}
      <Text className="text-white text-2xl font-semibold">Sign in</Text>

      {/* Google Login Button */}
      <GoogleLoginBtn onPress={handleGoogleLogin} />

      {/* Divider */}
      <View className="flex flex-row justify-between items-center w-full max-w-[500px]">
        <View className="w-1/3 mt-1 bg-white h-px" />
        <Text className="text-white">OR</Text>
        <View className="w-1/3 mt-1 bg-white h-px" />
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
            onChangeText={onChange}
          />
        )}
      />
      {errors.email && (
        <Text className="text-red-500 self-start">{errors.email.message}</Text>
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
          />
        )}
      />
      {errors.password && (
        <Text className="text-red-500 self-start">
          {errors.password.message}
        </Text>
      )}

      {/* Remember Me & Forgot Password */}
      <View className="flex flex-row justify-between items-center w-full max-w-[500px]">
        <View className="flex flex-row gap-2 items-center">
          <CustomSwitcher />
          <Text className="text-white">Remember me</Text>
        </View>
        <TouchableOpacity onPress={() => router.replace("/password-reset")}>
          <Text className="text-white">Forgot password?</Text>
        </TouchableOpacity>
      </View>

      {/* Sign In Button */}
      <CustomButton
        title={loginPending ? "Signing in..." : "Sign In"}
        buttonClassName="!w-full bg-[#0FF1CF] border-0"
        arrowCircleColor="bg-[#0C7F7F]"
        textClassName="!text-black"
        onPress={handleSubmit(onSubmit)}
        disabled={loginPending}
      />

      {/* Sign Up Link */}
      <TouchableOpacity
        onPress={() => router.replace("/signup")}
        className="w-full max-w-[500px] flex flex-row justify-center"
      >
        <Text className="text-white">
          Don't have an account? <Text className="font-semibold">Sign up</Text>
        </Text>
      </TouchableOpacity>

      {/* Bottom Decorative Images */}
      <View className="flex flex-row items-baseline absolute bottom-0 left-0">
        <Image source={require("../../../assets/images/vector2.png")} />
        <Image source={require("../../../assets/images/vector3.png")} />
      </View>
    </View>
  );
};

export default LoginScreen;
