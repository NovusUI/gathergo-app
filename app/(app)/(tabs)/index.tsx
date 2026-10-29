import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useHomeReachability } from "@/hooks/useHomeReachability";
import type { ThemeColor } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { PostEventSurveyPrompt } from "@/components/gogo/tasks/interestMap/PostEventSurveyPrompt";
import Tab from "@/components/Tab";
import { GatherGoMascot } from "@/components/gogo/mascot/GatherGoMascot";
import CarpoolCard from "@/components/ui/CarpoolCard";
import EventCard from "@/components/ui/EventCard";
import GgCircleArtwork from "@/components/ui/GgCircleArtwork";
import { MascotMoment } from "@/components/gogo/mascot/MascotMoment";
import ImpactPageLoader from "@/components/ui/ImpactPageLoader";
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
import { useEffect, useRef, useState } from "react";
import {
  type AccessibilityActionEvent,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle } from "react-native-reanimated";


const HOME_BANNER_ICON_NAMES = new Set([
  "calendar-outline",
  "car-sport-outline",
  "compass-outline",
  "flash-outline",
  "gift-outline",
  "heart-outline",
  "leaf-outline",
  "megaphone-outline",
  "people-outline",
  "radio-outline",
  "ticket-outline",
  "trophy-outline",
]);

const getBannerFallbackIconName = (key: string) => {
  if (key === "ride") return "car-sport-outline";
  if (key === "impact") return "leaf-outline";
  if (key === "donation") return "heart-outline";
  return "flash-outline";
};

const getBannerIconName = (card: Pick<HomeAdCard, "key" | "icon">) => {
  const fallbackIconName = getBannerFallbackIconName(card.key);

  if (card.key === "impact" || card.key === "donation") {
    return fallbackIconName;
  }

  const requestedIconName = card.icon?.trim();
  return requestedIconName && HOME_BANNER_ICON_NAMES.has(requestedIconName)
    ? requestedIconName
    : fallbackIconName;
};

