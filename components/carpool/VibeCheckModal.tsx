import { useAppTheme } from "@/hooks/useAppTheme";
import { Ionicons } from "@expo/vector-icons";
import { GatherGoMascot } from "@/components/gogo/mascot/GatherGoMascot";
import type {
  CarpoolVibeMascotStyle,
  CarpoolVibeSafetySignal,
} from "@/constants/carpool";
import {
  getCarpoolVibeHandshakeInstruction,
  getCarpoolVibeSafetyRoleCopy,
} from "@/constants/carpool";
import type {
  VibeCheckPassengerHandshake,
  VibeCheckRole,
} from "@/hooks/useVibeCheckHandshake";
import type { ComponentProps } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface VibeCheckModalProps {
  iconName: IoniconName;
  mascotStyle: CarpoolVibeMascotStyle;
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
  mascotStyle,
  rideLabel,
  roleLabel,
  safetySignal,
  visible,
  vibeCheck,
  onClose,
}: VibeCheckModalProps) {
  const { tw, color } = useAppTheme();
  const isPooler = vibeCheck?.role === "pooler";
  const safetyCopy = getCarpoolVibeSafetyRoleCopy(
    safetySignal,
    roleLabel,
    rideLabel
  );
  const handshakeInstruction = getCarpoolVibeHandshakeInstruction(
    vibeCheck?.role ?? "member"
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
          style={[
            tw`w-full max-w-[430px] max-h-[88%] rounded-[28px] border overflow-hidden`,
            {
              backgroundColor: mascotStyle.cardBackground,
              borderColor: mascotStyle.cardBorder,
            },
          ]}
        >
          <View style={tw`h-1 flex-row`}>
            <View
              style={[tw`flex-1`, { backgroundColor: mascotStyle.accent }]}
            />
            <View style={[tw`flex-1`, { backgroundColor: mascotStyle.body }]} />
            <View
              style={[tw`flex-1`, { backgroundColor: mascotStyle.badgeBg }]}
            />
          </View>

          <ScrollView contentContainerStyle={tw`p-5 gap-4`}>
            <View style={tw`flex-row items-start gap-3`}>
              <GatherGoMascot
                animated
                badgeContent={
                  <Ionicons
                    name={iconName}
                    size={15}
                    color={mascotStyle.iconColor}
                  />
                }
                palette={mascotStyle}
                size={66}
                style={{ flexShrink: 0 }}
                variant="idle"
              />
              <View style={tw`flex-1 min-w-0`}>
                <Text
                  style={[tw`text-xs`, { color: mascotStyle.accent }]}
                  numberOfLines={1}
                >
                  {rideLabel} vibe-check
                </Text>
                <Text style={tw`text-foreground dark:text-white text-xl font-semibold mt-1`}>
                  {safetySignal.title}
                </Text>
                <Text style={tw`text-secondary dark:text-[#A8BAE4] text-sm leading-5 mt-2`}>
                  {safetyCopy.modalInstruction}
                </Text>
              </View>
            </View>

            <View
              style={[
                tw`rounded-3xl border p-4 gap-2`,
                {
                  backgroundColor: mascotStyle.dialogBackground,
                  borderColor: mascotStyle.cardBorder,
                },
              ]}
            >
              <View style={tw`flex-row items-center gap-2`}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={17}
                  color={mascotStyle.accent}
                />
                <Text style={tw`text-foreground dark:text-white text-sm font-semibold`}>
                  {safetyCopy.primarySignalLabel}
                </Text>
              </View>
              <Text
                style={[
                  tw`text-sm font-semibold`,
                  { color: mascotStyle.badgeBg },
                ]}
              >
                {currentSignal}
              </Text>
            </View>

            {vibeCheck ? (
              <View style={tw`rounded-3xl bg-surface dark:bg-[#101C45] p-4 gap-3`}>
                <View style={tw`flex-row items-center justify-between gap-3`}>
                  <Text style={tw`text-foreground dark:text-white text-sm font-semibold`}>
                    {isPooler ? "Passenger handshakes" : "Handshake"}
                  </Text>
                  <Text
                    style={[
                      tw`text-xs font-semibold`,
                      vibeCheck.isComplete
                        ? tw`text-accent dark:text-[#0FF1CF]`
                        : tw`text-warning dark:text-[#F8D05C]`,
                    ]}
                  >
                    {isPooler
                      ? `${vibeCheck.completedCount}/${vibeCheck.passengerCount}`
                      : vibeCheck.isComplete
                        ? "Complete"
                        : "Waiting"}
                  </Text>
                </View>
                <Text style={tw`text-secondary dark:text-[#A8BAE4] text-xs leading-4`}>
                  {handshakeInstruction}
                </Text>

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
                      <Text style={tw`text-secondary dark:text-[#8FA5E2] text-sm leading-5`}>
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
                          ? tw`bg-warningFill dark:bg-[#F8D05C] border-warning dark:border-[#F8D05C]`
                          : tw`bg-warningFill/10 dark:bg-[#F8D05C]/10 border-warning/20 dark:border-[#F8D05C]/20`,
                      ]}
                    >
                      <Ionicons
                        name={
                          activePassenger.isComplete
                            ? "checkmark-circle"
                            : "shield-checkmark-outline"
                        }
                        size={18}
                        color={canConfirmOwnVibeCheck ? color("#01082E", "onAccent") : color("#F8D05C", "warning")}
                      />
                      <Text
                        style={[
                          tw`text-sm font-semibold`,
                          canConfirmOwnVibeCheck
                            ? tw`text-onAccent dark:text-[#01082E]`
                            : tw`text-warning dark:text-[#F8D05C]`,
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
              style={tw`h-12 rounded-2xl bg-surfaceMuted dark:bg-[#1B2A50] items-center justify-center`}
            >
              <Text style={tw`text-foreground dark:text-white text-sm font-semibold`}>Done</Text>
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
  const { tw, color } = useAppTheme();
  const canConfirm = role === "pooler" && !handshake.poolerConfirmed;
  const statusLabel = handshake.isComplete
    ? `${signalTitle} complete`
    : handshake.poolerConfirmed
      ? "Waiting for rider"
      : "Confirm pooler side";

  return (
    <View style={tw`rounded-2xl bg-surface dark:bg-[#07143B] border border-border dark:border-[#1B2A50] p-3 gap-3`}>
      <View style={tw`flex-row items-center justify-between gap-3`}>
        <View style={tw`flex-row items-center gap-2 flex-1 min-w-0`}>
          <View
            style={tw`h-8 w-8 rounded-full bg-accentFill/10 dark:bg-[#0FF1CF]/10 items-center justify-center`}
          >
            <Ionicons name="person-outline" size={15} color={color("#0FF1CF", "accent")} />
          </View>
          <Text style={tw`text-foreground dark:text-white text-sm font-semibold`} numberOfLines={1}>
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
              ? tw`bg-warningFill dark:bg-[#F8D05C] border-warning dark:border-[#F8D05C]`
              : tw`bg-warningFill/10 dark:bg-[#F8D05C]/10 border-warning/20 dark:border-[#F8D05C]/20`,
          ]}
        >
          <Text
            style={[
              tw`text-xs font-semibold`,
              canConfirm ? tw`text-onAccent dark:text-[#01082E]` : tw`text-warning dark:text-[#F8D05C]`,
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
}) => {
  const { tw, color } = useAppTheme();
  return ((
  <View style={tw`flex-1 rounded-2xl bg-surface dark:bg-[#101C45] p-3`}>
    <View style={tw`flex-row items-center gap-2`}>
      <Ionicons
        name={confirmed ? "checkmark-circle" : "ellipse-outline"}
        size={17}
        color={confirmed ? color("#0FF1CF", "accent") : color("#8FA5E2", "secondary")}
      />
      <Text style={tw`text-foreground dark:text-white text-xs font-semibold`}>{label}</Text>
    </View>
    <Text style={tw`text-secondary dark:text-[#8FA5E2] text-xs mt-1`}>
      {confirmed ? "Confirmed" : "Pending"}
    </Text>
  </View>
));
};
