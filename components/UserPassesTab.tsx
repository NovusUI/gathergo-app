import type { ThemeColor } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import AppRefreshControl, {
  RefreshIndicator,
} from "@/components/ui/AppRefreshControl";
import { EventImageWithProcessing } from "@/components/EventImageWithProcessing";
import { MascotMoment } from "@/components/gogo/mascot/MascotMoment";
import ImpactPageLoader from "@/components/ui/ImpactPageLoader";
import { layoutSpacing, spacing } from "@/constants/spacing";
import { useMyRegistrations, useMyTickets } from "@/services/queries";
import { OwnedRegistration, OwnedTicket } from "@/types/event";
import type { Registration } from "@/types/auth";
import { formatEventDateTime } from "@/utils/dateTimeHandler";
import { useLockedRouter } from "@/utils/navigation";
import { numberWithCommas } from "@/utils/utils";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  SectionList,
  type SectionListProps,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

type PassKind = "ticket" | "registration";

type UnifiedPass = {
  id: string;
  kind: PassKind;
  qrCode: string;
  isUsed: boolean;
  createdAt: string;
  eventId: string;
  eventTitle: string;
  eventStartDate: string;
  eventEndDate: string;
  location: string | null;
  thumbnailUrl?: string | null;
  registrationType: Registration;
  isPhysicalEvent: boolean;
  ticketType?: string;
  ticketPrice?: number;
};

const mapTicketToPass = (ticket: OwnedTicket): UnifiedPass => ({
  id: ticket.id,
  kind: "ticket",
  qrCode: ticket.qrCode,
  isUsed: ticket.isUsed,
  createdAt: ticket.createdAt,
  eventId: ticket.eventTicket.event.id,
  eventTitle: ticket.eventTicket.event.title,
  eventStartDate: ticket.eventTicket.event.startDate,
  eventEndDate: ticket.eventTicket.event.endDate,
  location: ticket.eventTicket.event.location,
  thumbnailUrl: ticket.eventTicket.event.thumbnailUrl,
  registrationType: ticket.eventTicket.event.registrationType,
  isPhysicalEvent: ticket.eventTicket.event.isPhysicalEvent,
  ticketType: ticket.eventTicket.type,
  ticketPrice: Number(ticket.eventTicket.updatedPrice ?? ticket.eventTicket.price),
});

const mapRegistrationToPass = (registration: OwnedRegistration): UnifiedPass => ({
  id: registration.id,
  kind: "registration",
  qrCode: registration.qrCode,
  isUsed: registration.isUsed,
  createdAt: registration.createdAt,
  eventId: registration.event.id,
  eventTitle: registration.event.title,
  eventStartDate: registration.event.startDate,
  eventEndDate: registration.event.endDate,
  location: registration.event.location,
  thumbnailUrl: registration.event.thumbnailUrl,
  registrationType: registration.event.registrationType,
  isPhysicalEvent: registration.event.isPhysicalEvent,
});

const formatIssuedDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const isEventEnded = (pass: UnifiedPass) =>
  new Date(pass.eventEndDate).getTime() < Date.now();

const sortPasses = (items: UnifiedPass[]) =>
  [...items].sort((left, right) => {
    const leftEnded = isEventEnded(left);
    const rightEnded = isEventEnded(right);

    if (leftEnded !== rightEnded) {
      return leftEnded ? 1 : -1;
    }

    if (!leftEnded) {
      return (
        new Date(left.eventStartDate).getTime() -
        new Date(right.eventStartDate).getTime()
      );
    }

    return (
      new Date(right.eventEndDate).getTime() -
      new Date(left.eventEndDate).getTime()
    );
  });

const getStatusMeta = (pass: UnifiedPass, color: ThemeColor) => {
  if (pass.isUsed) {
    return {
      label: pass.kind === "registration" ? "Checked in" : "Used",
      backgroundColor: "rgba(32, 201, 99, 0.16)",
      textColor: color("#7AF5A7", "info"),
    };
  }

  if (isEventEnded(pass)) {
    return {
      label: "Event ended",
      backgroundColor: "rgba(255, 193, 7, 0.16)",
      textColor: color("#FFD76A", "warning"),
    };
  }

  return {
    label: "Ready",
    backgroundColor: "rgba(15, 241, 207, 0.16)",
    textColor: color("#0FF1CF", "accent"),
  };
};

const getLocationCopy = (pass: UnifiedPass) =>
  pass.isPhysicalEvent ? pass.location || "Venue to be announced" : "Online event";

