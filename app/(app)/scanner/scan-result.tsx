import { useAppTheme } from "@/hooks/useAppTheme";
import {
  Calendar,
  CheckCircle,
  Shield,
  Ticket,
  User,
  XCircle,
} from "lucide-react-native";
import React from "react";
import ActivityIndicator from "@/components/ui/AppLoader";
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ScanResultModalProps {
  visible: boolean;
  result: any;
  onClose: () => void;
  onMarkAsUsed: () => void;
  isProcessing: boolean;
}

const ScanResultModal: React.FC<ScanResultModalProps> = ({
  visible,
  result,
  onClose,
  onMarkAsUsed,
  isProcessing,
}) => {
  const { tw, color } = useAppTheme();
  if (!result) return null;

  const getStatusColor = () => {
    if (!result.isValid) return color("#FF5757", "danger");
    if (result.isUsed) return color("#FF932E", "warning");
    return color("#0FF1CF", "accent");
  };

  const getStatusText = () => {
    if (!result.isValid) return "Invalid";
    if (result.isUsed) return "Already Used";
    return "Valid";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 bg-black/50 justify-end`}>
        <View style={tw`bg-surfaceMuted dark:bg-[#1B2A50] rounded-t-3xl max-h-3/4`}>
          {/* Header */}
          <View style={tw`p-5 border-b border-border dark:border-gray-800`}>
            <View style={tw`flex-row justify-between items-center mb-3`}>
              <Text style={tw`text-foreground dark:text-white text-xl font-bold`}>Scan Result</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={tw`text-muted dark:text-gray-400 text-lg`}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Status Badge */}
            <View style={tw`flex-row items-center`}>
              <View
                style={[
                  tw`w-3 h-3 rounded-full mr-2`,
                  { backgroundColor: getStatusColor() },
                ]}
              />
              <Text
                style={[tw`text-sm font-semibold`, { color: getStatusColor() }]}
              >
                {getStatusText()}
              </Text>
            </View>
          </View>

          {/* Content */}
          <View style={tw`p-5`}>
            {/* Event Info */}
            <View style={tw`mb-6`}>
              <View style={tw`flex-row items-center mb-2`}>
                <Calendar size={18} color={color("#5669FF", "primary")} />
                <Text style={tw`text-foreground dark:text-white text-lg font-semibold ml-2`}>
                  {result.eventName || "Unknown Event"}
                </Text>
              </View>
              {result.eventDate && (
                <Text style={tw`text-muted dark:text-gray-400 text-sm ml-7`}>
                  {formatDate(result.eventDate)}
                </Text>
              )}
            </View>

            {/* Attendee Info */}
            <View style={tw`mb-6`}>
              <View style={tw`flex-row items-center mb-2`}>
                <User size={18} color={color("#0FF1CF", "accent")} />
                <Text style={tw`text-foreground dark:text-white text-lg font-semibold ml-2`}>
                  {result.userName || "Unknown User"}
                </Text>
              </View>
              {result.userEmail && (
                <Text style={tw`text-muted dark:text-gray-400 text-sm ml-7`}>
                  {result.userEmail}
                </Text>
              )}
            </View>

            {/* Type Info */}
            <View style={tw`mb-6`}>
              <View style={tw`flex-row items-center mb-2`}>
                <Ticket size={18} color={color("#FF932E", "danger")} />
                <Text style={tw`text-foreground dark:text-white text-lg font-semibold ml-2`}>
                  {result.type === "ticket" ? "Ticket" : "Registration"}
                </Text>
              </View>
              <Text style={tw`text-muted dark:text-gray-400 text-sm ml-7`}>
                Transaction: {result.transactionId?.slice(0, 8)}...
              </Text>
            </View>

            {/* Permission Info */}
            <View style={tw`mb-6`}>
              <View style={tw`flex-row items-center mb-2`}>
                <Shield
                  size={18}
                  color={result.canMarkUsed ? color("#0FF1CF", "accent") : color("#FF5757", "danger")}
                />
                <Text style={tw`text-foreground dark:text-white text-lg font-semibold ml-2`}>
                  {result.canMarkUsed ? "Can Mark as Used" : "View Only"}
                </Text>
              </View>
              <Text style={tw`text-muted dark:text-gray-400 text-sm ml-7`}>
                {result.canMarkUsed
                  ? "You have permission to mark this as used"
                  : "You can only view details. Contact event organizer for permission."}
              </Text>
            </View>

            {/* Message */}
            {result.message && (
              <View style={tw`mb-6`}>
                <Text style={tw`text-muted dark:text-gray-400 text-sm`}>{result.message}</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={tw`p-5 border-t border-border dark:border-gray-800`}>
            {result.isValid && !result.isUsed && result.canMarkUsed ? (
              <TouchableOpacity
                style={tw`bg-accentFill dark:bg-[#0FF1CF] py-4 rounded-xl items-center`}
                onPress={onMarkAsUsed}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color={color("#01082E", "onAccent")} />
                ) : (
                  <>
                    <CheckCircle size={24} color={color("#01082E", "onAccent")} />
                    <Text style={tw`text-onAccent dark:text-[#01082E] font-bold text-lg mt-2`}>
                      Mark as Used
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : result.isValid && result.isUsed ? (
              <View style={tw`bg-danger dark:bg-[#FF932E] py-4 rounded-xl items-center`}>
                <Text style={tw`text-onPrimary dark:text-white font-bold text-lg`}>
                  Already Used
                </Text>
                <Text style={tw`text-foreground/80 dark:text-white/80 text-sm mt-1`}>
                  This was already marked as used
                </Text>
              </View>
            ) : !result.isValid ? (
              <View style={tw`bg-danger dark:bg-[#FF5757] py-4 rounded-xl items-center`}>
                <XCircle size={24} color={color("white", "onPrimary")} />
                <Text style={tw`text-onPrimary dark:text-white font-bold text-lg mt-2`}>
                  Invalid
                </Text>
                <Text style={tw`text-foreground/80 dark:text-white/80 text-sm mt-1`}>
                  {result.message}
                </Text>
              </View>
            ) : (
              <View style={tw`bg-primary dark:bg-[#5669FF] py-4 rounded-xl items-center`}>
                <Text style={tw`text-onPrimary dark:text-white font-bold text-lg`}>View Only</Text>
                <Text style={tw`text-foreground/80 dark:text-white/80 text-sm mt-1`}>
                  Contact event organizer for permission
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={tw`mt-3 py-3 rounded-xl items-center border border-border dark:border-gray-700`}
              onPress={onClose}
              disabled={isProcessing}
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
