import { useAppTheme } from "@/hooks/useAppTheme";
import CustomSwitcher from "@/components/CustomSwitcher";
import Input from "@/components/inputs/CustomInput1";
import TextArea from "@/components/inputs/CustomTextArea";
import type { VolunteerRoleInput } from "@/types/volunteer";
import { Text, View } from "react-native";

export const emptyVolunteerRole: VolunteerRoleInput = {
  title: "",
  description: "",
  capacity: 0,
  requiresApproval: true,
};

export default function VolunteerRoleFields({
  value,
  onChange,
  errors = {},
  disabled = false,
}: {
  value: VolunteerRoleInput;
  disabled?: boolean;
  onChange: (changes: Partial<VolunteerRoleInput>) => void;
  errors?: Partial<Record<keyof VolunteerRoleInput, string>>;
}) {
  const { tw } = useAppTheme();
  return (
    <View style={tw`gap-3`}>
      <Input
        editable={!disabled}
        accessibilityLabel="Volunteer role title"
        placeholder="Role title, e.g. tree planters"
        value={value.title}
        maxLength={100}
        onChangeText={(title) => onChange({ title })}
        error={errors.title}
      />
      <TextArea
        editable={!disabled}
        accessibilityLabel="Volunteer responsibilities"
        maxLength={1000}
        placeholder="What will volunteers do? Include responsibilities and any skills needed."
        value={value.description}
        onChange={(description) => onChange({ description })}
        error={errors.description}
      />
      <Input
        editable={!disabled}
        accessibilityLabel="Volunteer places"
        placeholder="Number of places"
        numeric
        value={value.capacity === 0 ? "" : String(value.capacity)}
        onChangeText={(text) => onChange({ capacity: Number(text) })}
        error={errors.capacity}
      />
      <View style={tw`flex-row items-center gap-3 rounded-xl bg-surface dark:bg-[#101C45] p-3`}>
        <View style={tw`flex-1`}>
          <Text style={tw`font-semibold text-foreground dark:text-white`}>Organiser approval</Text>
          <Text style={tw`mt-1 text-xs leading-5 text-secondary dark:text-[#A8BAE4]`}>
            {value.requiresApproval
              ? "Review applications before confirming a place."
              : "People join immediately while places are available."}
          </Text>
        </View>
        <CustomSwitcher
          disabled={disabled}
          accessibilityLabel="Require organiser approval"
          isEnabled={value.requiresApproval}
          setIsEnabled={(requiresApproval) => onChange({ requiresApproval })}
        />
      </View>
    </View>
  );
}
