import WithdrawApplicationButton from "@/components/volunteer/WithdrawApplicationButton";
import SheetCloseButton from "@/components/buttons/SheetCloseButton";
import AppToast from "@/components/ui/AppToast";
import VolunteerButton from "@/components/volunteer/VolunteerButton";
import CustomButton from "@/components/buttons/CustomBtn1";
import Input from "@/components/inputs/CustomInput1";
import { useVolunteerAction } from "@/services/mutations";
import { useVolunteerRoles } from "@/services/queries";
import type { EventDetails } from "@/types/event";
import type {
  VolunteerApplication,
  VolunteerRoleListing,
} from "@/types/volunteer";
import {
  canApplyToRole,
  canRecruitVolunteers,
  VOLUNTEER_STATUS_LABELS,
} from "@/utils/volunteer";
import { showGlobalSuccess } from "@/utils/globalErrorHandler";
import { useLockedRouter } from "@/utils/navigation";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";

export default function VolunteerRolesSheet({
  event,
  owner,
  onClose,
}: {
  event: EventDetails;
  owner: boolean;
  onClose: () => void;
}) {
  const query = useVolunteerRoles(event.id);
  const router = useLockedRouter();
  const applications =
    query.isPending || query.isError
      ? []
      : query.data.data.flatMap((role) => role.applications);
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
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
          <View style={tw`flex-row items-center justify-between gap-4`}>
            <Text
              accessibilityRole="header"
              style={tw`flex-1 text-xl font-semibold text-white`}
            >
              Volunteer roles
            </Text>
            <SheetCloseButton
              accessibilityLabel="Close volunteer roles"
              onPress={onClose}
            />
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={tw`gap-4 pt-4 pb-6`}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={tw`text-sm leading-5 text-[#A8BAE4]`}>
              Volunteer in person. One role per event, with no ticket or
              attendee registration required.
            </Text>
            {owner ? (
              <VolunteerButton
                event={event}
                hasEventEnded={new Date(event.endDate).getTime() <= Date.now()}
                purpose="manage"
                variant="compact"
                onPress={() => {
                  onClose();
                  router.push({
                    pathname: "/volunteers/[id]",
                    params: { id: event.id },
                  });
                }}
              />
            ) : null}
            {query.isPending ? (
              <ActivityIndicator color="#0FF1CF" />
            ) : query.isError ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Retry volunteer roles"
                onPress={() => query.refetch()}
              >
                <Text style={tw`text-[#FF8A8A]`}>
                  Could not load volunteer roles. Tap to retry.
                </Text>
              </TouchableOpacity>
            ) : query.data.data.length === 0 ? (
              <Text style={tw`text-sm text-[#A8BAE4]`}>
                No volunteer roles have been published yet.
              </Text>
            ) : (
              query.data.data.map((role) => (
                <VolunteerOpportunity
                  key={role.id}
                  role={role}
                  event={event}
                  owner={owner}
                  applications={applications}
                />
              ))
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <AppToast />
    </Modal>
  );
}

function VolunteerOpportunity({
  role,
  event,
  owner,
  applications,
}: {
  role: VolunteerRoleListing;
  event: EventDetails;
  owner: boolean;
  applications: VolunteerApplication[];
}) {
  const [note, setNote] = useState("");
  const mutation = useVolunteerAction(event.id);
  const application = role.applications[0];
  const canApply =
    !owner &&
    canRecruitVolunteers(event) &&
    canApplyToRole(role, applications, event.startDate);
  return (
    <View style={tw`gap-3 rounded-2xl border border-[#24345A] p-4`}>
      <View style={tw`flex-row items-start justify-between gap-3`}>
        <Text style={tw`flex-1 text-lg font-semibold text-white`}>
          {role.title}
        </Text>
        <Text style={tw`text-xs text-[#0FF1CF]`}>
          {role._count.applications}/{role.capacity} confirmed
        </Text>
      </View>
      <Text style={tw`text-sm leading-5 text-[#C6D5F2]`}>
        {role.description}
      </Text>
      <Text style={tw`text-xs text-[#A8BAE4]`}>
        {role.requiresApproval
          ? "Organiser approval required"
          : "Join immediately while places are available"}
      </Text>
      {application ? (
        <Text style={tw`font-semibold text-[#0FF1CF]`}>
          {VOLUNTEER_STATUS_LABELS[application.status]}
        </Text>
      ) : null}
      {application && application.confirmedMinutes !== null ? (
        <Text style={tw`text-sm text-[#A8BAE4]`}>
          {application.confirmedMinutes} minutes confirmed by the organiser
        </Text>
      ) : null}
      {canApply ? (
        <>
          <Input
            accessibilityLabel={`Note for ${role.title}`}
            placeholder="Optional note to the organiser"
            value={note}
            editable={!mutation.isPending}
            maxLength={1000}
            onChangeText={setNote}
          />
          <CustomButton
            showArrow={false}
            disabled={mutation.isPending}
            buttonClassName="w-full bg-[#0FF1CF]"
            title={
              mutation.isPending
                ? "Sending…"
                : role.requiresApproval
                  ? "Apply to volunteer"
                  : "Join as volunteer"
            }
            onPress={() =>
              mutation.mutate(
                {
                  type: "apply",
                  roleId: role.id,
                  ...(note.trim() ? { note: note.trim() } : {}),
                },
                {
                  onSuccess: ({ data }) => {
                    setNote("");
                    showGlobalSuccess(
                      data.status === "APPLIED"
                        ? "Application sent. Your place is awaiting approval."
                        : "Your volunteer place is confirmed.",
                    );
                  },
                },
              )
            }
          />
        </>
      ) : !application ? (
        <Text style={tw`text-xs text-[#A8BAE4]`}>
          {new Date(event.startDate).getTime() <= Date.now()
            ? "Recruitment has closed"
            : !canRecruitVolunteers(event)
              ? "The organiser needs to add an impact story before recruiting volunteers"
              : !role.isOpen
                ? "Recruitment is closed for this role"
                : role._count.applications >= role.capacity
                  ? "This role is full"
                  : owner
                    ? "Organiser view"
                    : "You already have a role or pending application for this event"}
        </Text>
      ) : null}
      {application ? (
        <WithdrawApplicationButton
          application={application}
          startDate={event.startDate}
        />
      ) : null}
    </View>
  );
}
