import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import { EventImageWithProcessing } from "@/components/EventImageWithProcessing";
import CustomButton from "@/components/buttons/CustomBtn1";
import { layoutSpacing, spacing } from "@/constants/spacing";
import { useMyRegistrations, useMyTickets } from "@/services/queries";
import { OwnedRegistration, OwnedTicket } from "@/types/event";
import { formatEventDateTime } from "@/utils/dateTimeHandler";
import { safeGoBack, useLockedRouter } from "@/utils/navigation";
import { numberWithCommas } from "@/utils/utils";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import tw from "twrnc";

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
  registrationType: "ticket" | "registration" | "donation";
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

const getStatusMeta = (pass: UnifiedPass) => {
  if (pass.isUsed) {
    return {
      label: pass.kind === "registration" ? "Checked in" : "Used",
      backgroundColor: "rgba(32, 201, 99, 0.16)",
      textColor: "#7AF5A7",
    };
  }

  if (isEventEnded(pass)) {
    return {
      label: "Event ended",
      backgroundColor: "rgba(255, 193, 7, 0.16)",
      textColor: "#FFD76A",
    };
  }

  return {
    label: "Ready",
    backgroundColor: "rgba(15, 241, 207, 0.16)",
    textColor: "#0FF1CF",
  };
};

const getLocationCopy = (pass: UnifiedPass) =>
  pass.isPhysicalEvent ? pass.location || "Venue to be announced" : "Online event";

