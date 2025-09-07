import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Key, Mail, XIcon } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { Image, Text, TouchableOpacity, View } from "react-native";
import * as z from "zod";

import CustomButton from "@/components/buttons/CustomBtn1";
import Input from "@/components/inputs/CustomInput1";
import { useSignUpMutation } from "@/services/mutations";
import { showGlobalError } from "@/utils/globalErrorHandler";
 // hypothetical global error handler

// Zod schema
const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

const SignUp = () => {
  const router = useRouter();
  const { mutate: signUp, isPending } = useSignUpMutation();

  // React Hook Form
  const { control, handleSubmit, formState: { errors } } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = (data: SignUpFormData) => {
    signUp(
      { email: data.email, password: data.password },
      {
        onSuccess: () => {
          router.replace("/");
        },
        onError: (err: any) => {
          // Send the error to a global handler
          showGlobalError(err?.message || "Signup failed");
        },
      }
    );
  };

  return (
    <View className="flex-1 bg-[#01082E] justify-center items-center px-5 py-14 gap-5">
      
      {/* Back Button */}
      <TouchableOpacity
        className="absolute top-10 left-8"
        onPress={() => router.replace("/login")}
      >
       <XIcon color="white"/>
      </TouchableOpacity>

      {/* Logo */}
      <View className="flex flex-col justify-center items-center relative">
        <Image
          source={require("../../../assets/images/vector1.png")}
          className="absolute -top-14 left-10"
        />
        <Image source={require("../../../assets/images/gglogo.png")} />
      </View>

      <Text className="text-white text-lg font-semibold">Sign Up</Text>

      {/* Email */}
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
      {errors.email && <Text className="text-red-500">{errors.email.message}</Text>}

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
      {errors.password && <Text className="text-red-500">{errors.password.message}</Text>}

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
        <Text className="text-red-500">{errors.confirmPassword.message}</Text>
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
        className="w-full flex-row justify-center mt-5"
        onPress={() => router.replace("/login")}
      >
        <Text className="text-white">Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignUp;
