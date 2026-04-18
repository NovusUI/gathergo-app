import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import Input from "@/components/inputs/CustomInput1";
import DatePicker from "@/components/inputs/DatePicker";
import ActivityIndicator from "@/components/ui/AppLoader";
import { useAuth } from "@/context/AuthContext";
import { ProfileFormData, profileSchema } from "@/schemas/profile";
import {
  useCheckUsernameExists,
  useCompleteProfile,
} from "@/services/mutations";
import { CompleteProfileData } from "@/types/auth";
import { extractDate } from "@/utils/dateTimeHandler";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { safeGoBack } from "@/utils/navigation";
import { useLockedRouter } from "@/utils/navigation";
import { useDebounce } from "@/utils/useDebounce";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { AtSign, CakeIcon, UserRoundPen } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Keyboard,
  KeyboardAvoidingView,
  KeyboardEvent,
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
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [picker, setPicker] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [usernameStatus, setUsernameStatus] = useState<"" | "available" | "taken">("");
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
          setUsernameStatus("available");
          clearErrors("username");
        } else {
          setUsernameStatus("taken");
          setError("username", {
            type: "manual",
            message: "Already claimed. Try a cleaner variation.",
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
  }, [debouncedUsername, checkUsername, clearErrors, setError]);

  useEffect(() => {
    if (!debouncedUsername) {
      setUsernameStatus("");
    }
  }, [debouncedUsername]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      "keyboardDidShow",
      (event: KeyboardEvent) => {
        setKeyboardHeight(event.endCoordinates?.height ?? 0);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 120);
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

  // --- Submit handler ---
  const onSubmit = async (data: CompleteProfileData) => {
    await completProfile(data);
    console.log("Profile ready to save:", data);
  };

  const router = useLockedRouter();

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

  const scrollToInputArea = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-[#01082E]`}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          tw`flex-grow items-center px-5 pt-20 gap-5`,
          keyboardHeight > 0 ? tw`justify-start` : null,
          Platform.OS === "android" && keyboardHeight > 0
            ? { paddingBottom: keyboardHeight + 32 }
            : { paddingBottom: 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
      <CustomeTopBarNav
        title="Profile"
        onClickBack={() => safeGoBack(router, "/")}
      />

      <View style={tw`w-full max-w-[500px] flex-1 flex flex-col gap-5`}>
        <View style={tw`gap-2`}>
          <Text style={tw`text-white text-3xl font-bold`}>
            Make your presence known
          </Text>
          <Text style={tw`text-[#B9C7F1] text-sm leading-6`}>
            Your profile helps people find you, trust you, and connect you to the right impact events.
          </Text>
        </View>

        <View style={tw`bg-[#0FF1CF]/10 border border-[#0FF1CF]/25 rounded-2xl px-4 py-4 gap-1`}>
          <Text style={tw`text-[#0FF1CF] text-[11px] font-bold tracking-widest uppercase`}>
            Community-first
          </Text>
          <Text style={tw`text-white text-sm`}>
            People show up more confidently when they know who&apos;s in the room.
          </Text>
        </View>

        {/* Full Name */}
        <CustomView style={tw`gap-2`}>
          <Text style={tw`text-white text-sm font-semibold`}>Name</Text>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { value, onChange } }) => (
              <Input
                placeholder="What should people call you?"
                value={value}
                LeftIcon={UserRoundPen}
                onChangeText={onChange}
                onFocus={scrollToInputArea}
                error={errors?.fullName?.message}
              />
            )}
          />
        </CustomView>

        {/* Username */}

        <CustomView style={tw`gap-2`}>
          <Text style={tw`text-white text-sm font-semibold`}>Username</Text>
          <Controller
            control={control}
            name="username"
            render={({ field: { value, onChange } }) => (
              <View style={tw`relative`}>
                <Input
                  placeholder="Choose your @name"
                  value={value}
                  LeftIcon={AtSign}
                  onChangeText={(text) => onChange(text.toLowerCase())}
                  autoCapitalize="none"
                  onFocus={scrollToInputArea}
                  error={errors?.username?.message}
                />
                {isPending && (
                  <View
                    style={tw`absolute right-3 top-0 bottom-0 justify-center`}
                  >
                    <ActivityIndicator tone="accent" size="small" />
                  </View>
                )}
              </View>
            )}
          />
          {!errors?.username?.message && usernameStatus === "available" && (
            <Text style={tw`text-[#0FF1CF] text-xs`}>
              Nice. This one is yours.
            </Text>
          )}
        </CustomView>

        {/* Birthday (Date Picker) */}
        <CustomView style={tw`gap-2`}>
          <Text style={tw`text-white text-sm font-semibold`}>Birthday</Text>
          <Controller
            control={control}
            name="birthDate"
            render={({ field: { value, onChange } }) => (
              <>
                <DatePicker
                  LeftIcon={CakeIcon}
                  placeholder="When were you born?"
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
          isPending
            ? "Checking..."
            : isSubmitting
            ? "Submitting..."
            : "Step into GatherGo"
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
