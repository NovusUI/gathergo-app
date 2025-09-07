import CustomButton from "@/components/buttons/CustomBtn1";
import TextArea from "@/components/inputs/CustomTextArea";
import { useAuth } from "@/context/AuthContext";
import { BioFormValues, bioSchema } from "@/schemas/bio";
import { useEditBio } from "@/services/mutations";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";


const index = () => {

    const {setUser} = useAuth()
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
          showGlobalSuccess(data.message)
          setUser(prev=>({...prev,bio:data.data.bio }))
          router.replace("/profile")
        },
       onError(error) {
         showGlobalError(error.message)
       },
      });


      const onSubmit = async(data: BioFormValues) => {
        await editBio(data)
        console.log("Bio submitted:", data);
      };
  return (
    <View className="flex-1 flex flex-col  justify-center items-center bg-[#01082E] px-5 py-10 gap-5">
        <Text className="text-white">Bio</Text>
        <Controller
        control={control}
        name="bio"
        render={({ field: { value, onChange } }) => (
          <TextArea value={value} onChange={onChange} error={errors.bio?.message} />
        )}
      />

      <CustomButton 
      title={editBioPending ? "Saving..." : "Save"}
      onPress={handleSubmit(onSubmit)} 
      buttonClassName="!w-full" 
      arrowCircleColor="transparent border-sm border-white"
      disabled={editBioPending}
      />
    </View>
  )
}

export default index
