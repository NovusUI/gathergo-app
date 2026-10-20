import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomButton from "@/components/buttons/CustomBtn1";
import Input from "@/components/inputs/CustomInput1";
import VolunteerRoleSheet from "@/components/volunteer/VolunteerRoleSheet";
import VolunteerStats from "@/components/volunteer/VolunteerStats";
import { useAuth } from "@/context/AuthContext";
import { useSaveVolunteerRole, useVolunteerAction } from "@/services/mutations";
import {
  useEventDetails,
  useVolunteerRoles,
  useVolunteerRoster,
  useVolunteerSummary,
} from "@/services/queries";
import type { EventDetails } from "@/types/event";
import type {
  VolunteerRole,
  VolunteerRosterEntry,
  VolunteerStatus,
} from "@/types/volunteer";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { safeGoBack, useLockedRouter } from "@/utils/navigation";
import {
  VOLUNTEER_STATUS_LABELS,
  canRecruitVolunteers,
  volunteerAttendanceActions,
} from "@/utils/volunteer";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import tw, { style as twStyle } from "twrnc";

const filters: ("ALL" | VolunteerStatus)[] = [
  "ALL",
  "APPLIED",
  "ACCEPTED",
  "CHECKED_IN",
  "COMPLETED",
];

export default function ManageVolunteers() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useLockedRouter();
  const { user } = useAuth();
  const eventQuery = useEventDetails(id);
  const event = eventQuery.data?.data;
  const owner = event !== undefined && event.creatorId === user?.id;
  const roles = useVolunteerRoles(id, owner);
  const roster = useVolunteerRoster(id, owner);
  const summary = useVolunteerSummary(id, owner);
  const saveRole = useSaveVolunteerRole(id, {
    onSuccess: () => showGlobalSuccess("Volunteer role saved."),
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<VolunteerRole | null>(null);
  const [filter, setFilter] = useState<(typeof filters)[number]>("ALL");
  const visibleRoster = roster.isSuccess
    ? roster.data.data.filter(
        (entry) => filter === "ALL" || entry.status === filter
      )
    : [];
  const refresh = () =>
    Promise.all([
      eventQuery.refetch(),
      roles.refetch(),
      roster.refetch(),
      summary.refetch(),
    ]);

  return (
    <View style={tw`flex-1 bg-[#01082E] pt-10`}>
      <View style={tw`px-5`}>
        <CustomeTopBarNav
          title="Manage volunteers"
          onClickBack={() => safeGoBack(router, `/event/${id}`)}
        />
      </View>
      {eventQuery.isPending ? (
        <ActivityIndicator color="#0FF1CF" />
      ) : eventQuery.isError ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => eventQuery.refetch()}
          style={tw`p-5`}
        >
          <Text style={tw`text-[#FF8A8A]`}>
            Could not load this event. Tap to retry.
          </Text>
        </TouchableOpacity>
      ) : !owner ? (
        <Text style={tw`p-5 text-[#A8BAE4]`}>
          Only the event organiser can manage volunteers.
        </Text>
      ) : (
        <ScrollView
          contentContainerStyle={tw`gap-5 px-5 pb-16`}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              tintColor="#0FF1CF"
              refreshing={
                eventQuery.isRefetching ||
                roles.isRefetching ||
                roster.isRefetching ||
                summary.isRefetching
              }
              onRefresh={refresh}
            />
          }
        >
          <Text style={tw`text-2xl font-bold text-white`}>
            {eventQuery.data.data.title}
          </Text>

          {summary.isSuccess ? (
            <VolunteerStats summary={summary.data.data} />
          ) : summary.isError ? (
            <Text style={tw`text-[#FF8A8A]`}>
              Volunteer totals could not be loaded. Pull to retry.
            </Text>
          ) : (
            <ActivityIndicator color="#0FF1CF" />
          )}
          <View style={tw`gap-4`}>
            <Text style={tw`text-xl font-semibold text-white`}>Roles</Text>
            {roles.isPending ? (
              <ActivityIndicator color="#0FF1CF" />
            ) : roles.isError ? (
              <Text style={tw`text-[#FF8A8A]`}>
                Roles could not be loaded. Pull to retry.
              </Text>
            ) : (
              <>
                {roles.data.data.map((role) => (
                  <View
                    key={role.id}
                    style={tw`gap-3 rounded-2xl border border-[#24345A] p-4`}
                  >
                    <Text style={tw`text-lg font-semibold text-white`}>
                      {role.title}
                    </Text>
                    <Text style={tw`text-sm leading-5 text-[#A8BAE4]`}>
                      {role.description}
                    </Text>
                    <Text style={tw`text-sm text-[#0FF1CF]`}>
                      {role._count.applications}/{role.capacity} confirmed ·{" "}
                      {role.requiresApproval
                        ? "Approval required"
                        : "Automatic acceptance"}{" "}
                      · {role.isOpen ? "Open" : "Closed"}
                    </Text>
                    {Date.now() <
                    new Date(eventQuery.data.data.startDate).getTime() ? (
                      <View style={tw`flex-row flex-wrap gap-5`}>
                        <TouchableOpacity
                          accessibilityRole="button"
                          disabled={saveRole.isPending}
                          onPress={() => {
                            setEditingRole(role);
                            setFormOpen(true);
                          }}
                        >
                          <Text style={tw`font-semibold text-[#0FF1CF]`}>
                            Edit role
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          accessibilityRole="button"
                          disabled={saveRole.isPending}
                          onPress={() =>
                            saveRole.mutate({
                              type: "update",
                              roleId: role.id,
                              data: { isOpen: !role.isOpen },
                            })
                          }
                        >
                          <Text style={tw`font-semibold text-[#FFD166]`}>
                            {role.isOpen
                              ? "Close recruitment"
                              : "Reopen recruitment"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                ))}
                {roles.data.data.length === 0 ? (
                  <Text style={tw`text-sm text-[#A8BAE4]`}>
                    No volunteer roles yet.
                  </Text>
                ) : null}
              </>
            )}
            {canRecruitVolunteers(eventQuery.data.data) &&
            Date.now() < new Date(eventQuery.data.data.startDate).getTime() ? (
              <CustomButton
                showArrow={false}
                title="Add volunteer role"
                buttonClassName="w-full bg-[#0FF1CF]"
                onPress={() => {
                  setEditingRole(null);
                  setFormOpen(true);
                }}
              />
            ) : null}
            {!canRecruitVolunteers(eventQuery.data.data) ? (
              <Text style={tw`text-sm text-[#A8BAE4]`}>
                Volunteering requires a physical event with an impact story. Add
                an impact story on the event edit screen to enable recruitment.
              </Text>
            ) : null}
          </View>
          <Text style={tw`text-xl font-semibold text-white`}>
            Volunteer roster
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={tw`flex-row gap-2`}>
              {filters.map((item) => (
                <TouchableOpacity
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter === item }}
                  onPress={() => setFilter(item)}
                  style={twStyle(
                    "rounded-full border px-4 py-2",
                    filter === item
                      ? "border-[#0FF1CF] bg-[#0FF1CF]/15"
                      : "border-[#24345A]"
                  )}
                >
                  <Text style={tw`text-sm text-white`}>
                    {item === "ALL" ? "All" : VOLUNTEER_STATUS_LABELS[item]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {roster.isPending ? (
            <ActivityIndicator color="#0FF1CF" />
          ) : roster.isError ? (
            <Text style={tw`text-[#FF8A8A]`}>
              Applications could not be loaded. Pull to retry.
            </Text>
          ) : (
            <>
              {visibleRoster.map((entry) => (
                <VolunteerRosterCard
                  key={entry.id}
                  entry={entry}
                  event={eventQuery.data.data}
                />
              ))}
              {visibleRoster.length === 0 ? (
                <Text style={tw`text-sm text-[#A8BAE4]`}>
                  No volunteers in this view yet.
                </Text>
              ) : null}
            </>
          )}
        </ScrollView>
      )}
      {formOpen && owner ? (
        <VolunteerRoleSheet
          key={editingRole?.id ?? "new-role"}
          initialValue={editingRole ?? undefined}
          pending={saveRole.isPending}
          onClose={() => setFormOpen(false)}
          onSave={(value) =>
            saveRole
              .mutateAsync(
                editingRole
                  ? {
                      type: "update",
                      roleId: editingRole.id,
                      data: value,
                    }
                  : { type: "create", data: value }
              )
              .then(() => setFormOpen(false))
              .catch(() => undefined)
          }
        />
      ) : null}
    </View>
  );
}

function VolunteerRosterCard({
  entry,
  event,
}: {
  entry: VolunteerRosterEntry;
  event: EventDetails;
}) {
  const [minutes, setMinutes] = useState("");
  const mutation = useVolunteerAction(event.id, {
    onSuccess: ({ data }) =>
      showGlobalSuccess(VOLUNTEER_STATUS_LABELS[data.status]),
  });
  const actions = volunteerAttendanceActions(entry, event);
  return (
    <View style={tw`gap-3 rounded-2xl border border-[#24345A] p-4`}>
      <Text style={tw`text-lg font-semibold text-white`}>
        {entry.user.fullName || entry.user.username || "Volunteer"}
      </Text>
      <Text style={tw`text-sm text-[#A8BAE4]`}>{entry.role.title}</Text>
      <Text style={tw`font-semibold text-[#0FF1CF]`}>
        {VOLUNTEER_STATUS_LABELS[entry.status]}
      </Text>
      {entry.note ? (
        <Text style={tw`text-sm leading-5 text-[#C6D5F2]`}>{entry.note}</Text>
      ) : null}
      {entry.confirmedMinutes !== null ? (
        <Text style={tw`text-sm text-[#A8BAE4]`}>
          {entry.confirmedMinutes} minutes confirmed
        </Text>
      ) : null}
      {actions.canReview ? (
        <View style={tw`flex-row gap-5`}>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={mutation.isPending || !entry.role.isOpen}
            onPress={() =>
              mutation.mutate({
                type: "review",
                applicationId: entry.id,
                status: "ACCEPTED",
              })
            }
          >
            <Text
              style={twStyle(
                "font-semibold text-[#0FF1CF]",
                !entry.role.isOpen && "opacity-40"
              )}
            >
              Accept
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={mutation.isPending}
            onPress={() =>
              mutation.mutate({
                type: "review",
                applicationId: entry.id,
                status: "DECLINED",
              })
            }
          >
            <Text style={tw`font-semibold text-[#FF8A8A]`}>Decline</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {actions.canCheckIn ? (
        <CustomButton
          showArrow={false}
          title={mutation.isPending ? "Checking in…" : "Confirm attendance"}
          disabled={mutation.isPending}
          buttonClassName="w-full bg-[#0FF1CF]"
          onPress={() =>
            mutation.mutate({ type: "check-in", applicationId: entry.id })
          }
        />
      ) : null}
      {actions.canComplete ? (
        <>
          <Input
            accessibilityLabel="Actual minutes volunteered"
            placeholder="Actual minutes volunteered"
            numeric
            value={minutes}
            onChangeText={setMinutes}
          />
          <CustomButton
            showArrow={false}
            title={mutation.isPending ? "Confirming…" : "Confirm contribution"}
            disabled={mutation.isPending}
            buttonClassName="w-full bg-[#0FF1CF]"
            onPress={() => {
              const confirmedMinutes = Number(minutes);
              if (!Number.isInteger(confirmedMinutes) || confirmedMinutes < 1) {
                showGlobalError(
                  "Enter the actual contribution in whole minutes."
                );
                return;
              }
              mutation.mutate({
                type: "complete",
                applicationId: entry.id,
                confirmedMinutes,
              });
            }}
          />
        </>
      ) : null}
    </View>
  );
}
