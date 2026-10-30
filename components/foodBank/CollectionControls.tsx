import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useManageFoodBankCollection } from "@/hooks/useFoodBank";
import type {
  CollectionAvailability,
  FoodBankCollection,
  UpdateCollectionPayload,
} from "@/types/foodBank";
import CustomButton from "@/components/buttons/CustomBtn1";
import InfoDisclosure from "@/components/ui/InfoDisclosure";
import DatePicker from "@/components/inputs/DatePicker";
import { formatEventDateTime } from "@/utils/dateTimeHandler";
import { getApiErrorMessage } from "@/utils/apiError";
import {
  showGlobalError,
  showGlobalSuccess,
  showGlobalWarning,
} from "@/utils/globalErrorHandler";

const STATUS_LABELS: Record<CollectionAvailability, string> = {
  upcoming: "Collection day not started",
  not_started: "Collection has not opened yet",
  open: "Collection is open",
  paused: "Collection is paused",
  closed: "Collection is closed",
  ended: "Collection day has ended",
};

export default function CollectionControls({
  eventId,
  collection,
}: {
  eventId: string;
  collection: FoodBankCollection;
}) {
  const { tw } = useAppTheme();
  const { update, reschedule } = useManageFoodBankCollection(eventId);
  const [schedule, setSchedule] = useState<{
    startDate: Date;
    expectedUpdatedAt: string;
  } | null>(null);
  const [picker, setPicker] = useState<"date" | "time" | null>(null);
  const busy = update.isPending || reschedule.isPending;
  const changeStatus = async (status: UpdateCollectionPayload["status"]) => {
    if (busy) return;
    try {
      await update.mutateAsync({
        status,
        expectedUpdatedAt: collection.updatedAt,
      });
    } catch (error) {
      showGlobalError(
        getApiErrorMessage(
          error,
          "Could not update collection. Please try again.",
        ),
      );
    }
  };
  const saveSchedule = async () => {
    if (!schedule || busy) return;
    try {
      const result = await reschedule.mutateAsync({
        startDate: schedule.startDate.toISOString(),
        expectedUpdatedAt: schedule.expectedUpdatedAt,
      });
      setSchedule(null);
      if (result.data.notificationFailed) {
        showGlobalWarning(
          "Collection moved, but notifications could not be sent. Please inform your pass holders.",
        );
      } else {
        showGlobalSuccess(
          "Collection rescheduled. Existing passes have been kept.",
        );
      }
    } catch (error) {
      showGlobalError(
        getApiErrorMessage(
          error,
          "Could not reschedule collection. Please try again.",
        ),
      );
    }
  };

  return (
    <View style={tw`rounded-3xl bg-surface dark:bg-[#101C45] p-5 gap-4 w-full`}>
      <Text style={tw`text-foreground dark:text-white text-lg font-semibold`}>
        {STATUS_LABELS[collection.availability]}
      </Text>
      {collection.canManage ? (
        <>
          <InfoDisclosure
            label="Manage collection"
            message="Start when your team is ready, pause for delays, and close when finished. You can reopen on the collection day. Suggested arrival times never prevent staff from serving someone while collection is open."
          />
          <View style={tw`gap-3`}>
            {collection.status !== "OPEN" ? (
              <CustomButton
                title={
                  collection.status === "NOT_STARTED"
                    ? "Start collection"
                    : collection.status === "PAUSED"
                      ? "Resume collection"
                      : "Reopen collection"
                }
                disabled={busy || !collection.canOpen}
                onPress={() => void changeStatus("OPEN")}
                showArrow={false}
              />
            ) : (
              <CustomButton
                title="Pause collection"
                disabled={busy}
                onPress={() => void changeStatus("PAUSED")}
                showArrow={false}
              />
            )}
            {collection.status === "OPEN" || collection.status === "PAUSED" ? (
              <CustomButton
                title="Close collection"
                disabled={busy}
                onPress={() => void changeStatus("CLOSED")}
                showArrow={false}
              />
            ) : null}
          </View>
          {schedule ? (
            <View style={tw`gap-3`}>
              <InfoDisclosure
                label="New schedule"
                message="Unused passes move with the schedule and keep their QR codes. Collected passes stay collected. Pass holders will be notified. The planned collection duration stays the same."
              />
              <Text style={tw`text-muted dark:text-[#8FA1CB] text-sm`}>
                {collection.timeZone}
              </Text>
              <DatePicker
                value={schedule.startDate.toLocaleDateString("en-NG", {
                  timeZone: collection.timeZone,
                  dateStyle: "medium",
                })}
                onPress={() => setPicker("date")}
              />
              <DatePicker
                value={schedule.startDate.toLocaleTimeString("en-NG", {
                  timeZone: collection.timeZone,
                  hour: "numeric",
                  minute: "2-digit",
                })}
                onPress={() => setPicker("time")}
              />
              <Text style={tw`text-secondary dark:text-[#CBD8FF] text-sm`}>
                {formatEventDateTime(
                  schedule.startDate.toISOString(),
                  new Date(
                    schedule.startDate.getTime() +
                      new Date(collection.endDate).getTime() -
                      new Date(collection.startDate).getTime(),
                  ).toISOString(),
                  collection.timeZone,
                )}
              </Text>
              <CustomButton
                title={
                  reschedule.isPending
                    ? "Rescheduling…"
                    : "Reschedule and notify holders"
                }
                disabled={busy}
                onPress={() => void saveSchedule()}
                showArrow={false}
              />
              <TouchableOpacity
                accessibilityRole="button"
                disabled={busy}
                onPress={() => setSchedule(null)}
                style={tw`p-3 items-center`}
              >
                <Text style={tw`text-muted dark:text-[#8FA1CB]`}>
                  Cancel reschedule
                </Text>
              </TouchableOpacity>
              {picker ? (
                <DateTimePickerModal
                  isVisible
                  mode={picker}
                  date={schedule.startDate}
                  timeZoneName={collection.timeZone}
                  onConfirm={(date) => {
                    setPicker(null);
                    setSchedule({ ...schedule, startDate: date });
                  }}
                  onCancel={() => setPicker(null)}
                />
              ) : null}
            </View>
          ) : (
            <TouchableOpacity
              accessibilityRole="button"
              disabled={busy || collection.status === "OPEN"}
              onPress={() =>
                setSchedule({
                  startDate: new Date(collection.startDate),
                  expectedUpdatedAt: collection.updatedAt,
                })
              }
              style={tw`p-3 items-center ${collection.status === "OPEN" ? "opacity-40" : ""}`}
            >
              <Text style={tw`text-accent dark:text-[#0FF1CF]`}>
                Reschedule collection
              </Text>
            </TouchableOpacity>
          )}
        </>
      ) : null}
    </View>
  );
}
