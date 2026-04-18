import CustomButton from "@/components/buttons/CustomBtn1";
import React from "react";
import { Modal, Text, View } from "react-native";
import tw from "twrnc";

interface CancelCarpoolModalProps {
  visible: boolean;
  onClose: () => void;
  onCancelAndRequest: () => void;
  onKeepCarpool: () => void;
  existingCarpool: {
    eventTitle?: string;
    passengerCount: number;
    hasActivePassengers: boolean;
  };
  isLoading?: boolean;
}

const CancelCarpoolModal: React.FC<CancelCarpoolModalProps> = ({
  visible,
  onClose,
  onCancelAndRequest,
  onKeepCarpool,
  existingCarpool,
  isLoading = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 bg-black/70 justify-center items-center p-5`}>
        <View style={tw`bg-[#1A2755] rounded-xl p-5 max-w-md w-full`}>
          <Text style={tw`text-white text-lg font-bold mb-3`}>
            ⚠️ Existing Carpool Found
          </Text>

          <Text style={tw`text-white mb-4`}>
            You already have a carpool for "
            {existingCarpool.eventTitle || "this event"}" with{" "}
            {existingCarpool.passengerCount} passenger(s).
          </Text>

          {existingCarpool.hasActivePassengers ? (
            <View style={tw`mb-4 p-3 bg-red-900/30 rounded-lg`}>
              <Text style={tw`text-red-300 text-sm`}>
                Note: You have active passengers in your carpool. Cancelling
                will notify them.
              </Text>
            </View>
          ) : (
            <Text style={tw`text-gray-300 text-sm mb-4`}>
              This carpool has no accepted passengers yet.
            </Text>
          )}

          <View style={tw`flex-row gap-3 mt-4`}>
            <CustomButton
              onPress={onKeepCarpool}
              title="Keep My Carpool"
              buttonClassName={"bg-gray-700 flex-1 border-0 "}
              textClassName={`!text-white text-xs`}
              showArrow={false}
            />

            <CustomButton
              onPress={onCancelAndRequest}
              title={isLoading ? "Processing..." : "Cancel & Request"}
              buttonClassName={"bg-[#0FF1CF] flex-1 border-0 "}
              textClassName={`!text-black text-xs`}
              showArrow={false}
              disabled={isLoading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CancelCarpoolModal;
