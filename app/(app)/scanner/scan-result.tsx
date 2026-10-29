import { useAppTheme } from "@/hooks/useAppTheme";
import {
  Calendar,
  CheckCircle,
  Clock,
  Shield,
  Ticket,
  User,
  XCircle,
} from "lucide-react-native";
import React from "react";
import type { MealCollectionDetails, QuickScanResponse } from "@/types/scanner";
import ActivityIndicator from "@/components/ui/AppLoader";
import { formatEventDateTime } from "@/utils/dateTimeHandler";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface ScanResultModalProps {
  visible: boolean;
  result: QuickScanResponse["data"] | null;
  onClose: () => void;
  onMarkAsUsed: () => void;
  isProcessing: boolean;
}

const MEAL_STATUS_LABELS: Record<MealCollectionDetails["status"], string> = {
  upcoming: "Collection day not started",
  not_started: "Not yet open",
  paused: "Collection paused",
  closed: "Collection closed",
  ended: "Collection day ended",
  ready: "Ready for collection",
  collected: "Already collected",
};

const ScanResultModal: React.FC<ScanResultModalProps> = ({
  visible,
  result,
  onClose,
  onMarkAsUsed,
  isProcessing,
}) => {
  const { tw, color } = useAppTheme();
  if (!result) return null;

  const collection = result.mealCollection;
  const canConfirm = result.isValid && result.canMarkUsed;
  const statusText = collection
    ? MEAL_STATUS_LABELS[collection.status]
    : result.isValid
      ? "Valid"
      : "Invalid";
  const statusColor =
    collection && collection.status !== "ready" && collection.status !== "collected"
      ? color("#FFD76A", "warning")
      : collection?.status === "collected" || result.isValid
        ? color("#0FF1CF", "accent")
        : color("#FF5757", "danger");
  const StatusIcon = result.isValid
    ? Shield
    : collection?.status === "collected"
      ? CheckCircle
      : collection
        ? Clock
        : XCircle;
  const feedbackStyle = result.isValid
    ? tw`bg-infoSoft dark:bg-[#0A1E63]`
    : collection?.status === "collected"
      ? tw`bg-accentSoft dark:bg-[#193744]`
      : collection
        ? tw`bg-warningSoft dark:bg-[#2A2209]`
        : tw`bg-dangerSoft dark:bg-[#351238]`;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 bg-black/50 justify-end`}>
        <View
          style={tw`bg-surfaceMuted dark:bg-[#1B2A50] rounded-t-3xl max-h-3/4`}
        >
          <View style={tw`p-5 border-b border-border dark:border-gray-800`}>
            <View style={tw`flex-row justify-between items-center mb-3`}>
              <Text style={tw`text-foreground dark:text-white text-xl font-bold`}>
                Scan Result
              </Text>
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close scan result"
                style={tw`p-3`}
              >
                <Text style={tw`text-muted dark:text-gray-400 text-lg`}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={tw`flex-row items-center`}>
              <View
                style={[
                  tw`w-3 h-3 rounded-full mr-2`,
                  { backgroundColor: statusColor },
                ]}
              />
              <Text style={[tw`text-sm font-semibold`, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
          </View>

          <ScrollView style={tw`shrink`} contentContainerStyle={tw`p-5`}>
            <View style={tw`mb-6`}>
              <View style={tw`flex-row items-center mb-2`}>
                <Calendar size={18} color={color("#5669FF", "primary")} />
                <Text
                  style={tw`text-foreground dark:text-white text-lg font-semibold ml-2 flex-1`}
                >
                  {result.eventName || "Unknown Event"}
                </Text>
              </View>
              {collection ? (
                <View style={tw`ml-7`}>
                  <Text
                    style={tw`text-foreground dark:text-white font-medium mb-1`}
                  >
                    Suggested arrival window
                  </Text>
                  <Text style={tw`text-muted dark:text-gray-400 text-sm`}>
                    {formatEventDateTime(
                      collection.collectionStart,
                      collection.collectionEnd,
                      collection.timeZone,
                    )}
                  </Text>
                  {collection.status === "ready" && collection.arrival !== "on_time" ? (
                    <Text style={tw`mt-2 text-warning dark:text-[#FFD76A] text-sm`}>
                      {collection.arrival === "early" ? "Arrived early" : "Arrived after suggested window"}
                      {" · Collection is open"}
                    </Text>
                  ) : null}
                </View>
              ) : result.eventDate ? (
                <Text style={tw`text-muted dark:text-gray-400 text-sm ml-7`}>
                  {formatDate(result.eventDate)}
                </Text>
              ) : null}
            </View>

            <View style={tw`mb-6 flex-row items-center`}>
              <User size={18} color={color("#0FF1CF", "accent")} />
              <Text
                style={tw`text-foreground dark:text-white text-lg font-semibold ml-2 flex-1`}
              >
                {result.userName || "Unknown User"}
              </Text>
            </View>

            <View style={tw`flex-row items-center`}>
              <Ticket size={18} color={color("#FF932E", "danger")} />
              <Text
                style={tw`text-foreground dark:text-white text-lg font-semibold ml-2 flex-1`}
              >
                {result.type === "meal"
                  ? "Meal collection pass"
                  : result.type === "ticket"
                    ? "Ticket"
                    : "Registration"}
              </Text>
            </View>
          </ScrollView>

          <View style={tw`p-5 border-t border-border dark:border-gray-800`}>
            {canConfirm ? (
              <TouchableOpacity
                style={tw`bg-accentFill dark:bg-[#0FF1CF] py-4 rounded-xl items-center`}
                onPress={onMarkAsUsed}
                disabled={isProcessing}
                accessibilityRole="button"
                accessibilityState={{ disabled: isProcessing, busy: isProcessing }}
              >
                {isProcessing ? (
                  <ActivityIndicator color={color("#01082E", "onAccent")} />
                ) : (
                  <>
                    <CheckCircle
                      size={24}
                      color={color("#01082E", "onAccent")}
                    />
                    <Text
                      style={tw`text-onAccent dark:text-[#01082E] font-bold text-lg mt-2`}
                    >
                      {result.type === "meal"
                        ? "Confirm collection"
                        : "Mark as Used"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={[tw`p-4 rounded-xl items-center`, feedbackStyle]}>
                <StatusIcon
                  size={24}
                  color={result.isValid ? color("#31C6F6", "info") : statusColor}
                />
                <Text
                  style={tw`text-foreground dark:text-white font-bold text-lg mt-2`}
                >
                  {result.isValid ? "View only" : statusText}
                </Text>
                <Text
                  style={tw`text-secondary dark:text-[#CBD8FF] text-sm mt-1 text-center`}
                >
                  {result.isValid
                    ? "Ask the event organiser for scanning permission."
                    : result.message}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={tw`mt-3 py-3 rounded-xl items-center border border-border dark:border-gray-700`}
              onPress={onClose}
              disabled={isProcessing}
              accessibilityRole="button"
              accessibilityState={{ disabled: isProcessing }}
            >
              <Text style={tw`text-foreground dark:text-white font-medium`}>
                {isProcessing ? "Processing..." : "Scan Another"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ScanResultModal;
