import { zodResolver } from "@hookform/resolvers/zod";
import { Key, Mail, XIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Keyboard,
  KeyboardEvent,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";
import * as z from "zod";

import CustomButton from "@/components/buttons/CustomBtn1";
import Input from "@/components/inputs/CustomInput1";
import LocalSvgAsset from "@/components/ui/LocalSvgAsset";
import { useAuth } from "@/context/AuthContext";
import { useSignUpMutation } from "@/services/mutations";
import { useAuthStore } from "@/store/auth";
import { AuthData } from "@/types/auth";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { useLockedRouter } from "@/utils/navigation";
import { saveItem } from "@/utils/storage";

// Zod schema
const signUpSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

const SignUp = () => {
  const router = useLockedRouter();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { mutate: signUp, isPending } = useSignUpMutation();
  const { setUser } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const completeAuthSession = async (authData: AuthData) => {
    const { login } = useAuthStore.getState();
    await login(authData.accessToken, authData.refreshToken);
    setUser(authData.user);
    await saveItem("user", JSON.stringify(authData.user));
  };

  const onSubmit = (data: SignUpFormData) => {
    const sanitizedEmail = data.email.replace(/\s+/g, "").trim();

    signUp(
      { email: sanitizedEmail, password: data.password },
      {
        onSuccess: async (response) => {
          try {
            const payload = response.data;

            if (
              "requiresVerification" in payload &&
              payload.requiresVerification
            ) {
              showGlobalSuccess(response.message, 4);
              router.replace({
                pathname: "/email-verify",
                params: {
                  email: payload.email,
                  sentAt: String(Date.now()),
                },
              });
              return;
            }

            await completeAuthSession(payload);
            showGlobalSuccess("Account created successfully");
          } catch {
            showGlobalError(
              "Account created, but we could not finish signing you in."
            );
          }
        },
        onError: (err: any) =>
          showGlobalError(
            err?.response?.data?.message || err?.message || "Signup failed"
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
      style={tw`flex-1 bg-[#01082E]`}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
    >
      <ScrollView
        contentContainerStyle={[
          tw`flex-grow justify-center items-center px-5 py-14 gap-6`,
          Platform.OS === "android" && keyboardHeight > 0
            ? { paddingBottom: keyboardHeight + 24 }
            : null,
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
      {/* Back Button */}
      <TouchableOpacity
        style={tw`absolute top-10 left-8`}
        onPress={() => router.replace("/login")}
      >
        <XIcon color="white" />
      </TouchableOpacity>

      {/* Logo */}
      <View style={tw`flex-col justify-center items-center relative`}>
        <LocalSvgAsset
          name="vector1"
          width={109}
          height={106}
          style={tw`absolute -top-14 left-10`}
        />
        <LocalSvgAsset name="gglogo" width={80} height={80} />
      </View>

      <Text style={tw`text-white text-lg font-semibold mt-5`}>Sign Up</Text>

      {/* Email */}
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <Input
            placeholder="Enter your email"
            LeftIcon={Mail}
            value={value}
            onChangeText={(text) => onChange(text.replace(/\s+/g, ""))}
          />
        )}
      />
      {errors.email && (
        <Text style={tw`text-red-500 self-start`}>{errors.email.message}</Text>
      )}

      {/* Password */}
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

      {/* Confirm Password */}
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, value } }) => (
          <Input
            placeholder="Confirm your password"
            LeftIcon={Key}
            secureTextEntry
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      {errors.confirmPassword && (
        <Text style={tw`text-red-500 self-start`}>
          {errors.confirmPassword.message}
        </Text>
      )}

      {/* Sign Up Button */}
      <CustomButton
        title={isPending ? "Signing up..." : "Sign Up"}
        buttonClassName="!w-full bg-[#0FF1CF] border-0"
        arrowCircleColor="bg-[#0C7F7F]"
        textClassName="!text-black"
        onPress={handleSubmit(onSubmit)}
        disabled={isPending}
      />

      {/* Back to Sign In */}
      <TouchableOpacity
        style={tw`w-full flex-row justify-center mt-5`}
        onPress={() => router.replace("/login")}
      >
        <Text style={tw`text-white`}>
          Already have an account?{" "}
          <Text style={tw`font-semibold`}>Sign in</Text>
        </Text>
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUp;
