import { Ionicons } from "@expo/vector-icons";
import type { CarpoolVibeSafetySignal } from "@/constants/carpool";
import { getCarpoolVibeSafetyRoleCopy } from "@/constants/carpool";
import type {
  VibeCheckPassengerHandshake,
  VibeCheckRole,
} from "@/hooks/useVibeCheckHandshake";
import type { ComponentProps } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface VibeCheckModalProps {
  iconName: IoniconName;
  rideLabel: string;
  roleLabel: string;
  safetySignal: CarpoolVibeSafetySignal;
  visible: boolean;
  vibeCheck?: {
    completedCount: number;
    currentUserConfirmed: boolean;
    isComplete: boolean;
    onConfirm: (passengerId?: string, passengerLabel?: string | null) => void;
    passengerCount: number;
    passengerHandshakes: VibeCheckPassengerHandshake[];
    poolerConfirmed: boolean;
    riderConfirmed: boolean;
    role: VibeCheckRole;
    waitingForLabel: string;
  };
  onClose: () => void;
}

export default function VibeCheckModal({
  iconName,
  rideLabel,
  roleLabel,
  safetySignal,
  visible,
  vibeCheck,
  onClose,
}: VibeCheckModalProps) {
  const isPooler = vibeCheck?.role === "pooler";
  const safetyCopy = getCarpoolVibeSafetyRoleCopy(
    safetySignal,
    roleLabel,
    rideLabel
  );
  const currentSignal = safetyCopy.primarySignalValue;
  const activePassenger =
    vibeCheck?.role === "rider"
      ? vibeCheck.passengerHandshakes.find((handshake) => handshake.label === "You") ||
        vibeCheck.passengerHandshakes[0]
      : null;
  const canConfirmOwnVibeCheck =
    Boolean(vibeCheck) &&
    vibeCheck?.role === "rider" &&
    Boolean(activePassenger) &&
    !activePassenger?.riderConfirmed &&
    !activePassenger?.isComplete;
  const confirmButtonLabel = activePassenger?.isComplete
    ? `${safetySignal.title} complete`
    : activePassenger?.riderConfirmed
      ? "Waiting for Pooler"
      : `Confirm: ${currentSignal}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 bg-black/75 justify-center items-center px-5`}>
        <View
          style={tw`w-full max-w-[430px] max-h-[88%] rounded-[28px] bg-[#07143B] border border-[#1B2A50] overflow-hidden`}
        >
          <View style={tw`h-1 flex-row`}>
            <View style={tw`flex-1 bg-[#0FF1CF]`} />
            <View style={tw`flex-1 bg-[#31C6F6]`} />
            <View style={tw`flex-1 bg-[#F8D05C]`} />
          </View>

          <ScrollView contentContainerStyle={tw`p-5 gap-4`}>
            <View style={tw`flex-row items-start gap-3`}>
              <View
                style={tw`w-14 h-14 rounded-3xl bg-[#0FF1CF]/12 border border-[#0FF1CF]/25 items-center justify-center`}
              >
                <Ionicons name={iconName} size={30} color="#0FF1CF" />
              </View>
              <View style={tw`flex-1 min-w-0`}>
                <Text style={tw`text-[#0FF1CF] text-xs`} numberOfLines={1}>
                  {rideLabel} vibe-check
                </Text>
                <Text style={tw`text-white text-xl font-semibold mt-1`}>
                  {safetySignal.title}
                </Text>
                <Text style={tw`text-[#A8BAE4] text-sm leading-5 mt-2`}>
                  {safetyCopy.modalInstruction}
                </Text>
              </View>
            </View>

            <View style={tw`rounded-3xl bg-[#0FF1CF]/10 p-4 gap-2`}>
              <View style={tw`flex-row items-center gap-2`}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={17}
                  color="#0FF1CF"
                />
                <Text style={tw`text-white text-sm font-semibold`}>
                  {safetyCopy.primarySignalLabel}
                </Text>
              </View>
              <Text style={tw`text-[#DDE6FF] text-sm font-semibold`}>
                {currentSignal}
              </Text>
            </View>

            {vibeCheck ? (
              <View style={tw`rounded-3xl bg-[#101C45] p-4 gap-3`}>
                <View style={tw`flex-row items-center justify-between gap-3`}>
                  <Text style={tw`text-white text-sm font-semibold`}>
                    {isPooler ? "Passenger handshakes" : "Handshake"}
                  </Text>
                  <Text
                    style={[
                      tw`text-xs font-semibold`,
                      vibeCheck.isComplete
                        ? tw`text-[#0FF1CF]`
                        : tw`text-[#F8D05C]`,
                    ]}
                  >
                    {isPooler
                      ? `${vibeCheck.completedCount}/${vibeCheck.passengerCount}`
                      : vibeCheck.isComplete
                        ? "Complete"
                        : "Waiting"}
                  </Text>
                </View>

                {isPooler ? (
                  <View style={tw`gap-3`}>
                    {vibeCheck.passengerHandshakes.length > 0 ? (
                      vibeCheck.passengerHandshakes.map((handshake) => (
                        <PassengerHandshakeRow
                          key={handshake.passengerId}
                          handshake={handshake}
                          role={vibeCheck.role}
                          signalTitle={safetySignal.title}
                          onConfirm={vibeCheck.onConfirm}
                        />
                      ))
                    ) : (
                      <Text style={tw`text-[#8FA5E2] text-sm leading-5`}>
                        No accepted riders yet. Each rider will get their own
                        vibe-check once they join.
                      </Text>
                    )}
                  </View>
                ) : activePassenger ? (
                  <>
                    <View style={tw`flex-row gap-2`}>
                      <HandshakeSide
                        confirmed={activePassenger.riderConfirmed}
                        label="Rider"
                      />
                      <HandshakeSide
                        confirmed={activePassenger.poolerConfirmed}
                        label="Pooler"
                      />
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.86}
                      accessibilityRole="button"
                      disabled={!canConfirmOwnVibeCheck}
                      onPress={() =>
                        vibeCheck.onConfirm(
                          activePassenger.passengerId,
                          activePassenger.label
                        )
                      }
                      style={[
                        tw`h-12 rounded-2xl flex-row items-center justify-center gap-2 border`,
                        canConfirmOwnVibeCheck
                          ? tw`bg-[#F8D05C] border-[#F8D05C]`
                          : tw`bg-[#F8D05C]/10 border-[#F8D05C]/20`,
                      ]}
                    >
                      <Ionicons
                        name={
                          activePassenger.isComplete
                            ? "checkmark-circle"
                            : "shield-checkmark-outline"
                        }
                        size={18}
                        color={canConfirmOwnVibeCheck ? "#01082E" : "#F8D05C"}
                      />
                      <Text
                        style={[
                          tw`text-sm font-semibold`,
                          canConfirmOwnVibeCheck
                            ? tw`text-[#01082E]`
                            : tw`text-[#F8D05C]`,
                        ]}
                      >
                        {confirmButtonLabel}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.86}
              accessibilityRole="button"
              onPress={onClose}
              style={tw`h-12 rounded-2xl bg-[#1B2A50] items-center justify-center`}
            >
              <Text style={tw`text-white text-sm font-semibold`}>Done</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const PassengerHandshakeRow = ({
  handshake,
  role,
  signalTitle,
  onConfirm,
}: {
  handshake: VibeCheckPassengerHandshake;
  role: VibeCheckRole;
  signalTitle: string;
  onConfirm: (passengerId?: string, passengerLabel?: string | null) => void;
}) => {
  const canConfirm = role === "pooler" && !handshake.poolerConfirmed;
  const statusLabel = handshake.isComplete
    ? `${signalTitle} complete`
    : handshake.poolerConfirmed
      ? "Waiting for rider"
      : "Confirm pooler side";

  return (
    <View style={tw`rounded-2xl bg-[#07143B] border border-[#1B2A50] p-3 gap-3`}>
      <View style={tw`flex-row items-center justify-between gap-3`}>
        <View style={tw`flex-row items-center gap-2 flex-1 min-w-0`}>
          <View
            style={tw`h-8 w-8 rounded-full bg-[#0FF1CF]/10 items-center justify-center`}
          >
            <Ionicons name="person-outline" size={15} color="#0FF1CF" />
          </View>
          <Text style={tw`text-white text-sm font-semibold`} numberOfLines={1}>
            {handshake.label}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.86}
          accessibilityRole="button"
          disabled={!canConfirm}
          onPress={() => onConfirm(handshake.passengerId, handshake.label)}
          style={[
            tw`px-3 py-2 rounded-2xl border`,
            canConfirm
              ? tw`bg-[#F8D05C] border-[#F8D05C]`
              : tw`bg-[#F8D05C]/10 border-[#F8D05C]/20`,
          ]}
        >
          <Text
            style={[
              tw`text-xs font-semibold`,
              canConfirm ? tw`text-[#01082E]` : tw`text-[#F8D05C]`,
            ]}
          >
            {statusLabel}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={tw`flex-row gap-2`}>
        <HandshakeSide confirmed={handshake.riderConfirmed} label="Rider" />
        <HandshakeSide confirmed={handshake.poolerConfirmed} label="Pooler" />
      </View>
    </View>
  );
};

const HandshakeSide = ({
  confirmed,
  label,
}: {
  confirmed: boolean;
  label: string;
}) => (
  <View style={tw`flex-1 rounded-2xl bg-[#101C45] p-3`}>
    <View style={tw`flex-row items-center gap-2`}>
      <Ionicons
        name={confirmed ? "checkmark-circle" : "ellipse-outline"}
        size={17}
        color={confirmed ? "#0FF1CF" : "#8FA5E2"}
      />
      <Text style={tw`text-white text-xs font-semibold`}>{label}</Text>
    </View>
    <Text style={tw`text-[#8FA5E2] text-xs mt-1`}>
      {confirmed ? "Confirmed" : "Pending"}
    </Text>
  </View>
);
