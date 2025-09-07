import CustomSwitcher from "@/components/CustomSwitcher"
import GoogleWebView from "@/components/GoogleWebView"
import CustomButton from "@/components/buttons/CustomBtn1"
import GoogleLoginBtn from "@/components/buttons/GoogleLoginBtn"
import Input from "@/components/inputs/CustomInput1"
import { useGoogleLogin, useLogin } from "@/services/mutations"
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler"
import { zodResolver } from "@hookform/resolvers/zod"
import * as Linking from 'expo-linking'
import { useRouter } from "expo-router"
import { Key, Mail, XIcon, } from "lucide-react-native"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { Image, Text, TouchableOpacity, View } from "react-native"
import * as z from "zod"

// Zod schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const index = () => {

  const { mutate: googleLogin,isPending } = useGoogleLogin();
  const { mutate: login, isPending:loginPending } = useLogin();

  // React Hook Form
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login(
      { email: data.email, password: data.password },
      {
        onSuccess: () => {
          
          showGlobalSuccess("Logged in successfully");
          router.replace("/"); // navigate after login
        },
        onError: (err: any) => {
          showGlobalError(err?.response?.data?.message || err?.message || "Login failed");
        },
      }
    );
  };
  // const handleGoogleLogin = async () => {
  //   // Deep link for redirect back to your app
  //   const redirectUrl = Linking.createURL(''); // e.g., myapp://redirect
  //   const loginUrl = `${AUTH_URLS.googleLogin}?redirect=${encodeURIComponent(redirectUrl)}`;
  
  //   await WebBrowser.openBrowserAsync(loginUrl);
  // };

  const [showWebView, setShowWebView] = useState(false);
  const handleGoogleSuccess = (token: string) => {
    setShowWebView(false);
    googleLogin(token, {
      onSuccess: () => {
        showGlobalSuccess("Logged in successfully");
        router.replace("/");
      },
      onError: (err: any) => {
        showGlobalError(err?.response?.data?.message || "Google login failed");
      },
    });
  };

  const handleGoogleError = (error: string) => {
    setShowWebView(false);
    showGlobalError(error);
  };

  const handleGoogleLogin = () => {
    setShowWebView(true);
  };


  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const parsed = Linking.parse(url);
      const token = parsed.queryParams?.token;
      if (token) {
        googleLogin(token, {
          onSuccess: () => {
            showGlobalSuccess("Logged in successfully");
            router.replace("/"); // navigate after success
          },
          onError: (err: any) => {
            showGlobalError(err?.response?.data?.message || err?.message || "Google login failed");
          },
        });
      }
    });
  
    return () => subscription.remove();
  }, []);
  

    const router = useRouter()
  return (
    <View className="flex-1 bg-[#01082E] flex flex-col justify-center items-center px-5 py-14 gap-5 overflow-scroll">
        <TouchableOpacity className="absolute top-10 left-8" onPress={()=>router.replace("/onboarding")}>
            <XIcon color="white"/>
        </TouchableOpacity>
        <View className="flex flex-col justify-center items-center relative">
            <Image source={require('../../../assets/images/vector1.png')} className="absolute  -top-14 left-10"/>
            <Image source={require('../../../assets/images/gglogo.png')} />
        </View>
      <Text className="text-white">Sign in</Text>
      <GoogleLoginBtn  onPress={handleGoogleLogin} disabled={isPending}/>
      {showWebView && (
        <GoogleWebView
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          onClose={() => setShowWebView(false)}
        />
      )}
      <View className="flex flex-row justify-between items-center w-full max-w-[500px]">
        <View className="w-1/3 mt-1 bg-white h-px">

        </View>
        <Text className="text-white ">OR</Text>
        <View className="w-1/3 mt-1 bg-white h-px">
            
        </View>
      </View>
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
{/* 
      <Input placeholder="Put your email" LeftIcon={Mail} />
      <Input placeholder="Put your password" LeftIcon={Key} secureTextEntry={true} /> */}
      <View className="flex flex-row justify-between items-center w-full max-w-[500px]">
        <View className="flex flex-row gap-2 items-center">
            <CustomSwitcher/>
            
            <Text className="text-white">Remember me</Text>
    
            
        </View>
            <TouchableOpacity onPress={()=>router.replace("/password-reset")} >
                <Text className="text-white">Forgot password ?</Text>
            </TouchableOpacity>
      </View>
      {/* <CustomButton onPress={()=>router.push('/profile-setup')} title={'Sign in'} buttonClassName='w-full bg-[#0FF1CF] border-0 text-black' arrowCircleColor='bg-[#0C7F7F]' textClassName='text-black' /> */}

      <CustomButton
        title={loginPending ? "Signing in..." : "Sign In"}
        buttonClassName="!w-full bg-[#0FF1CF] border-0"
        arrowCircleColor="bg-[#0C7F7F]"
        textClassName="!text-black"
        onPress={handleSubmit(onSubmit)}
        disabled={loginPending}
      />
      <TouchableOpacity onPress={()=> router.replace("/signup")} className="w-full max-w-[500px] flex flex-row justify-center">
        <Text className="text-white">Don’t have an account?  Sign up</Text>
      </TouchableOpacity>
      <View className="flex flex-row items-baseline absolute bottom-0 left-0">
        <Image source={require('../../../assets/images/vector2.png')}></Image>
        <Image source={require('../../../assets/images/vector3.png')}></Image>
      </View>
      
    </View>
  )
}

export default index
