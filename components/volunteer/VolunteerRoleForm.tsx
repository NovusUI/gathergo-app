import { useAppTheme } from "@/hooks/useAppTheme";
import CustomButton from "@/components/buttons/CustomBtn1";
import VolunteerRoleFields, { emptyVolunteerRole } from "./VolunteerRoleFields";
import { volunteerRoleSchema } from "@/schemas/volunteer";
import type { VolunteerRoleInput } from "@/types/volunteer";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Text, TouchableOpacity, View } from "react-native";

export default function VolunteerRoleForm({
  initialValue,
  onSave,
  onCancel,
  pending,
}: {
  initialValue?: VolunteerRoleInput;
  onSave: (value: VolunteerRoleInput) => void | Promise<void>;
  onCancel: () => void;
  pending: boolean;
}) {
  const { tw } = useAppTheme();
  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VolunteerRoleInput>({
    resolver: zodResolver(volunteerRoleSchema),
    defaultValues: initialValue ?? emptyVolunteerRole,
  });
  const change = (changes: Partial<VolunteerRoleInput>) => {
    if (changes.title !== undefined)
      setValue("title", changes.title, { shouldValidate: true });
    if (changes.description !== undefined)
      setValue("description", changes.description, { shouldValidate: true });
    if (changes.capacity !== undefined)
      setValue("capacity", changes.capacity, { shouldValidate: true });
    if (changes.requiresApproval !== undefined)
      setValue("requiresApproval", changes.requiresApproval, {
        shouldValidate: true,
      });
  };
  return (
    <View style={tw`gap-4`}>
      <VolunteerRoleFields
        value={watch()}
        disabled={pending || isSubmitting}
        onChange={change}
        errors={{
          title: errors.title?.message,
          description: errors.description?.message,
          capacity: errors.capacity?.message,
        }}
      />
      <CustomButton
        showArrow={false}
        title={pending || isSubmitting ? "Saving…" : "Save role"}
        disabled={pending || isSubmitting}
        onPress={handleSubmit(onSave)}
        buttonClassName="bg-accentFill dark:bg-[#0FF1CF] w-full"
      />
      <TouchableOpacity
        accessibilityRole="button"
        disabled={pending || isSubmitting}
        onPress={onCancel}
        style={tw`p-2`}
      >
        <Text style={tw`text-center text-secondary dark:text-[#A8BAE4]`}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}
