import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomButton from "@/components/buttons/CustomBtn1";
import Dropdown from "@/components/inputs/CustomDropDown";
import Input from "@/components/inputs/CustomInput1";
import DatePicker from "@/components/inputs/DatePicker";
import NationalityDropdown from "@/components/inputs/NationalityDropDown";
import { useAuth } from "@/context/AuthContext";
import { ProfileFormData, profileSchema } from "@/schemas/profile";
import { useCheckUsernameExists, useCompleteProfile } from "@/services/mutations";
import { CompleteProfileData } from "@/types/auth";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { useDebounce } from "@/utils/useDebounce";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Calendar, User } from "lucide-react-native";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";

// --- Component ---
const ProfileSetup = () => {

  const {setUser} = useAuth()
  const { control, watch, setError, clearErrors, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ProfileFormData>({
      resolver: zodResolver(profileSchema),
      defaultValues: { 
        fullName: "", 
        username: "", 
        nationality: "", 
        gender: "", 
        birthDate: undefined, // 👈 add default for birthday
      },
    });

  const username = watch("username");
  const debouncedUsername = useDebounce(username, 500); 
  const { mutateAsync: checkUsername, isPending } = useCheckUsernameExists({});
  const { mutateAsync: completProfile, isPending: completeProfilePending } = useCompleteProfile({
    onSuccess(data) {

      showGlobalSuccess(data.message)
      setUser(prev=>({...prev,isProfileComplete:true}))
      router.replace("/edit-bio")
    },
   onError(error) {
     showGlobalError(error.message)
     console.log(error)
   },
  });

  // --- Live username validation ---
  useEffect(() => {
    if (!debouncedUsername || errors.username?.message?.includes("Username")) return;

    let isMounted = true;

    const validateUsername = async () => {
      try {
        const data = await checkUsername(debouncedUsername);
        if (!isMounted) return;

        if (data.data.available) {
          clearErrors("username");
        } else {
          setError("username", { type: "manual", message: "Username already taken" });
        }
      } catch {
        // handle network errors optionally
      }
    };

    validateUsername();
    return () => { isMounted = false; };
  }, [debouncedUsername]);

  // --- Submit handler ---
  const onSubmit = async(data: CompleteProfileData) => {
  
    await completProfile(data)
    console.log("Profile ready to save:", data);
  };

 
  const router = useRouter();
  

  return (
 
    <View className="flex-1 items-center bg-[#01082E] px-5 py-10 gap-5">
      <CustomeTopBarNav
        title="Setup Profile"
        onClickBack={() => router.replace("/profile")}
      />
   <ScrollView className="w-full max-w-[500px] my-10">
      <View className="w-full max-w-[500px] flex-1 flex flex-col justify-center gap-5">
        {/* Full Name */}
        <Controller
          control={control}
          name="fullName"
          render={({ field: { value, onChange } }) => (
            <Input placeholder="Full Name" value={value} onChangeText={onChange} />
          )}
        />
        {errors.fullName && <Text className="text-red-500">{errors.fullName.message}</Text>}

        {/* Username */}
        <Controller
          control={control}
          name="username"
          render={({ field: { value, onChange } }) => (
            <Input placeholder="Username"  value={value} onChangeText={(text) => onChange(text.toLowerCase())} autoCapitalize="none" />
          )}
        />
        {errors.username && <Text className="text-red-500">{errors.username.message}</Text>}

        {/* Nationality */}
        <Controller
          control={control}
          name="nationality"
          render={({ field: { value, onChange } }) => (
            <NationalityDropdown nationality={value} setNationality={onChange} />
          )}
        />
        {errors.nationality && <Text className="text-red-500">{errors.nationality.message}</Text>}

        {/* Gender */}
        <Controller
          control={control}
          name="gender"
          render={({ field: { value, onChange } }) => (
            <Dropdown
              LeftIcon={User}
              placeholder="Select Gender"
              selectedValue={value}
              onValueChange={onChange}
              options={[
                { label: "Male", value: "MALE" },
                { label: "Female", value: "FEMALE" },
                { label: "Other", value: "OTHER" },
              ]}
            />
          )}
        />
        {errors.gender && <Text className="text-red-500">{errors.gender.message}</Text>}

        {/* Birthday (Date Picker) */}
        <Controller
          control={control}
          name="birthDate"
          render={({ field: { value, onChange } }) => (
            <DatePicker
              LeftIcon={Calendar}
              placeholder="Select Birth date"
              value={value instanceof Date ? value : undefined}
              onChange={onChange}
              error={errors.birthDate?.message}
            />
          )}
        />
      </View>
      </ScrollView>

      {/* Next Button */}
      <CustomButton 
        onPress={handleSubmit(onSubmit)} 
        disabled={isPending} 
        title={isPending ? "Checking..." : isSubmitting ? "submitting..." :"Next"} 
        buttonClassName="bg-[#0FF1CF] border-0 !w-full" 
        textClassName="!text-black" 
        showArrow={false} 
      />
    </View>

  );
};

export default ProfileSetup;
