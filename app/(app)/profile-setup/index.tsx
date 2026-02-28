import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import Input from "@/components/inputs/CustomInput1";
import DatePicker from "@/components/inputs/DatePicker";
import { useAuth } from "@/context/AuthContext";
import { ProfileFormData, profileSchema } from "@/schemas/profile";
import {
  useCheckUsernameExists,
  useCompleteProfile,
} from "@/services/mutations";
import { CompleteProfileData } from "@/types/auth";
import { extractDate } from "@/utils/dateTimeHandler";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { useDebounce } from "@/utils/useDebounce";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { AtSign, CakeIcon, UserRoundPen } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import tw from "twrnc";

// Update the ProfileFormData type in your schemas/profile.ts to only include these fields:
// fullName: string
// username: string
// birthDate: Date | undefined

const ProfileSetup = () => {
  const { setUser } = useAuth();
  const [picker, setPicker] = useState<boolean>(false);
  const {
    control,
    watch,
    setError,
    clearErrors,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      username: "",
      birthDate: undefined,
    },
  });

  const username = watch("username");
  const birthDate = watch("birthDate");
  const debouncedUsername = useDebounce(username, 500);
  const { mutateAsync: checkUsername, isPending } = useCheckUsernameExists({});
  const { mutateAsync: completProfile, isPending: completeProfilePending } =
    useCompleteProfile({
      onSuccess(data) {
        showGlobalSuccess(data.message);
        setUser((prev) => ({ ...prev, isProfileComplete: true }));
        router.replace("/");
      },
      onError(error) {
        showGlobalError(error.message);
        console.log(error);
      },
    });

  const renderDateTimePicker = (onChange: (value: any) => void) => {
    if (!picker) return null;

    return (
      <DateTimePickerModal
        isVisible={true}
        mode={"date"}
        onConfirm={(selected) => {
          onChange(selected);
          setPicker(false);
        }}
        onCancel={() => setPicker(false)}
      />
    );
  };

  // --- Live username validation ---
  useEffect(() => {
    if (!debouncedUsername) return;

    let isMounted = true;

    const validateUsername = async () => {
      try {
        const data = await checkUsername(debouncedUsername);
        if (!isMounted) return;

        if (data.data.available) {
          clearErrors("username");
        } else {
          setError("username", {
            type: "manual",
            message: "Username already taken",
          });
        }
      } catch {
        // handle network errors optionally
      }
    };

    validateUsername();
    return () => {
      isMounted = false;
    };
  }, [debouncedUsername]);

  // --- Submit handler ---
  const onSubmit = async (data: CompleteProfileData) => {
    await completProfile(data);
    console.log("Profile ready to save:", data);
  };

  const router = useRouter();

  const getBirthdayVibe = () => {
    if (!birthDate) return "";
    const year =
      birthDate instanceof Date
        ? birthDate.getFullYear()
        : new Date(birthDate).getFullYear();

    if (Number.isNaN(year)) return "";

    if (year >= 2013) {
      return "Hey Gen Alpha — you were born swiping. The future? Yeah, that’s your playground.";
    }

    if (year >= 1997) {
      return "What’s good, Gen Z — you’re remixing the rules and making the internet your stage.";
    }

    if (year >= 1981) {
      return "Millennial check-in — you survived dial-up, built the digital world, and kept it moving.";
    }

    if (year >= 1965) {
      return "Gen X — low-key legends. Independent, adaptable, and never needing the spotlight.";
    }

    if (year >= 1946) {
      return "Boomers — you put in the work and built the systems we still run on today.";
    }

    if (year >= 1928) {
      return "Your generation carried resilience like a badge of honor — history remembers.";
    }

    return "Respect always — your generation’s courage shaped the world we live in.";
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-[#01082E]`}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
    >
      <ScrollView
        contentContainerStyle={tw`flex-grow items-center px-5 pt-20 pb-10 gap-5`}
        keyboardShouldPersistTaps="handled"
      >
      <CustomeTopBarNav
        title="Setup Profile"
        onClickBack={() => router.back()}
      />

      <View style={tw`w-full max-w-[500px] flex-1 flex flex-col gap-5`}>
        {/* Full Name */}
        <CustomView style={tw`gap-2`}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { value, onChange } }) => (
              <Input
                placeholder="Full Name"
                value={value}
                LeftIcon={UserRoundPen}
                onChangeText={onChange}
                error={errors?.fullName?.message}
              />
            )}
          />
        </CustomView>

        {/* Username */}

        <CustomView style={tw`gap-2`}>
          <Controller
            control={control}
            name="username"
            render={({ field: { value, onChange } }) => (
              <View style={tw`relative`}>
                <Input
                  placeholder="Username"
                  value={value}
                  LeftIcon={AtSign}
                  onChangeText={(text) => onChange(text.toLowerCase())}
                  autoCapitalize="none"
                  error={errors?.username?.message}
                />
                {isPending && (
                  <View
                    style={tw`absolute right-3 top-0 bottom-0 justify-center`}
                  >
                    <ActivityIndicator size="small" color="#0FF1CF" />
                  </View>
                )}
              </View>
            )}
          />
        </CustomView>

        {/* Birthday (Date Picker) */}
        <CustomView style={tw`gap-2`}>
          <Controller
            control={control}
            name="birthDate"
            render={({ field: { value, onChange } }) => (
              <>
                <DatePicker
                  LeftIcon={CakeIcon}
                  placeholder="Select Birth date"
                  value={
                    typeof value === "string"
                      ? value
                      : value
                      ? extractDate(value)
                      : ""
                  }
                  onPress={() => setPicker(true)}
                  error={errors.birthDate?.message}
                />
                {!!getBirthdayVibe() && (
                  <Text style={tw`text-[#0FF1CF] text-xs mt-1`}>
                    {getBirthdayVibe()}
                  </Text>
                )}
                {renderDateTimePicker(onChange)}
              </>
            )}
          />
        </CustomView>
      </View>

      {/* Next Button */}
      <CustomButton
        onPress={handleSubmit(onSubmit)}
        disabled={isPending || completeProfilePending}
        title={
          isPending ? "Checking..." : isSubmitting ? "Submitting..." : "Next"
        }
        buttonClassName="bg-[#0FF1CF] border-0 !w-full"
        textClassName="!text-black"
        showArrow={false}
      />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ProfileSetup;
