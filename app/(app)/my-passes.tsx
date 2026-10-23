import type { ThemeColor } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import AppRefreshControl, {
  RefreshIndicator,
} from "@/components/ui/AppRefreshControl";
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import { EventImageWithProcessing } from "@/components/EventImageWithProcessing";
import { MascotMoment } from "@/components/gogo/mascot/MascotMoment";
import ImpactPageLoader from "@/components/ui/ImpactPageLoader";
import { layoutSpacing, spacing } from "@/constants/spacing";
import { useMyRegistrations, useMyTickets } from "@/services/queries";
import { OwnedRegistration, OwnedTicket } from "@/types/event";
import type { Registration } from "@/types/auth";
import { formatEventDateTime } from "@/utils/dateTimeHandler";
import { safeGoBack, useLockedRouter } from "@/utils/navigation";
import { numberWithCommas } from "@/utils/utils";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

type PassKind = "ticket" | "registration";

type UnifiedPass = {
  id: string;
  kind: PassKind;
  title: string;
  qrCode: string;
  isUsed: boolean;
  createdAt: string;
  transactionId: string;
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

const filters: Array<{
  id: PassKind;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeBackground: string;
  activeBorder: string;
  activeText: string;
}> = [
  {
    id: "ticket",
    label: "Tickets",
    icon: "ticket-outline",
    activeBackground: "#13255E",
    activeBorder: "#2B49A2",
    activeText: "#8FA5E2",
  },
  {
    id: "registration",
    label: "Registrations",
    icon: "clipboard-outline",
    activeBackground: "#201C4F",
    activeBorder: "#5A4DB8",
    activeText: "#C4B6FF",
  },
];

const mapTicketToPass = (ticket: OwnedTicket): UnifiedPass => ({
  id: ticket.id,
  kind: "ticket",
  title: ticket.eventTicket.type,
  qrCode: ticket.qrCode,
  isUsed: ticket.isUsed,
  createdAt: ticket.createdAt,
  transactionId: ticket.transactionId,
  eventId: ticket.eventTicket.event.id,
  eventTitle: ticket.eventTicket.event.title,
  eventStartDate: ticket.eventTicket.event.startDate,
  eventEndDate: ticket.eventTicket.event.endDate,
  location: ticket.eventTicket.event.location,
  thumbnailUrl: ticket.eventTicket.event.thumbnailUrl,
  registrationType: ticket.eventTicket.event.registrationType,
  isPhysicalEvent: ticket.eventTicket.event.isPhysicalEvent,
  ticketType: ticket.eventTicket.type,
  ticketPrice: Number(ticket.eventTicket.updatedPrice ?? ticket.eventTicket.price ?? 0),
});

const mapRegistrationToPass = (registration: OwnedRegistration): UnifiedPass => ({
  id: registration.id,
  kind: "registration",
  title: "Registration spot",
  qrCode: registration.qrCode,
  isUsed: registration.isUsed,
  createdAt: registration.createdAt,
  transactionId: registration.transactionId,
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
  Number.isFinite(new Date(pass.eventEndDate).getTime()) &&
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

const EmptyState = ({ activeKinds }: { activeKinds: PassKind[] }) => {
  const onlyKind = activeKinds.length === 1 ? activeKinds[0] : null;
  const title =
    onlyKind === "registration" ? "No registrations yet" : "No tickets yet";
  const message =
    onlyKind === "ticket"
      ? "Your tickets will appear here once you get a pass to an event."
      : onlyKind === "registration"
        ? "Register for an event and your confirmed spot will appear here."
        : "Find an event you care about. Your tickets and registrations will appear here.";

  return (
    <MascotMoment
      variant="empty"
      layout="stacked"
      title={title}
      message={message}
      typing={false}
      style={styles.emptyCard}
    />
  );
};

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
      <View style={styles.modalBackdrop}>
        <TouchableOpacity style={styles.modalDismissArea} activeOpacity={1} onPress={onClose} />
        <View style={[tw`rounded-[32px] border border-border dark:border-[#233676] bg-surface dark:bg-[#091336]`, styles.modalCard]}>
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
        </View>
      </View>
    </Modal>
  );
};

const MyPassesPage = () => {
  const { tw, color } = useAppTheme();
  const router = useLockedRouter();
  const [activeKinds, setActiveKinds] = useState<PassKind[]>([
    "ticket",
    "registration",
  ]);
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

  const toggleKind = (kind: PassKind) => {
    setActiveKinds((current) => {
      const isActive = current.includes(kind);

      if (isActive) {
        if (current.length === 1) {
          return ["ticket", "registration"];
        }

        return current.filter((item) => item !== kind);
      }

      const next = [...current, kind];
      return next.sort((left, right) =>
        left === right ? 0 : left === "ticket" ? -1 : 1
      );
    });
  };

  const filteredPasses = useMemo(() => {
    if (activeKinds.length === 2) {
      return combinedPasses;
    }

    return combinedPasses.filter((pass) => activeKinds.includes(pass.kind));
  }, [activeKinds, combinedPasses]);

  const readyPasses = useMemo(
    () => filteredPasses.filter((pass) => !pass.isUsed && !isEventEnded(pass)),
    [filteredPasses]
  );
  const archivePasses = useMemo(
    () => filteredPasses.filter((pass) => pass.isUsed || isEventEnded(pass)),
    [filteredPasses]
  );
  const nextPass = readyPasses[0] || combinedPasses.find((pass) => !isEventEnded(pass));

  const isLoading =
    ticketsPending ||
    registrationsPending ||
    ticketsFetching ||
    registrationsFetching;
  const hasError = ticketsError || registrationsError;
  const isRefreshing = ticketsRefetching || registrationsRefetching;

  const handleRefresh = async () => {
    await Promise.all([refetchTickets(), refetchRegistrations()]);
  };

  const handleOpenEvent = (pass: UnifiedPass) => {
    setSelectedPass(null);
    router.push(`/event/${pass.eventId}` as any);
  };

  if (isLoading && filteredPasses.length === 0) {
    return (
      <ImpactPageLoader
        title="Mapping your passes"
        message="Loading tickets, registrations, and QR access."
        style={styles.screen}
      />
    );
  }

  return (
    <View style={[tw`flex-1 bg-background dark:bg-[#01082E]`, styles.screen]}>
      <CustomeTopBarNav
        title="my passes"
        onClickBack={() => safeGoBack(router, "/settings")}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={tw`flex-1`}
        contentContainerStyle={[
          styles.scrollContent,
          combinedPasses.length === 0 && styles.emptyContent,
        ]}
        refreshControl={
          <AppRefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <RefreshIndicator refreshing={isRefreshing} />
        {combinedPasses.length > 0 ? (
          <>
            <View style={[tw`rounded-[32px] border border-border dark:border-[#203370] bg-surface dark:bg-[#0C1741]`, styles.heroCard]}>
              <Text style={tw`text-muted dark:text-[#7F93CC] text-[12px] uppercase tracking-[1.4px]`}>
                Your access
              </Text>
              <Text style={tw`text-foreground dark:text-white text-[30px] font-bold mt-3`}>
                Every ticket and registration, in one place.
              </Text>
              <Text style={tw`text-secondary dark:text-[#AFC0F4] mt-3 leading-6`}>
                Quick QR access, event details, and a clean split between what is ready now and what has already been used.
              </Text>

              <View style={tw`flex-row gap-3 mt-6`}>
                <View style={[tw`flex-1 rounded-2xl border border-border dark:border-[#23408A] bg-surface dark:bg-[#13255E]`, styles.summaryChip]}>
                  <Text style={tw`text-secondary dark:text-[#8FA5E2] text-[11px] uppercase tracking-[1px]`}>
                    Total
                  </Text>
                  <Text style={tw`text-foreground dark:text-white text-2xl font-bold mt-2`}>
                    {combinedPasses.length}
                  </Text>
                </View>
                <View style={[tw`flex-1 rounded-2xl border border-border dark:border-[#214B55] bg-surface dark:bg-[#0B2A34]`, styles.summaryChip]}>
                  <Text style={tw`text-info dark:text-[#8FE8E0] text-[11px] uppercase tracking-[1px]`}>
                    Tickets
                  </Text>
                  <Text style={tw`text-foreground dark:text-white text-2xl font-bold mt-2`}>
                    {tickets.length}
                  </Text>
                </View>
                <View style={[tw`flex-1 rounded-2xl border border-border dark:border-[#50427A] bg-surface dark:bg-[#201C4F]`, styles.summaryChip]}>
                  <Text style={tw`text-secondary dark:text-[#C4B6FF] text-[11px] uppercase tracking-[1px]`}>
                    Registrations
                  </Text>
                  <Text style={tw`text-foreground dark:text-white text-2xl font-bold mt-2`}>
                    {registrations.length}
                  </Text>
                </View>
              </View>

              {nextPass ? (
                <View style={[tw`mt-6 rounded-2xl border border-border dark:border-[#1D2E69] bg-surface dark:bg-[#0E1C49]`, styles.nextUpCard]}>
                  <Text style={tw`text-muted dark:text-[#7F93CC] text-[11px] uppercase tracking-[1px]`}>
                    Next up
                  </Text>
                  <Text style={tw`text-foreground dark:text-white text-lg font-semibold mt-2`} numberOfLines={2}>
                    {nextPass.eventTitle}
                  </Text>
                  <Text style={tw`text-secondary dark:text-[#AFC0F4] mt-1`}>
                    {formatEventDateTime(nextPass.eventStartDate, nextPass.eventEndDate)}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={[tw`flex-row gap-3`, styles.filtersWrap]}>
              {filters.map((filter) => {
                const isActive = activeKinds.includes(filter.id);
                const count = filter.id === "ticket" ? tickets.length : registrations.length;

                return (
                  <TouchableOpacity
                    key={filter.id}
                    onPress={() => toggleKind(filter.id)}
                    style={[
                      tw`flex-1 rounded-[22px] border px-4 py-4`,
                      isActive
                        ? {
                            backgroundColor: filter.activeBackground,
                            borderColor: filter.activeBorder,
                          }
                        : {
                            backgroundColor: color("#081233", "surface"),
                            borderColor: color("#1A2A62", "border"),
                          },
                    ]}
                  >
                    <View style={tw`flex-row items-center justify-center`}>
                      <Ionicons
                        name={filter.icon}
                        size={18}
                        color={isActive ? filter.activeText : color("#8FA5E2", "secondary")}
                      />
                      <Text
                        style={[
                          tw`ml-2 font-semibold`,
                          { color: isActive ? color("#FFFFFF", "foreground") : color("#D9E2FF", "foreground") },
                        ]}
                      >
                        {filter.label}
                      </Text>
                    </View>
                    <Text
                      style={[
                        tw`text-center text-xs mt-2`,
                        { color: isActive ? filter.activeText : color("#7F93CC", "muted") },
                      ]}
                    >
                      {count} owned
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : null}

        {filteredPasses.length === 0 ? (
          hasError ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Retry loading passes"
              onPress={handleRefresh}
              style={tw`p-5`}
            >
              <Text style={tw`text-center text-danger dark:text-[#FF8A8A]`}>
                Could not load your passes. Tap to retry.
              </Text>
            </TouchableOpacity>
          ) : (
            <EmptyState activeKinds={activeKinds} />
          )
        ) : (
          <>
            {readyPasses.length > 0 ? (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeader}>
                  <Text style={tw`text-foreground dark:text-white text-xl font-bold`}>Ready to use</Text>
                  <Text style={tw`text-secondary dark:text-[#8FA5E2]`}>{readyPasses.length}</Text>
                </View>
                {readyPasses.map((pass) => (
                  <PassCard
                    key={`${pass.kind}-${pass.id}`}
                    pass={pass}
                    onOpenQr={setSelectedPass}
                    onOpenEvent={handleOpenEvent}
                  />
                ))}
              </View>
            ) : null}

            {archivePasses.length > 0 ? (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeader}>
                  <Text style={tw`text-foreground dark:text-white text-xl font-bold`}>Archive</Text>
                  <Text style={tw`text-secondary dark:text-[#8FA5E2]`}>{archivePasses.length}</Text>
                </View>
                {archivePasses.map((pass) => (
                  <PassCard
                    key={`${pass.kind}-${pass.id}`}
                    pass={pass}
                    onOpenQr={setSelectedPass}
                    onOpenEvent={handleOpenEvent}
                  />
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <PassQrModal
        pass={selectedPass}
        visible={Boolean(selectedPass)}
        onClose={() => setSelectedPass(null)}
        onOpenEvent={handleOpenEvent}
      />
    </View>
  );
};

export default MyPassesPage;

const styles = StyleSheet.create({
  screen: {
    paddingTop: layoutSpacing.pageTop,
    paddingHorizontal: layoutSpacing.pageHorizontal,
  },
  scrollContent: {
    paddingTop: spacing.xl,
    paddingBottom: 110,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  heroCard: {
    padding: 22,
  },
  summaryChip: {
    padding: 14,
  },
  nextUpCard: {
    padding: 16,
  },
  filtersWrap: {
    marginTop: spacing.xl,
  },
  sectionWrap: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  passCard: {
    marginTop: spacing.sm,
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
    padding: 22,
  },
  qrWrap: {
    paddingVertical: 24,
  },
});
