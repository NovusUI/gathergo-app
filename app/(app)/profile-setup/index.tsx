import { useAppTheme } from "@/hooks/useAppTheme";
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
import { extractDate } from "@/utils/dateTimeHandler";
import { showGlobalError } from "@/utils/globalErrorHandler";
import { safeGoBack, useLockedRouter } from "@/utils/navigation";
import { useDebounce } from "@/utils/useDebounce";
import { zodResolver } from "@hookform/resolvers/zod";
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

const ProfileSetup = () => {
  const { tw } = useAppTheme();
  const { user, setUser } = useAuth();
  const router = useLockedRouter();
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
  const debouncedUsername = useDebounce(username, 500);
  const { mutateAsync: checkUsername, isPending } = useCheckUsernameExists({});
  const { mutateAsync: completeProfile, isPending: completeProfilePending } =
    useCompleteProfile({
      onError(error) {
        showGlobalError(error.message);
      },
    });

  const renderDateTimePicker = (onChange: (value: Date) => void) => {
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

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) {
      showGlobalError("Please sign in again to finish your profile.");
      return;
    }

    try {
      const birthDate = extractDate(data.birthDate);
      await completeProfile({
        fullName: data.fullName,
        username: data.username,
        birthDate,
      });
      Keyboard.dismiss();
      setUser({
        ...user,
        fullName: data.fullName,
        username: data.username,
        birthDate,
        isProfileComplete: true,
      });
      router.replace(user.hasPreferences ? "/" : "/preference");
    } catch (error) {
      console.error("Profile completion failed:", error);
    }
  };

  const scrollToInputArea = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-background dark:bg-[#01082E]`}
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
          <Text style={tw`text-foreground dark:text-white text-3xl font-bold`}>
            Make your presence known
          </Text>
          <Text style={tw`text-secondary dark:text-[#B9C7F1] text-sm leading-6`}>
            Your profile helps people find you, trust you, and connect you to events and communities you enjoy.
          </Text>
        </View>

        <View style={tw`bg-accentFill/10 dark:bg-[#0FF1CF]/10 border border-accent/25 dark:border-[#0FF1CF]/25 rounded-2xl px-4 py-4 gap-1`}>
          <Text style={tw`text-accent dark:text-[#0FF1CF] text-[11px] font-bold tracking-widest uppercase`}>
            Community-first
          </Text>
          <Text style={tw`text-foreground dark:text-white text-sm`}>
            People show up more confidently when they know who&apos;s in the room.
          </Text>
        </View>

        {/* Full Name */}
        <CustomView style={tw`gap-2`}>
          <Text style={tw`text-foreground dark:text-white text-sm font-semibold`}>Name</Text>
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
          <Text style={tw`text-foreground dark:text-white text-sm font-semibold`}>Username</Text>
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
            <Text style={tw`text-accent dark:text-[#0FF1CF] text-xs`}>
              Nice. This one is yours.
            </Text>
          )}
        </CustomView>

        {/* Birthday (Date Picker) */}
        <CustomView style={tw`gap-2`}>
          <Text style={tw`text-foreground dark:text-white text-sm font-semibold`}>Birthday</Text>
          <Controller
            control={control}
            name="birthDate"
            render={({ field: { value, onChange } }) => (
              <>
                <DatePicker
                  LeftIcon={CakeIcon}
                  placeholder="When were you born?"
                  value={value ? extractDate(value) : ""}
                  onPress={() => setPicker(true)}
                  error={errors.birthDate?.message}
                />
                {renderDateTimePicker(onChange)}
              </>
            )}
          />
        </CustomView>
      </View>

      {/* Next Button */}
      <CustomButton
        onPress={handleSubmit(onSubmit)}
        disabled={isPending || completeProfilePending || isSubmitting}
        title={
          completeProfilePending || isSubmitting
            ? "Saving your profile..."
            : isPending
            ? "Checking..."
            : "Step into GatherGo"
        }
        buttonClassName="bg-accentFill dark:bg-[#0FF1CF] border-0 !w-full"
        textClassName="!text-onAccent dark:text-black"
        showArrow={false}
      />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ProfileSetup;
