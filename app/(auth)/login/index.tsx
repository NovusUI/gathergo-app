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
import tw from "twrnc";
import * as z from "zod";

const GOOGLE_AUTH_URL = "http://10.114.200.150:4000/api/v1/auth/google";

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

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login(
      { email: data.email, password: data.password },
      {
        onSuccess: (data) => {
          showGlobalSuccess("Logged in successfully");
          console.log(data, "Logged in successfully");
          completeLogin(data.data.accessToken, data.data.refreshToken);
          //router.replace("/");
        },
        onError: (err: any) => {
          showGlobalError(
            err?.response?.data?.message || err?.message || "Login failed"
          );
        },
      }
    );
  };

  const handleGoogleLogin = async () => {
    try {
      const redirectUrl = Linking.createURL("onboarding");
      const authUrl = `${GOOGLE_AUTH_URL}?redirect=${encodeURIComponent(
        redirectUrl
      )}`;
      await WebBrowser.openBrowserAsync(authUrl);
    } catch (error) {
      showGlobalError("Failed to open Google login");
    }
  };

  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      const parsed = Linking.parse(url);
      const queryParams = parsed.queryParams;
      const token = String(queryParams?.token || "");
      const refreshToken = String(queryParams?.refreshToken || "");

      if (token && refreshToken) {
        completeLogin(token, refreshToken);
      }

      WebBrowser.dismissBrowser();
    });

    return () => subscription.remove();
  }, []);

  const completeLogin = async (token: string, reFreshToken: string) => {
    const { login } = useAuthStore.getState();
    login(token, reFreshToken);
    const { sub, email, hasPreferences }: DecodedToken = jwtDecode(token);

    setUser({ id: sub, email, hasPreferences });
    await saveItem(
      "user",
      JSON.stringify({
        id: sub,
        email,
        hasPreferences,
      })
    );
  };

  return (
    <View
      style={tw`flex-1 bg-[#01082E]  justify-center items-center px-5 py-14 gap-6`}
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
        <Image
          source={require("../../../assets/images/vector1.png")}
          style={tw.style({ position: "absolute", top: -56, left: 40 })}
        />
        <Image source={require("../../../assets/images/gglogo.png")} />
      </View>

      {/* Title */}
      <Text style={tw`text-white text-2xl font-semibold mt-4`}>Sign in</Text>

      {/* Google Login Button */}
      <GoogleLoginBtn onPress={handleGoogleLogin} />

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
            onChangeText={onChange}
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
          <CustomSwitcher />
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
          Don't have an account? <Text style={tw`font-semibold`}>Sign up</Text>
        </Text>
      </TouchableOpacity>

      {/* Bottom Decorative Images */}
      <View
        style={tw.style("flex-row items-baseline absolute bottom-0 left-0")}
      >
        <Image source={require("../../../assets/images/vector2.png")} />
        <Image source={require("../../../assets/images/vector3.png")} />
      </View>
    </View>
  );
};

export default LoginScreen;