export default function HomeScreen() {
  const { tw, color } = useAppTheme();
  const layout = useResponsiveLayout();
  const bannerChromeHeight = 32;
  const reach = useHomeReachability(layout.bannerHeight + bannerChromeHeight, layout.reachExpansion);
  const { headerHeight } = reach;
  const bannerStyle = useAnimatedStyle(() => ({
    height: headerHeight.value - bannerChromeHeight,
  }));
  const bannerBodyStyle = useAnimatedStyle(() => {
    const progress = layout.reachExpansion > 0
      ? Math.max(0, Math.min(1, (headerHeight.value - layout.bannerHeight - bannerChromeHeight) / layout.reachExpansion))
      : 0;
    return { maxHeight: 16 * layout.fontScale * (1 + 2 * progress) };
  });
  const headerActions = layout.reachExpansion > 0 ? [{
    name: reach.expanded ? "collapseHeader" : "expandHeader",
    label: reach.expanded ? "Collapse Home header" : "Expand Home header",
  }] : [];
  const onHeaderAccessibilityAction = ({ nativeEvent }: AccessibilityActionEvent) => {
    if (nativeEvent.actionName === (reach.expanded ? "collapseHeader" : "expandHeader")) reach.toggle();
  };
  const bannerPageWidth = layout.pageWidth;
  const carouselRef = useRef<ScrollView>(null);
  const styles = createStyles(color);
  const { requestLocation } = useLocationManager();
  const { data } = useUnreadCounts();
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const tabs = ["Gogo picks", "Carpool", "Circle"] as const;
  const tabsIcons = [
    undefined,
    { library: "Ionicons", name: "car-sport" },
    { library: "FontAwesome5", name: "users" },
  ] as const;
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>(tabs[0]);
  const [bannerIndex, setBannerIndex] = useState(0);
  useEffect(() => {
    carouselRef.current?.scrollTo({ x: bannerIndex * bannerPageWidth, animated: false });
  }, [bannerPageWidth, bannerIndex]);
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
      key: "event",
      variant: "image" as const,
      imageUrl: featuredEvent?.imageUrl,
      onPress: () =>
        featuredEvent
          ? router.replace(`/event/${featuredEvent.id}`)
          : setActiveTab("Gogo picks"),
    },
    {
      key: "ride",
      variant: "copy" as const,
      eyebrow: "Find a ride",
      title: "Shared rides make turnout easier",
      body: carpoolsForYou?.data?.length
        ? `You already have ${carpoolsForYou.data.length} ride option${
            carpoolsForYou.data.length === 1 ? "" : "s"
          } waiting.`
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
        : "Circle will connect people around events and shared interests",
      body: "When it lands, your event communities will have a dedicated home for conversations and belonging.",
      cta: "Preview Circle",
      onPress: () => router.push("/circle"),
    },
  ];
  const bannerCards = homeAdCards?.data?.length
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
          setActiveTab("Gogo picks");
        },
      }))
    : fallbackBannerCards;

  const handleBannerScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x / bannerPageWidth,
    );
    setBannerIndex(nextIndex);
  };

  const renderBannerAccent = (
    card: Pick<HomeAdCard, "key" | "icon" | "accentColor">,
  ) => {
    if (card.key === "circle") {
      return (
        <GgCircleArtwork
          width={styles.bannerArtwork.width}
          height={styles.bannerArtwork.height}
        />
      );
    }

    const iconName = getBannerIconName(card);

    return (
      <Ionicons
        name={iconName as any}
        size={20}
        color={card.accentColor || color("#0FF1CF", "accent")}
      />
    );
  };

  return (
    <GestureDetector gesture={reach.panGesture}>
      <SafeAreaView edges={["top"]} style={[tw`flex-1 bg-background dark:bg-[#030A31] items-center`, styles.screen]}>
        {/* Header */}
        <View
          style={[
            tw`flex-row justify-between items-center w-full`,
            styles.header,
            { maxWidth: layout.pageWidth, paddingHorizontal: layout.horizontalPadding },
          ]}
        >
          <Text numberOfLines={1} style={tw`flex-1 mr-2 text-foreground dark:text-white`}>{`Hello ${displayName} 😊`}</Text>
          <View style={tw`flex-row items-center justify-between`}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Scan a QR code"
              style={tw`h-11 w-11 items-center justify-center`}
              onPress={() => router.push('/scanner/scanner-screen')}
            >
              <Ionicons name="scan-outline" size={28} color={color('white', 'foreground')} />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              style={[tw`relative h-11 w-11 items-center justify-center`, styles.headerIconButton]}
              onPress={() => router.push("/notifications")}
            >
              <Ionicons
                size={30}
                color={color("white", "foreground")}
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
              accessibilityRole="button"
              accessibilityLabel="Conversations"
              style={tw`relative h-11 w-11 items-center justify-center`}
              onPress={() => router.push("/conversations")}
            >
              <Ionicons
                size={30}
                color={color("white", "foreground")}
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

        <GestureDetector gesture={reach.scrollGesture}>
          <Animated.ScrollView
            style={[tw`w-full`, styles.scroll, { maxWidth: layout.pageWidth }]}
            contentContainerStyle={styles.scrollContent}
            stickyHeaderIndices={[1]}
            onScroll={reach.scrollHandler}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[{ width: "100%", maxWidth: layout.pageWidth, overflow: "hidden" }, reach.headerStyle]}
            >
              <View style={styles.bannerWrap}>
                <ScrollView
                  ref={carouselRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={handleBannerScrollEnd}
                >
                  {bannerCards.map((card) => (
                    <View key={card.key} style={{ width: bannerPageWidth }}>
                      <Animated.View style={bannerStyle}>
                        <TouchableOpacity
                          activeOpacity={0.92}
                          accessibilityRole="button"
                          accessibilityLabel={card.variant === "image" ? "Open featured event" : card.title}
                          accessibilityActions={headerActions}
                          onAccessibilityAction={onHeaderAccessibilityAction}
                          style={[styles.bannerCard, { height: "100%", marginHorizontal: layout.horizontalPadding }]}
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
                            <View style={styles.bannerContent}>
                              <View style={styles.bannerBadge}>
                                <Text style={styles.bannerBadgeText}>{card.eyebrow}</Text>
                              </View>
                              <Text numberOfLines={2} style={styles.bannerTitle}>
                                {card.title}
                              </Text>
                              <Animated.View style={[styles.bannerDescription, bannerBodyStyle]}>
                                <Text numberOfLines={3} style={styles.bannerBody}>
                                  {card.body}
                                </Text>
                              </Animated.View>
                              <View style={styles.bannerFooter}>
                                <Text style={styles.bannerCta}>{card.cta}</Text>
                                {renderBannerAccent(card)}
                              </View>
                            </View>
                          )}
                        </TouchableOpacity>
                      </Animated.View>
                    </View>
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
            </Animated.View>
            <View>
              <View
                style={[tw`flex-row justify-between w-full`, styles.tabs, { maxWidth: layout.pageWidth, paddingHorizontal: layout.horizontalPadding }]}
              >
                {tabs.map((tab, index) => (
                  <Tab
                    key={tab}
                    className="flex-1 px-1 gap-x-1"
                    accessibilityActions={headerActions}
                    onAccessibilityAction={onHeaderAccessibilityAction}
                    title={tab}
                    isActive={activeTab === tab}
                    onPress={() => setActiveTab(tab)}
                    icon={tabsIcons[index]}
                    iconContent={
                      tab === "Gogo picks" ? (
                        <GatherGoMascot
                          size={22}
                          animated={false}
                          showBadge={false}
                          style={tw`rounded-full bg-background dark:bg-[#01082E]`}
                        />
                      ) : undefined
                    }
                  />
                ))}
              </View>
            </View>
            <View style={[styles.listSection, { paddingHorizontal: layout.horizontalPadding }]}>
              {activeTab === "Gogo picks" &&
                (loading ? (
                  <ImpactPageLoader
                    compact
                    title="Finding your next event"
                    message="Finding events that match your interests."
                  />
                ) : events?.data?.length ? (
                  <View style={[styles.listGroup, { flexDirection: "row", flexWrap: "wrap", gap: layout.columnGap }]}>
                    {events.data.map((event: any) => (
                      <View key={event.id} style={{ width: layout.cardWidth, flexGrow: 1 }}>
                        <EventCard
                          id={event.id}
                          title={event.title}
                          description={event.description}
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
                          impactDescription={event.impactDescription}
                          impactSdgGoals={event.impactSdgGoals}
                          impactPaths={event.impactPaths}
                          impactCommitments={event.impactCommitments}
                          impactMapSource={event.impactMapSource}
                          tags={event.tags}
                        />
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={tw`text-muted dark:text-gray-400 text-center`}>
                    No events found.
                  </Text>
                ))}

              {activeTab === "Carpool" &&
                (pendingCarpoolData ? (
                  <ImpactPageLoader
                    compact
                    title="Mapping nearby rides"
                    message="Finding carpools connected to your event world."
                  />
                ) : carpoolsForYou?.data.length ? (
                  <View style={[styles.listGroup, { flexDirection: "row", flexWrap: "wrap", gap: layout.columnGap }]}>
                    {carpoolsForYou.data.map((carpool: any) => (
                      <View key={carpool.id} style={{ width: layout.cardWidth, flexGrow: 1 }}>
                        <CarpoolCard
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
                          poolerUsername={carpool.driver?.username}
                          isFollowingDriver={carpool.isFollowingDriver}
                          isFollowedByDriver={carpool.isFollowedByDriver}
                          isMember={carpool.isMember}
                          onPress={() => router.push(`/carpool/${carpool.id}`)}
                        />
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={tw`text-muted dark:text-gray-400 text-center`}>
                    No carpool found for you.
                  </Text>
                ))}

              {activeTab === "Circle" && (
                <TouchableOpacity
                  style={styles.circleBanner}
                  onPress={() => router.push("/circle")}
                  activeOpacity={0.85}
                >
                  <MascotMoment
                    artwork="comingSoon"
                    layout="stacked"
                    compact
                    title="Circle is coming soon"
                    message="A place for your people is on its way. I'll meet you here."
                  />
                </TouchableOpacity>
              )}
            </View>
          </Animated.ScrollView>
        </GestureDetector>
        <PostEventSurveyPrompt />
      </SafeAreaView>
    </GestureDetector>
  );
}

const createStyles = (color: ThemeColor) => StyleSheet.create({
  screen: {
    paddingTop: spacing.sm,
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
    backgroundColor: color("#0FF1CF", "accentFill"),
    borderRadius: 999,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBadgeText: {
    color: color("#01082E", "onAccent"),
    fontSize: 10,
    fontWeight: "800",
  },
  bannerWrap: {
    marginTop: spacing.lg,
    width: "100%",
  },
  bannerCard: {
    marginHorizontal: layoutSpacing.pageHorizontal,
    backgroundColor: color("#07164F", "surface"),
    borderColor: color("#1F3FAD", "border"),
    borderWidth: 1,
    borderRadius: 18,
    padding: 10,
    justifyContent: "center",
    overflow: "hidden",
  },
  bannerContent: {
    gap: spacing.xs,
  },
  bannerDescription: {
    overflow: "hidden",
  },
  bannerImageCard: {
    width: "100%",
    flex: 1,
    minHeight: 0,
    borderRadius: 12,
  },
  bannerImageCardFallback: {
    width: "100%",
    flex: 1,
    minHeight: 0,
    borderRadius: 12,
    overflow: "hidden",
  },
  bannerBadge: {
    alignSelf: "flex-start",
    backgroundColor: color("#0FF1CF", "accentFill"),
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  bannerBadgeText: {
    color: color("#01082E", "onAccent"),
    fontSize: 11,
    fontWeight: "800",
  },
  bannerTitle: {
    color: color("#FFFFFF", "foreground"),
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 18,
  },
  bannerBody: {
    color: color("#CBD8FF", "foreground"),
    fontSize: 12,
    lineHeight: 16,
  },
  bannerFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bannerCta: {
    color: color("#0FF1CF", "accent"),
    fontSize: 13,
    fontWeight: "700",
  },
  bannerArtwork: {
    width: 36,
    height: 20,
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
    backgroundColor: color("#3550A7", "surfaceRaised"),
  },
  bannerDotActive: {
    width: 22,
    backgroundColor: color("#0FF1CF", "accentFill"),
  },
  tabs: {
    backgroundColor: color("#030A31", "background"),
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: layoutSpacing.pageHorizontal,
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    paddingBottom: layoutSpacing.listBottomInset,
  },
  listSection: {
    paddingHorizontal: layoutSpacing.pageHorizontal,
    paddingTop: spacing.sm,
  },
  listGroup: {
    gap: layoutSpacing.listGap,
  },
  circleBanner: {
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: color("#101C45", "surface"),
    alignItems: "center",
  },
});