const EmptyState = ({
  activeKinds,
  onExplore,
}: {
  activeKinds: PassKind[];
  onExplore: () => void;
}) => {
  const onlyKind = activeKinds.length === 1 ? activeKinds[0] : null;
  const copy =
    onlyKind === "ticket"
      ? "No tickets yet. Once you grab a seat, it will show up here with its QR code."
      : onlyKind === "registration"
        ? "No registrations yet. Your confirmed spots will live here."
        : "Nothing here yet. Tickets and registrations you own will appear here automatically.";

  return (
    <View style={[tw`items-center rounded-[28px] border border-[#21336E] bg-[#0D1B49]`, styles.emptyCard]}>
      <View style={tw`w-16 h-16 rounded-full items-center justify-center bg-[#0FF1CF]/15`}>
        <Ionicons name="ticket-outline" size={28} color="#0FF1CF" />
      </View>
      <Text style={tw`text-white text-lg font-semibold mt-4`}>Nothing to show yet</Text>
      <Text style={tw`text-[#AFC0F4] text-center mt-2 leading-6`}>{copy}</Text>
      <View style={tw`w-full mt-5`}>
        <CustomButton
          title="Explore events"
          buttonClassName="!w-full bg-[#0FF1CF] border-0"
          textClassName="!text-black"
          arrowCircleColor="bg-[#0C7F7F]"
          onPress={onExplore}
        />
      </View>
    </View>
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
  const status = getStatusMeta(pass);
  const subtitle =
    pass.kind === "ticket"
      ? pass.ticketType
      : pass.isUsed
        ? "Attendance recorded"
        : "Registration confirmed";

  return (
    <View style={[tw`overflow-hidden rounded-[28px] border border-[#21336E] bg-[#0B153B]`, styles.passCard]}>
      <View style={styles.mediaWrap}>
        <EventImageWithProcessing
          imageUrl={pass.thumbnailUrl}
          isProcessing={false}
          height={156}
          registrationType={pass.registrationType}
        />
        <View style={tw`absolute left-4 top-4 rounded-full bg-[#020B2E]/75 px-3 py-2`}>
          <Text style={tw`text-[11px] font-semibold uppercase tracking-[1px] text-white`}>
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
            <Text style={tw`text-white text-lg font-bold`} numberOfLines={2}>
              {pass.eventTitle}
            </Text>
            <Text style={tw`text-[#AFC0F4] mt-1`} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>

          {pass.kind === "ticket" ? (
            <View style={tw`rounded-2xl border border-[#28408C] bg-[#12245E] px-3 py-2`}>
              <Text style={tw`text-[#8FA5E2] text-[10px] uppercase tracking-[1px]`}>
                Price
              </Text>
              <Text style={tw`text-white font-semibold mt-1`}>
                {pass.ticketPrice && pass.ticketPrice > 0
                  ? numberWithCommas(pass.ticketPrice, true, null)
                  : "Free"}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={tw`mt-4 gap-3`}>
          <View style={tw`flex-row items-center`}>
            <Ionicons name="calendar-outline" size={16} color="#0FF1CF" />
            <Text style={tw`ml-3 flex-1 text-[#D9E2FF]`}>
              {formatEventDateTime(pass.eventStartDate, pass.eventEndDate)}
            </Text>
          </View>
          <View style={tw`flex-row items-center`}>
            <Ionicons name="location-outline" size={16} color="#8FA5E2" />
            <Text style={tw`ml-3 flex-1 text-[#AFC0F4]`} numberOfLines={1}>
              {getLocationCopy(pass)}
            </Text>
          </View>
        </View>

        <View style={[tw`mt-5 rounded-2xl border border-[#1D2E69] bg-[#0E1C49] px-4 py-3`, styles.metaStrip]}>
          <View>
            <Text style={tw`text-[#7F93CC] text-[11px] uppercase tracking-[1px]`}>
              Issued
            </Text>
            <Text style={tw`text-white font-medium mt-1`}>
              {formatIssuedDate(pass.createdAt)}
            </Text>
          </View>
          <View style={tw`items-end`}>
            <Text style={tw`text-[#7F93CC] text-[11px] uppercase tracking-[1px]`}>
              Pass ID
            </Text>
            <Text style={tw`text-white font-medium mt-1`} numberOfLines={1}>
              {pass.id.slice(0, 8).toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={tw`mt-5 flex-row gap-3`}>
          <TouchableOpacity
            onPress={() => onOpenQr(pass)}
            style={[tw`flex-1 rounded-2xl border border-[#0FF1CF]/40 bg-[#0FF1CF]/10 px-4 py-3`, styles.actionButton]}
          >
            <View style={tw`flex-row items-center justify-center`}>
              <Ionicons name="qr-code-outline" size={18} color="#0FF1CF" />
              <Text style={tw`ml-2 font-semibold text-[#0FF1CF]`}>Show QR</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onOpenEvent(pass)}
            style={[tw`flex-1 rounded-2xl border border-[#28408C] bg-[#13255E] px-4 py-3`, styles.actionButton]}
          >
            <View style={tw`flex-row items-center justify-center`}>
              <Ionicons name="open-outline" size={18} color="#D9E2FF" />
              <Text style={tw`ml-2 font-semibold text-white`}>View event</Text>
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
  if (!pass) {
    return null;
  }

  const status = getStatusMeta(pass);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <TouchableOpacity style={styles.modalDismissArea} activeOpacity={1} onPress={onClose} />
        <View style={[tw`rounded-[32px] border border-[#233676] bg-[#091336]`, styles.modalCard]}>
          <View style={tw`flex-row items-start justify-between`}>
            <View style={tw`flex-1 pr-4`}>
              <Text style={tw`text-[#7F93CC] text-[11px] uppercase tracking-[1px]`}>
                {pass.kind === "ticket" ? "Ticket pass" : "Registration pass"}
              </Text>
              <Text style={tw`text-white text-2xl font-bold mt-2`} numberOfLines={2}>
                {pass.eventTitle}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={tw`p-2`}>
              <Ionicons name="close" size={22} color="#D9E2FF" />
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

          <View style={[tw`items-center justify-center rounded-[28px] bg-white mt-6`, styles.qrWrap]}>
            <QRCode value={pass.qrCode} size={214} color="#07164F" backgroundColor="white" />
          </View>

          <Text style={tw`text-center text-white font-semibold mt-5`}>
            {pass.kind === "ticket" ? pass.ticketType : "Confirmed registration"}
          </Text>
          <Text style={tw`text-center text-[#AFC0F4] mt-2`}>
            Show this code at check-in for quick access.
          </Text>

          <View style={tw`mt-6 rounded-2xl border border-[#1D2E69] bg-[#0E1C49] px-4 py-4`}>
            <View style={tw`flex-row items-center`}>
              <Ionicons name="calendar-outline" size={16} color="#0FF1CF" />
              <Text style={tw`ml-3 flex-1 text-[#D9E2FF]`}>
                {formatEventDateTime(pass.eventStartDate, pass.eventEndDate)}
              </Text>
            </View>
            <View style={tw`flex-row items-center mt-3`}>
              <Ionicons name="location-outline" size={16} color="#8FA5E2" />
              <Text style={tw`ml-3 flex-1 text-[#AFC0F4]`} numberOfLines={1}>
                {getLocationCopy(pass)}
              </Text>
            </View>
          </View>

          <View style={tw`mt-6 flex-row gap-3`}>
            <TouchableOpacity
              onPress={() => onOpenEvent(pass)}
              style={[tw`flex-1 rounded-2xl border border-[#28408C] bg-[#13255E] px-4 py-4`, styles.actionButton]}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <Ionicons name="open-outline" size={18} color="#D9E2FF" />
                <Text style={tw`ml-2 font-semibold text-white`}>Open event</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={[tw`flex-1 rounded-2xl border border-[#0FF1CF]/40 bg-[#0FF1CF]/10 px-4 py-4`, styles.actionButton]}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#0FF1CF" />
                <Text style={tw`ml-2 font-semibold text-[#0FF1CF]`}>Done</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const MyPassesPage = () => {
  const router = useLockedRouter();
  const [activeKinds, setActiveKinds] = useState<PassKind[]>([
    "ticket",
    "registration",
  ]);
  const [selectedPass, setSelectedPass] = useState<UnifiedPass | null>(null);

  const {
    data: ticketsResponse,
    isLoading: ticketsLoading,
    refetch: refetchTickets,
    isRefetching: ticketsRefetching,
  } = useMyTickets();
  const {
    data: registrationsResponse,
    isLoading: registrationsLoading,
    refetch: refetchRegistrations,
    isRefetching: registrationsRefetching,
  } = useMyRegistrations();

  const tickets = Array.isArray(ticketsResponse?.data) ? ticketsResponse.data : [];
  const registrations = Array.isArray(registrationsResponse?.data)
    ? registrationsResponse.data
    : [];

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

  const isLoading = ticketsLoading || registrationsLoading;
  const isRefreshing = ticketsRefetching || registrationsRefetching;

  const handleRefresh = async () => {
    await Promise.all([refetchTickets(), refetchRegistrations()]);
  };

  const handleOpenEvent = (pass: UnifiedPass) => {
    setSelectedPass(null);
    router.push(`/event/${pass.eventId}` as any);
  };

  if (isLoading && combinedPasses.length === 0) {
    return (
      <View style={[tw`flex-1 bg-[#01082E] items-center justify-center`, styles.screen]}>
        <ActivityIndicator size="large" color="#0FF1CF" />
        <Text style={tw`text-white text-base mt-4`}>Loading your passes...</Text>
      </View>
    );
  }

  return (
    <View style={[tw`flex-1 bg-[#01082E]`, styles.screen]}>
      <CustomeTopBarNav
        title="my passes"
        onClickBack={() => safeGoBack(router, "/settings")}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#0FF1CF"
          />
        }
      >
        <View style={[tw`rounded-[32px] border border-[#203370] bg-[#0C1741]`, styles.heroCard]}>
          <Text style={tw`text-[#7F93CC] text-[12px] uppercase tracking-[1.4px]`}>
            Your access
          </Text>
          <Text style={tw`text-white text-[30px] font-bold mt-3`}>
            Every ticket and registration, in one place.
          </Text>
          <Text style={tw`text-[#AFC0F4] mt-3 leading-6`}>
            Quick QR access, event details, and a clean split between what is ready now and what has already been used.
          </Text>

          <View style={tw`flex-row gap-3 mt-6`}>
            <View style={[tw`flex-1 rounded-2xl border border-[#23408A] bg-[#13255E]`, styles.summaryChip]}>
              <Text style={tw`text-[#8FA5E2] text-[11px] uppercase tracking-[1px]`}>
                Total
              </Text>
              <Text style={tw`text-white text-2xl font-bold mt-2`}>
                {combinedPasses.length}
              </Text>
            </View>
            <View style={[tw`flex-1 rounded-2xl border border-[#214B55] bg-[#0B2A34]`, styles.summaryChip]}>
              <Text style={tw`text-[#8FE8E0] text-[11px] uppercase tracking-[1px]`}>
                Tickets
              </Text>
              <Text style={tw`text-white text-2xl font-bold mt-2`}>
                {tickets.length}
              </Text>
            </View>
            <View style={[tw`flex-1 rounded-2xl border border-[#50427A] bg-[#201C4F]`, styles.summaryChip]}>
              <Text style={tw`text-[#C4B6FF] text-[11px] uppercase tracking-[1px]`}>
                Registrations
              </Text>
              <Text style={tw`text-white text-2xl font-bold mt-2`}>
                {registrations.length}
              </Text>
            </View>
          </View>

          {nextPass ? (
            <View style={[tw`mt-6 rounded-2xl border border-[#1D2E69] bg-[#0E1C49]`, styles.nextUpCard]}>
              <Text style={tw`text-[#7F93CC] text-[11px] uppercase tracking-[1px]`}>
                Next up
              </Text>
              <Text style={tw`text-white text-lg font-semibold mt-2`} numberOfLines={2}>
                {nextPass.eventTitle}
              </Text>
              <Text style={tw`text-[#AFC0F4] mt-1`}>
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
                        backgroundColor: "#081233",
                        borderColor: "#1A2A62",
                      },
                ]}
              >
                <View style={tw`flex-row items-center justify-center`}>
                  <Ionicons
                    name={filter.icon}
                    size={18}
                    color={isActive ? filter.activeText : "#8FA5E2"}
                  />
                  <Text
                    style={[
                      tw`ml-2 font-semibold`,
                      { color: isActive ? "#FFFFFF" : "#D9E2FF" },
                    ]}
                  >
                    {filter.label}
                  </Text>
                </View>
                <Text
                  style={[
                    tw`text-center text-xs mt-2`,
                    { color: isActive ? filter.activeText : "#7F93CC" },
                  ]}
                >
                  {count} owned
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredPasses.length === 0 ? (
          <EmptyState
            activeKinds={activeKinds}
            onExplore={() => router.push("/search" as any)}
          />
        ) : (
          <>
            {readyPasses.length > 0 ? (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeader}>
                  <Text style={tw`text-white text-xl font-bold`}>Ready to use</Text>
                  <Text style={tw`text-[#8FA5E2]`}>{readyPasses.length}</Text>
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
                  <Text style={tw`text-white text-xl font-bold`}>Archive</Text>
                  <Text style={tw`text-[#8FA5E2]`}>{archivePasses.length}</Text>
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
