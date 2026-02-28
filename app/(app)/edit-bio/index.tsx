import CustomButton from "@/components/buttons/CustomBtn1";
import TextArea from "@/components/inputs/CustomTextArea";
import { useAuth } from "@/context/AuthContext";
import { BioFormValues, bioSchema } from "@/schemas/bio";
import { useEditBio } from "@/services/mutations";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
} from "react-native";
import tw from "twrnc";

const EditBioScreen = () => {
  const { setUser } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BioFormValues>({
    resolver: zodResolver(bioSchema),
    defaultValues: { bio: "" },
  });

  const { mutateAsync: editBio, isPending: editBioPending } = useEditBio({
    onSuccess(data) {
      showGlobalSuccess(data.message);
      setUser((prev) => ({ ...prev, bio: data.data.bio }));
      router.replace("/profile");
    },
    onError(error) {
      showGlobalError(error.message);
    },
  });

  const onSubmit = async (data: BioFormValues) => {
    await editBio(data);
    console.log("Bio submitted:", data);
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-[#01082E]`}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
    >
      <ScrollView
        contentContainerStyle={tw`flex-grow justify-center items-center px-5 pt-20 pb-10 gap-5`}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={tw`text-white`}>Bio</Text>

      <Controller
        control={control}
        name="bio"
        render={({ field: { value, onChange } }) => (
          <TextArea
            value={value}
            onChange={onChange}
            error={errors.bio?.message}
          />
        )}
      />

      <CustomButton
        title={editBioPending ? "Saving..." : "Save"}
        onPress={handleSubmit(onSubmit)}
        buttonClassName="!w-full" // keep as-is since CustomButton handles it internally
        arrowCircleColor="transparent border-sm border-white"
        disabled={editBioPending}
      />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditBioScreen;