const EmptyState = () => (
  <MascotMoment
    variant="empty"
    layout="stacked"
    title="No passes yet"
    message="Your tickets and confirmed registrations will appear here."
    typing={false}
    style={styles.emptyCard}
  />
);

const PassCard = ({
  pass,
  onOpenQr,
  onOpenEvent,
}: {
  pass: UnifiedPass;
  onOpenQr: (pass: UnifiedPass) => void;
  onOpenEvent: (pass: UnifiedPass) => void;
}) => {
  const { tw, color } = useAppTheme();
  const status = getStatusMeta(pass, color);
  const subtitle =
    pass.kind === "ticket"
      ? pass.ticketType
      : pass.isUsed
        ? "Attendance recorded"
        : "Registration confirmed";

  return (
    <View style={[tw`overflow-hidden rounded-[28px] border border-border dark:border-[#21336E] bg-surface dark:bg-[#0B153B]`, styles.passCard]}>
      <View style={styles.mediaWrap}>
        <EventImageWithProcessing
          imageUrl={pass.thumbnailUrl}
          isProcessing={false}
          height={156}
          registrationType={pass.registrationType}
        />
        <View style={tw`absolute left-4 top-4 rounded-full bg-background/75 dark:bg-[#020B2E]/75 px-3 py-2`}>
          <Text style={tw`text-[11px] font-semibold uppercase tracking-[1px] text-foreground dark:text-white`}>
            {pass.kind === "ticket" ? "Ticket" : "Registration"}
          </Text>
        </View>
        <View
          style={[
            tw`absolute right-4 top-4 rounded-full px-3 py-2`,
            { backgroundColor: status.backgroundColor },
          ]}
        >
          <Text style={{ color: status.textColor, fontSize: 11, fontWeight: "700" }}>
            {status.label}
          </Text>
        </View>
      </View>

      <View style={styles.passBody}>
        <View style={tw`flex-row items-start justify-between gap-3`}>
          <View style={tw`flex-1`}>
            <Text style={tw`text-foreground dark:text-white text-lg font-bold`} numberOfLines={2}>
              {pass.eventTitle}
            </Text>
            <Text style={tw`text-secondary dark:text-[#AFC0F4] mt-1`} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>

          {pass.kind === "ticket" ? (
            <View style={tw`rounded-2xl border border-border dark:border-[#28408C] bg-surface dark:bg-[#12245E] px-3 py-2`}>
              <Text style={tw`text-secondary dark:text-[#8FA5E2] text-[10px] uppercase tracking-[1px]`}>
                Price
              </Text>
              <Text style={tw`text-foreground dark:text-white font-semibold mt-1`}>
                {pass.ticketPrice && pass.ticketPrice > 0
                  ? numberWithCommas(pass.ticketPrice, true, null)
                  : "Free"}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={tw`mt-4 gap-3`}>
          <View style={tw`flex-row items-center`}>
            <Ionicons name="calendar-outline" size={16} color={color("#0FF1CF", "accent")} />
            <Text style={tw`ml-3 flex-1 text-foreground dark:text-[#D9E2FF]`}>
              {formatEventDateTime(pass.eventStartDate, pass.eventEndDate)}
            </Text>
          </View>
          <View style={tw`flex-row items-center`}>
            <Ionicons name="location-outline" size={16} color={color("#8FA5E2", "secondary")} />
            <Text style={tw`ml-3 flex-1 text-secondary dark:text-[#AFC0F4]`} numberOfLines={1}>
              {getLocationCopy(pass)}
            </Text>
          </View>
        </View>

        <View style={[tw`mt-5 rounded-2xl border border-border dark:border-[#1D2E69] bg-surface dark:bg-[#0E1C49] px-4 py-3`, styles.metaStrip]}>
          <View>
            <Text style={tw`text-muted dark:text-[#7F93CC] text-[11px] uppercase tracking-[1px]`}>
              Issued
            </Text>
            <Text style={tw`text-foreground dark:text-white font-medium mt-1`}>
              {formatIssuedDate(pass.createdAt)}
            </Text>
          </View>
          <View style={tw`items-end`}>
            <Text style={tw`text-muted dark:text-[#7F93CC] text-[11px] uppercase tracking-[1px]`}>
              Pass ID
            </Text>
            <Text style={tw`text-foreground dark:text-white font-medium mt-1`} numberOfLines={1}>
              {pass.id.slice(0, 8).toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={tw`mt-5 flex-row gap-3`}>
          <TouchableOpacity
            onPress={() => onOpenQr(pass)}
            style={[tw`flex-1 rounded-2xl border border-accent/40 dark:border-[#0FF1CF]/40 bg-accentFill/10 dark:bg-[#0FF1CF]/10 px-4 py-3`, styles.actionButton]}
          >
            <View style={tw`flex-row items-center justify-center`}>
              <Ionicons name="qr-code-outline" size={18} color={color("#0FF1CF", "accent")} />
              <Text style={tw`ml-2 font-semibold text-accent dark:text-[#0FF1CF]`}>Show QR</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onOpenEvent(pass)}
            style={[tw`flex-1 rounded-2xl border border-border dark:border-[#28408C] bg-surface dark:bg-[#13255E] px-4 py-3`, styles.actionButton]}
          >
            <View style={tw`flex-row items-center justify-center`}>
              <Ionicons name="open-outline" size={18} color={color("#D9E2FF", "foreground")} />
              <Text style={tw`ml-2 font-semibold text-foreground dark:text-white`}>View event</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const PassQrModal = ({
  pass,
  visible,
  onClose,
  onOpenEvent,
}: {
  pass: UnifiedPass | null;
  visible: boolean;
  onClose: () => void;
  onOpenEvent: (pass: UnifiedPass) => void;
}) => {
  const { tw, color } = useAppTheme();
  if (!pass) {
    return null;
  }

  const status = getStatusMeta(pass, color);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView edges={["top", "bottom", "left", "right"]} style={styles.modalBackdrop}>
        <TouchableOpacity style={styles.modalDismissArea} activeOpacity={1} onPress={onClose} />
        <ScrollView style={[tw`rounded-[32px] border border-border dark:border-[#233676] bg-surface dark:bg-[#091336]`, styles.modalCard]} contentContainerStyle={{padding: 22}} showsVerticalScrollIndicator={false}>
          <View style={tw`flex-row items-start justify-between`}>
            <View style={tw`flex-1 pr-4`}>
              <Text style={tw`text-muted dark:text-[#7F93CC] text-[11px] uppercase tracking-[1px]`}>
                {pass.kind === "ticket" ? "Ticket pass" : "Registration pass"}
              </Text>
              <Text style={tw`text-foreground dark:text-white text-2xl font-bold mt-2`} numberOfLines={2}>
                {pass.eventTitle}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={tw`p-2`}>
              <Ionicons name="close" size={22} color={color("#D9E2FF", "foreground")} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              tw`self-start rounded-full px-3 py-2 mt-4`,
              { backgroundColor: status.backgroundColor },
            ]}
          >
            <Text style={{ color: status.textColor, fontSize: 11, fontWeight: "700" }}>
              {status.label}
            </Text>
          </View>

          <View style={[tw`items-center justify-center rounded-[28px] bg-surface dark:bg-white mt-6`, styles.qrWrap]}>
            <QRCode value={pass.qrCode} size={214} color={color("#07164F", "onAccent")} backgroundColor="white" />
          </View>

          <Text style={tw`text-center text-foreground dark:text-white font-semibold mt-5`}>
            {pass.kind === "ticket" ? pass.ticketType : "Confirmed registration"}
          </Text>
          <Text style={tw`text-center text-secondary dark:text-[#AFC0F4] mt-2`}>
            Show this code at check-in for quick access.
          </Text>

          <View style={tw`mt-6 rounded-2xl border border-border dark:border-[#1D2E69] bg-surface dark:bg-[#0E1C49] px-4 py-4`}>
            <View style={tw`flex-row items-center`}>
              <Ionicons name="calendar-outline" size={16} color={color("#0FF1CF", "accent")} />
              <Text style={tw`ml-3 flex-1 text-foreground dark:text-[#D9E2FF]`}>
                {formatEventDateTime(pass.eventStartDate, pass.eventEndDate)}
              </Text>
            </View>
            <View style={tw`flex-row items-center mt-3`}>
              <Ionicons name="location-outline" size={16} color={color("#8FA5E2", "secondary")} />
              <Text style={tw`ml-3 flex-1 text-secondary dark:text-[#AFC0F4]`} numberOfLines={1}>
                {getLocationCopy(pass)}
              </Text>
            </View>
          </View>

          <View style={tw`mt-6 flex-row gap-3`}>
            <TouchableOpacity
              onPress={() => onOpenEvent(pass)}
              style={[tw`flex-1 rounded-2xl border border-border dark:border-[#28408C] bg-surface dark:bg-[#13255E] px-4 py-4`, styles.actionButton]}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <Ionicons name="open-outline" size={18} color={color("#D9E2FF", "foreground")} />
                <Text style={tw`ml-2 font-semibold text-foreground dark:text-white`}>Open event</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={[tw`flex-1 rounded-2xl border border-accent/40 dark:border-[#0FF1CF]/40 bg-accentFill/10 dark:bg-[#0FF1CF]/10 px-4 py-4`, styles.actionButton]}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <Ionicons name="checkmark-circle-outline" size={18} color={color("#0FF1CF", "accent")} />
                <Text style={tw`ml-2 font-semibold text-accent dark:text-[#0FF1CF]`}>Done</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

type UserPassesTabProps = Pick<
  SectionListProps<UnifiedPass>,
  "ListHeaderComponent" | "renderSectionHeader"
>;

export default function UserPassesTab({ ListHeaderComponent, renderSectionHeader }: UserPassesTabProps = {}) {
  const { tw } = useAppTheme();
  const router = useLockedRouter();
  const [selectedPass, setSelectedPass] = useState<UnifiedPass | null>(null);

  const {
    data: ticketsResponse,
    isPending: ticketsPending,
    isFetching: ticketsFetching,
    isError: ticketsError,
    refetch: refetchTickets,
    isRefetching: ticketsRefetching,
  } = useMyTickets();
  const {
    data: registrationsResponse,
    isPending: registrationsPending,
    isFetching: registrationsFetching,
    isError: registrationsError,
    refetch: refetchRegistrations,
    isRefetching: registrationsRefetching,
  } = useMyRegistrations();

  const tickets = useMemo(() => ticketsResponse?.data ?? [], [ticketsResponse]);
  const registrations = useMemo(
    () => registrationsResponse?.data ?? [],
    [registrationsResponse]
  );

  const combinedPasses = useMemo(
    () =>
      sortPasses([
        ...tickets.map(mapTicketToPass),
        ...registrations.map(mapRegistrationToPass),
      ]),
    [registrations, tickets]
  );

  const isLoading = ticketsPending || registrationsPending || ticketsFetching || registrationsFetching;
  const hasError = ticketsError || registrationsError;
  const isRefreshing = ticketsRefetching || registrationsRefetching;
  const handleRefresh = async () => {
    await Promise.all([refetchTickets(), refetchRegistrations()]);
  };
  const handleOpenEvent = (pass: UnifiedPass) => {
    setSelectedPass(null);
    router.push(`/event/${pass.eventId}`);
  };
  const retry = (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Retry loading passes"
      onPress={handleRefresh}
      style={tw`min-h-11 p-5`}
    >
      <Text style={tw`text-center text-danger dark:text-[#FF8A8A]`}>Could not load your passes. Tap to retry.</Text>
    </TouchableOpacity>
  );
  return (
    <>
      <SectionList<UnifiedPass>
        sections={[{data: combinedPasses}]}
        keyExtractor={pass => `${pass.kind}-${pass.id}`}
        ListHeaderComponent={
          <>
            <RefreshIndicator refreshing={isRefreshing} />
            {typeof ListHeaderComponent === "function" ? <ListHeaderComponent /> : ListHeaderComponent}
          </>
        }
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={Boolean(renderSectionHeader)}
        renderItem={({item}) => <PassCard pass={item} onOpenQr={setSelectedPass} onOpenEvent={handleOpenEvent} />}
        ListFooterComponent={combinedPasses.length === 0 ? (
          isLoading ? (
            <ImpactPageLoader compact title="Mapping your passes" message="Loading tickets, registrations, and QR access." />
          ) : hasError ? retry : <EmptyState />
        ) : hasError ? retry : null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: layoutSpacing.listBottomInset}}
        refreshControl={<AppRefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      />
      <PassQrModal pass={selectedPass} visible={Boolean(selectedPass)} onClose={() => setSelectedPass(null)} onOpenEvent={handleOpenEvent} />
    </>
  );
}

const styles = StyleSheet.create({
  passCard: {
    marginTop: spacing.sm,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
  mediaWrap: {
    position: "relative",
  },
  passBody: {
    padding: 18,
  },
  metaStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionButton: {
    minHeight: 54,
    justifyContent: "center",
  },
  emptyCard: {
    marginTop: spacing.xxl,
    padding: 24,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 6, 27, 0.84)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "90%",
    alignSelf: "center",
  },
  qrWrap: {
    paddingVertical: 24,
  },
});
