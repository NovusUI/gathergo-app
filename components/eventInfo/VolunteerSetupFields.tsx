import { useAppTheme } from "@/hooks/useAppTheme";
import {
  useFieldArray,
  useFormState,
  useWatch,
  type UseFormReturn,
} from "react-hook-form";
import { useState } from "react";
import type { EventFormData } from "@/schemas/event";
import {
  canRecruitVolunteers,
  VOLUNTEER_IMPACT_STORY_REQUIRED,
} from "@/utils/volunteer";
import { showGlobalWarning } from "@/utils/globalErrorHandler";
import VolunteerRoleSheet from "@/components/volunteer/VolunteerRoleSheet";
import { Text, TouchableOpacity, View } from "react-native";

type Props = Pick<UseFormReturn<EventFormData>, "control" | "setValue"> & {
  editMode?: boolean;
  onManage?: () => void;
};

export default function VolunteerSetupFields({
  control,
  editMode = false,
  onManage,
}: Props) {
  const { tw } = useAppTheme();
  const twStyle = tw.style;
  const [
    registrationType,
    isPhysicalEvent,
    impactTitle,
    impactDescription,
  ] = useWatch({
    control,
    name: [
      "registrationType",
      "isPhysicalEvent",
      "impactTitle",
      "impactDescription",
    ],
  });
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "volunteerRoles",
  });
  const eligible = canRecruitVolunteers({
    registrationType,
    isPhysicalEvent,
    impactTitle,
    impactDescription,
  });
  const [editor, setEditor] = useState<number | "new" | null>(null);
  const { errors } = useFormState({ control, name: "volunteerRoles" });
  if (registrationType !== "volunteer") return null;

  if (!eligible) {
    return (
      <View style={tw`gap-3 px-5 py-5`}>
        <Text style={tw`text-lg font-semibold text-foreground dark:text-white`}>Volunteering</Text>
        <Text style={tw`text-sm leading-5 text-secondary dark:text-[#A8BAE4]`}>
          Add an impact story to enable volunteering.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() =>
            showGlobalWarning(
              isPhysicalEvent
                ? VOLUNTEER_IMPACT_STORY_REQUIRED
                : "Choose a physical venue to use volunteering.",
            )
          }
          style={tw`rounded-xl border border-border dark:border-[#24345A] p-4`}
        >
          <Text style={tw`text-center font-semibold text-accent dark:text-[#0FF1CF]`}>
            Add volunteers
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={tw`gap-4 px-5 py-5`}>
      <Text style={tw`text-lg font-semibold text-foreground dark:text-white`}>Volunteering</Text>
      {editMode ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onManage}
          style={tw`rounded-xl border border-accent/30 dark:border-[#0FF1CF]/30 p-4`}
        >
          <Text style={tw`font-semibold text-accent dark:text-[#0FF1CF]`}>
            Manage volunteer roles and applications
          </Text>
          <Text style={tw`mt-1 text-sm text-secondary dark:text-[#A8BAE4]`}>
            {fields.length} roles · changes are saved in volunteer management
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          {fields.map((field, index) => (
            <View
              key={field.id}
              style={tw`gap-3 rounded-2xl border border-border dark:border-[#24345A] p-4`}
            >
              <Text style={tw`font-semibold text-foreground dark:text-white`}>
                {field.title}
              </Text>
              <Text
                numberOfLines={2}
                style={tw`text-sm leading-5 text-secondary dark:text-[#A8BAE4]`}
              >
                {field.description}
              </Text>
              <Text style={tw`text-sm text-accent dark:text-[#0FF1CF]`}>
                {field.capacity} places ·{" "}
                {field.requiresApproval
                  ? "Approval required"
                  : "Automatic acceptance"}
              </Text>
              {errors.volunteerRoles?.[index] ? (
                <Text style={tw`text-sm text-danger dark:text-red-400`}>
                  Edit this role to complete the required fields.
                </Text>
              ) : null}
              <View style={tw`flex-row gap-5`}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Edit volunteer role ${index + 1}`}
                  onPress={() => setEditor(index)}
                >
                  <Text style={tw`text-sm font-semibold text-accent dark:text-[#0FF1CF]`}>
                    Edit role
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Remove volunteer role ${index + 1}`}
                  onPress={() => remove(index)}
                >
                  <Text style={tw`text-sm text-danger dark:text-[#FF8A8A]`}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity
            accessibilityRole="button"
            disabled={fields.length >= 20}
            accessibilityState={{ disabled: fields.length >= 20 }}
            onPress={() => setEditor("new")}
            style={twStyle(
              "rounded-xl border border-accent/40 dark:border-[#0FF1CF]/40 p-4",
              fields.length >= 20 && "opacity-40",
            )}
          >
            <Text style={tw`text-center font-semibold text-accent dark:text-[#0FF1CF]`}>
              + Add volunteer role
            </Text>
          </TouchableOpacity>
          {editor !== null ? (
            <VolunteerRoleSheet
              key={editor}
              initialValue={editor === "new" ? undefined : fields[editor]}
              pending={false}
              onClose={() => setEditor(null)}
              onSave={(value) => {
                if (editor === "new") append(value);
                else update(editor, value);
                setEditor(null);
              }}
            />
          ) : null}
        </>
      )}
    </View>
  );
}
