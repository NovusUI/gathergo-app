import Tab from "@/components/Tab";
import ActivityIndicator from "@/components/ui/AppLoader";
import CarpoolCard from "@/components/ui/CarpoolCard";
import EventCard from "@/components/ui/EventCard";
import GgCircleArtwork from "@/components/ui/GgCircleArtwork";
import { layoutSpacing, spacing } from "@/constants/spacing";
import { HomeAdCard } from "@/types/home";

import { useAuth } from "@/context/AuthContext";
import {
  useForYouCarpools,
  useForYouEvents,
  useHomeAdCards,
} from "@/services/queries";
import { useLockedRouter } from "@/utils/navigation";
import { formatBadgeCount } from "@/utils/utils";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useLocationManager } from "@/hooks/useLocationManager";
import { useNotifications } from "@/hooks/useNotifications";
import { useUnreadCounts } from "@/hooks/useSocketReactHook";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";

const { width } = Dimensions.get("window");
const bannerCardWidth = Math.min(width, 500) - layoutSpacing.pageHorizontal * 2;

export default function HomeScreen() {
  const { requestLocation } = useLocationManager();
  const { data } = useUnreadCounts();
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const tabs = ["For you", "Carpool", "Circle"] as const;
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>(tabs[0]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const { data: events, isPending: loading } = useForYouEvents(user?.id);
  const { data: carpoolsForYou, isPending: pendingCarpoolData } =
    useForYouCarpools();
  const { data: homeAdCards } = useHomeAdCards();

  const router = useLockedRouter();
  const hasUnreadMessages = (data?.totalUnread ?? 0) > 0;
  const notificationBadgeLabel = formatBadgeCount(unreadCount);
  const messageBadgeLabel = formatBadgeCount(data?.totalUnread ?? 0);

  const displayName = user?.username || user?.name || "there";
  const featuredEvent = events?.data?.[0];
  const secondEvent = events?.data?.[1];
  const fallbackBannerCards = [
    {
      key: "impact",
      variant: "image" as const,
      imageUrl: featuredEvent?.imageUrl,
      onPress: () =>
        featuredEvent
          ? router.replace(`/event/${featuredEvent.id}`)
          : setActiveTab("For you"),
    },
    {
      key: "ride",
      variant: "copy" as const,
      eyebrow: "Find a ride",
      title: "Shared rides make turnout easier",
      body:
        carpoolsForYou?.data?.length
          ? `You already have ${carpoolsForYou.data.length} ride option${carpoolsForYou.data.length === 1 ? "" : "s"} waiting.`
          : "Coordinate transport with other attendees and remove friction from showing up.",
      cta: "See rides",
      onPress: () => setActiveTab("Carpool"),
    },
    {
      key: "circle",
      variant: "copy" as const,
      eyebrow: "Circle",
      title: secondEvent?.title
        ? `Circle will connect people around moments like ${secondEvent.title}`
        : "Circle will connect people around causes, updates, and shared momentum",
      body:
        "When it lands, your event communities will have a dedicated home for conversations and belonging.",
      cta: "Preview Circle",
      onPress: () => router.push("/circle"),
    },
  ];
  const bannerCards =
    homeAdCards?.data?.length
      ? homeAdCards.data.map((card) => ({
          ...card,
          onPress: () => {
            if (card.route) {
              router.push(card.route as any);
              return;
            }
            if (card.eventId) {
              router.push(`/event/${card.eventId}`);
              return;
            }
            if (card.key === "ride") {
              setActiveTab("Carpool");
              return;
            }
            if (card.key === "circle") {
              router.push("/circle");
              return;
            }
            setActiveTab("For you");
          },
        }))
      : fallbackBannerCards;

  const handleBannerScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x / bannerCardWidth
    );
    setBannerIndex(nextIndex);
  };

  const renderBannerAccent = (
    card: HomeAdCard & { key: string; onPress: () => void }
  ) => {
    if (card.key === "circle") {
      return (
        <GgCircleArtwork
          width={styles.bannerArtwork.width}
          height={styles.bannerArtwork.height}
        />
      );
    }

    const fallbackIconName =
      card.key === "ride"
        ? "car-sport-outline"
        : card.key === "impact" || card.key === "donation"
        ? "sparkles-outline"
        : "flash-outline";

    return (
      <Ionicons
        name={(card.icon || fallbackIconName) as any}
        size={28}
        color={card.accentColor || "#0FF1CF"}
      />
    );
  };

  return (
    <View style={[tw`flex-1 bg-[#030A31] items-center`, styles.screen]}>
      {/* Header */}
      <View style={[tw`flex-row justify-between items-center w-full max-w-[500px]`, styles.header]}>
        <Text style={tw`text-white`}>{`Hello ${displayName} 😊`}</Text>
        <View style={tw`flex-row items-center justify-between`}>
          <TouchableOpacity
            style={[tw`relative`, styles.headerIconButton]}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons
              size={30}
              color={"white"}
              name={unreadCount > 0 ? "heart" : "heart-outline"}
            />
            {unreadCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>
                  {notificationBadgeLabel}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`relative`}
            onPress={() => router.push("/conversations")}
          >
            <Ionicons
              size={30}
              color="white"
              name={hasUnreadMessages ? "chatbubble" : "chatbubble-outline"}
            />
            {hasUnreadMessages && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{messageBadgeLabel}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Featured Banner */}
      <View style={styles.bannerWrap}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleBannerScrollEnd}
        >
          {bannerCards.map((card) => (
            <TouchableOpacity
              key={card.key}
              activeOpacity={0.92}
              style={styles.bannerCard}
              onPress={card.onPress}
            >
              {card.variant === "image" ? (
                card.imageUrl ? (
                  <Image
                    source={{ uri: card.imageUrl }}
                    style={styles.bannerImageCard}
                  />
                ) : (
                  <View style={styles.bannerImageCardFallback}>
                    <GgCircleArtwork width="100%" height="100%" />
                  </View>
                )
              ) : (
                <>
                  <View style={styles.bannerBadge}>
                    <Text style={styles.bannerBadgeText}>{card.eyebrow}</Text>
                  </View>
                  <Text style={styles.bannerTitle}>{card.title}</Text>
                  <Text style={styles.bannerBody}>{card.body}</Text>
                  <View style={styles.bannerFooter}>
                    <Text style={styles.bannerCta}>{card.cta}</Text>
                    {renderBannerAccent(card as any)}
                  </View>
                </>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.bannerDots}>
          {bannerCards.map((card, index) => (
            <View
              key={card.key}
              style={[
                styles.bannerDot,
                index === bannerIndex && styles.bannerDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        style={[tw`w-full max-w-[500px]`, styles.scroll]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.listSection}>
          {/* Tabs */}
          <View style={[tw`flex-row justify-between w-full max-w-[500px]`, styles.tabs]}>
            {tabs.map((tab) => (
              <Tab
                key={tab}
                title={tab}
                isActive={activeTab === tab}
                className="w-1/4"
                onPress={() => setActiveTab(tab)}
              />
            ))}
          </View>

          {activeTab === "For you" &&
            (loading ? (
              <ActivityIndicator tone="accent" size="large" />
            ) : events?.data?.length ? (
              <View style={styles.listGroup}>
                {events.data.map((event: any) => (
                  <EventCard
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    location={event.location}
                    thumbnailUrl={event.thumbnailUrl}
                    imageUrl={event.imageUrl}
                    onPress={() => router.replace(`/event/${event.id}`)}
                    registrationType={event.registrationType}
                    registrationFee={event.registrationFee}
                    donationTarget={event.donationTarget}
                    lowestTicketPrice={event.lowestTicketPrice}
                    startDate={event.startDate}
                    impactTitle={event.impactTitle}
                    impactPercentage={event.impactPercentage}
                  />
                ))}
              </View>
            ) : (
              <Text style={tw`text-gray-400 text-center`}>
                No events found.
              </Text>
            ))}

          {activeTab === "Carpool" &&
            (pendingCarpoolData ? (
              <ActivityIndicator tone="accent" size="large" />
            ) : carpoolsForYou?.data.length ? (
              <View style={styles.listGroup}>
                {carpoolsForYou.data.map((carpool: any) => (
                  <CarpoolCard
                    key={carpool.id}
                    id={carpool.id}
                    pickupLocation={carpool.origin}
                    title={carpool.event.title}
                    imageUrl={carpool.event.imageUrl}
                    thumbnailUrl={carpool.event.thumbnailUrl}
                    startDate={carpool.event.startDate}
                    departureTime={carpool.departureTime}
                    availableSeats={carpool.availableSeats}
                    pricePerSeat={carpool.pricePerSeat}
                    vehicleIcon={carpool.vehicleIcon}
                    onPress={() => router.push(`/carpool/${carpool.id}`)}
                  />
                ))}
              </View>
            ) : (
              <Text style={tw`text-gray-400 text-center`}>
                No carpool found for you.
              </Text>
            ))}

          {activeTab === "Circle" && (
            <TouchableOpacity
              style={styles.circleBanner}
              onPress={() => router.push("/circle")}
              activeOpacity={0.85}
            >
              <GgCircleArtwork
                width="100%"
                height={styles.circleBannerImage.height}
                style={styles.circleBannerImage}
              />
              <Text style={tw`text-white text-base font-semibold mt-3 text-center`}>
                Circle is coming soon
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: layoutSpacing.pageTop,
    paddingBottom: layoutSpacing.pageBottom,
  },
  header: {
    paddingHorizontal: layoutSpacing.pageHorizontal,
  },
  headerIconButton: {
    marginRight: spacing.xl,
  },
  headerBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#0FF1CF",
    borderRadius: 999,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBadgeText: {
    color: "#03122F",
    fontSize: 10,
    fontWeight: "800",
  },
  bannerWrap: {
    marginTop: spacing.lg,
    width: "100%",
    maxWidth: 500,
  },
  bannerCard: {
    width: bannerCardWidth,
    marginHorizontal: layoutSpacing.pageHorizontal,
    backgroundColor: "#07164F",
    borderColor: "#1F3FAD",
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md,
    minHeight: 136,
  },
  bannerImageCard: {
    width: "100%",
    height: 118,
    borderRadius: 12,
  },
  bannerImageCardFallback: {
    width: "100%",
    height: 118,
    borderRadius: 12,
    overflow: "hidden",
  },
  bannerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#0FF1CF",
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginBottom: spacing.sm,
  },
  bannerBadgeText: {
    color: "#01082E",
    fontSize: 11,
    fontWeight: "800",
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  bannerBody: {
    color: "#CBD8FF",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  bannerFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bannerCta: {
    color: "#0FF1CF",
    fontSize: 13,
    fontWeight: "700",
  },
  bannerArtwork: {
    width: 62,
    height: 34,
    borderRadius: 12,
  },
  bannerDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: spacing.sm,
  },
  bannerDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#3550A7",
  },
  bannerDotActive: {
    width: 22,
    backgroundColor: "#0FF1CF",
  },
  tabs: {
    paddingVertical: spacing.lg,
    paddingHorizontal: layoutSpacing.pageHorizontal,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: layoutSpacing.pageHorizontal,
    width: "100%",
  },
  scrollContent: {
    paddingBottom: layoutSpacing.listBottomInset,
  },
  listSection: {},
  listGroup: {
    gap: layoutSpacing.listGap,
  },
  circleBanner: {
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: "#101C45",
    alignItems: "center",
  },
  circleBannerImage: {
    width: "100%",
    maxWidth: 420,
    height: 140,
    borderRadius: 12,
  },
});
