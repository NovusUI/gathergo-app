import SheetCloseButton from "@/components/buttons/SheetCloseButton";
import AppToast from "@/components/ui/AppToast";
import VolunteerRoleForm from "@/components/volunteer/VolunteerRoleForm";
import type { ComponentProps } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import tw from "twrnc";

type Props = Omit<ComponentProps<typeof VolunteerRoleForm>, "onCancel"> & {
  onClose: () => void;
};

export default function VolunteerRoleSheet({
  initialValue,
  onSave,
  onClose,
  pending,
}: Props) {
  const close = () => {
    if (!pending) onClose();
  };
  return (
    <Modal visible animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView
        style={tw`flex-1 justify-end bg-black/55`}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          accessibilityViewIsModal
          style={tw`max-h-[88%] rounded-t-[32px] bg-[#041130] px-5 pb-8 pt-5`}
        >
          <View
            style={tw`mb-4 h-1.5 w-14 self-center rounded-full bg-[#2B3C66]`}
          />
          <View style={tw`flex-row items-start justify-between gap-4`}>
            <Text
              accessibilityRole="header"
              style={tw`flex-1 text-xl font-semibold text-white`}
            >
              {initialValue ? "Edit volunteer role" : "Add volunteer role"}
            </Text>
            <SheetCloseButton
              accessibilityLabel="Close volunteer role sheet"
              disabled={pending}
              onPress={close}
            />
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={tw`pt-4 pb-6`}
            keyboardShouldPersistTaps="handled"
          >
            <VolunteerRoleForm
              initialValue={initialValue}
              onSave={onSave}
              onCancel={close}
              pending={pending}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <AppToast />
    </Modal>
  );
}
