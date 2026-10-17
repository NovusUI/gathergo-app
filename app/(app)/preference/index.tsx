import {
  EVENT_INTEREST_GROUPS,
  INTEREST_GRAPH,
} from "@/constants/eventInterests";
import CustomButton from "@/components/buttons/CustomBtn1";
import ProfileWelcomeModal from "@/components/ui/ProfileWelcomeModal";
import { useAuth } from "@/context/AuthContext";
import { useSavePreferences } from "@/services/mutations";
import { useCurrentUser } from "@/services/queries";
import { showGlobalError } from "@/utils/globalErrorHandler";
import { useLockedRouter } from "@/utils/navigation";
import { Ionicons } from "@expo/vector-icons";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  type LayoutChangeEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import tw from "twrnc";

const ALL_STARTER_ITEMS = EVENT_INTEREST_GROUPS.flatMap((c) => c.items);
const FALLBACK_MAP_SIGNALS = [
  "Culture",
  "Wellness",
  "Music",
  "Learning",
  "Tech",
  "Community",
];
const MAP_NODE_SLOTS = [
  { x: 72, y: 46, accent: "#F8D05C" },
  { x: 170, y: 30, accent: "#0FF1CF" },
  { x: 268, y: 58, accent: "#31C6F6" },
  { x: 286, y: 162, accent: "#FF6B6B" },
  { x: 172, y: 190, accent: "#60D394" },
  { x: 54, y: 156, accent: "#B78CFF" },
];
const MAP_VIEWBOX_WIDTH = 340;
const MAP_VIEWBOX_HEIGHT = 220;
const MAP_CENTER = { x: 170, y: 110 };
const MAP_NODE_SIZE = 44;
const MAP_LABEL_WIDTH = 84;
const MAP_CENTER_SIZE = 118;

function EventFeedMapPreview({ selectedPrefs }: { selectedPrefs: string[] }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const [mapWidth, setMapWidth] = useState(MAP_VIEWBOX_WIDTH);
  const activeSignals = selectedPrefs.slice(0, MAP_NODE_SLOTS.length);
  const previewSignals = activeSignals.length
    ? activeSignals
    : FALLBACK_MAP_SIGNALS;
  const activeCount = activeSignals.length;
  const mapScale = mapWidth / MAP_VIEWBOX_WIDTH;
  const centerSize = MAP_CENTER_SIZE * mapScale;
  const nodeSize = MAP_NODE_SIZE * mapScale;
  const labelWidth = MAP_LABEL_WIDTH * mapScale;
  const clusterCount = useMemo(
    () =>
      EVENT_INTEREST_GROUPS.filter((cluster) =>
        cluster.items.some((item) => selectedPrefs.includes(item)),
      ).length,
    [selectedPrefs],
  );

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.55],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.32, 0],
  });

  const handleMapLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;

    if (nextWidth > 0 && Math.abs(nextWidth - mapWidth) > 0.5) {
      setMapWidth(nextWidth);
    }
  };

  const scaledPoint = (point: { x: number; y: number }) => ({
    x: point.x * mapScale,
    y: point.y * mapScale,
  });
  const centerPoint = scaledPoint(MAP_CENTER);

  return (
    <View style={tw`rounded-[32px] border border-[#1B2A50] bg-[#07143B] p-5`}>
      <View style={tw`flex-row items-start justify-between gap-4`}>
        <View style={tw`flex-1 min-w-0`}>
          <Text
            style={tw`text-[#0FF1CF] text-[11px] font-bold tracking-widest uppercase`}
          >
            Your Event Interests
          </Text>
          <Text style={tw`mt-2 text-white text-3xl font-bold leading-9`}>
            Build a feed around what moves you.
          </Text>
          <Text style={tw`mt-2 text-[#A8BAE4] text-sm leading-5`}>
            Your choices help you discover events, rides, and community moments.
          </Text>
        </View>
        <View
          style={tw`h-14 w-14 rounded-3xl bg-[#0FF1CF]/12 items-center justify-center border border-[#0FF1CF]/25`}
        >
          <Ionicons name="radio-outline" size={28} color="#0FF1CF" />
        </View>
      </View>

      <View
        onLayout={handleMapLayout}
        style={[
          tw`relative mt-5 self-center`,
          {
            aspectRatio: MAP_VIEWBOX_WIDTH / MAP_VIEWBOX_HEIGHT,
            maxWidth: MAP_VIEWBOX_WIDTH,
            width: "100%",
          },
        ]}
      >
        <Svg
          pointerEvents="none"
          viewBox={`0 0 ${MAP_VIEWBOX_WIDTH} ${MAP_VIEWBOX_HEIGHT}`}
          width="100%"
          height="100%"
          style={tw`absolute inset-0`}
        >
          <Circle
            cx={MAP_CENTER.x}
            cy={MAP_CENTER.y}
            r="74"
            stroke="#1B2A50"
            strokeWidth="1"
            strokeDasharray="8 10"
            fill="none"
          />
          {MAP_NODE_SLOTS.map((slot, index) => {
            const isActive = index < activeCount;
            return (
              <Line
                key={`${slot.x}-${slot.y}`}
                x1={MAP_CENTER.x}
                y1={MAP_CENTER.y}
                x2={slot.x}
                y2={slot.y}
                stroke={isActive ? slot.accent : "#273B70"}
                strokeWidth={isActive ? 2.5 : 1.2}
                strokeOpacity={isActive ? 0.76 : 0.45}
              />
            );
          })}
        </Svg>

        <View
          style={[
            tw`absolute items-center`,
            {
              height: centerSize,
              left: centerPoint.x - centerSize / 2,
              top: centerPoint.y - centerSize / 2,
              width: centerSize,
            },
          ]}
        >
          <Animated.View
            style={[
              tw`absolute rounded-full bg-[#0FF1CF]`,
              { height: centerSize, width: centerSize },
              { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
            ]}
          />
          <View
            style={[
              tw`rounded-full border border-[#0FF1CF]/35 bg-[#01082E] items-center justify-center`,
              { height: centerSize, width: centerSize },
            ]}
          >
            {activeCount ? (
              <Text style={tw`text-[#0FF1CF] text-3xl font-bold`}>
                {activeCount}
              </Text>
            ) : (
              <Ionicons name="radio-outline" size={30} color="#0FF1CF" />
            )}
            <Text
              style={tw`text-[#A8BAE4] text-xs font-semibold uppercase tracking-widest`}
            >
              {activeCount ? "signals" : "ready"}
            </Text>
          </View>
        </View>

        {MAP_NODE_SLOTS.map((slot, index) => {
          const isActive = index < activeCount;
          const label = previewSignals[index] || FALLBACK_MAP_SIGNALS[index];
          const point = scaledPoint(slot);

          return (
            <View
              key={`${label}-${index}`}
              style={[
                tw`absolute items-center`,
                {
                  left: point.x - labelWidth / 2,
                  top: point.y - nodeSize / 2,
                  width: labelWidth,
                },
              ]}
            >
              <View
                style={[
                  tw`h-11 w-11 items-center justify-center rounded-full border`,
                  {
                    backgroundColor: isActive ? slot.accent : "#101C45",
                    borderColor: isActive ? slot.accent : "#2A3D6A",
                    height: nodeSize,
                    width: nodeSize,
                  },
                ]}
              >
                <Ionicons
                  name={isActive ? "checkmark" : "ellipse-outline"}
                  size={isActive ? 18 : 15}
                  color={isActive ? "#01082E" : "#6F83BA"}
                />
              </View>
              <Text
                style={[
                  tw`mt-1 text-center text-[11px] font-semibold`,
                  { color: isActive ? "#FFFFFF" : "#7F91C5" },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={tw`mt-4 flex-row gap-3`}>
        <InterestMetric value={`${selectedPrefs.length}`} label="Signals" />
        <InterestMetric value={`${clusterCount || 0}`} label="Clusters" />
        <InterestMetric
          value={`${suggestedBranchCount(selectedPrefs)}`}
          label="Branches"
        />
      </View>
    </View>
  );
}

function InterestMetric({ value, label }: { value: string; label: string }) {
  return (
    <View
      style={tw`flex-1 rounded-2xl border border-[#1B2A50] bg-[#0A173F] px-3 py-3`}
    >
      <Text style={tw`text-white text-lg font-bold`}>{value}</Text>
      <Text
        style={tw`mt-1 text-[#8FA5E2] text-[11px] uppercase tracking-widest`}
      >
        {label}
      </Text>
    </View>
  );
}

const suggestedBranchCount = (selectedPrefs: string[]) => {
  const branches = new Set<string>();

  selectedPrefs.forEach((preference) => {
    (INTEREST_GRAPH[preference] || []).forEach((suggestion) => {
      if (
        !selectedPrefs.includes(suggestion) &&
        !ALL_STARTER_ITEMS.includes(suggestion)
      ) {
        branches.add(suggestion);
      }
    });
  });

  return branches.size;
};

function AnimatedChip({
  item,
  selected,
  onPress,
  variant = "default",
  accent = "#0FF1CF",
}: {
  item: string;
  selected: boolean;
  onPress: () => void;
  variant?: "default" | "suggested";
  accent?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const backgroundColor = selected
    ? accent
    : variant === "suggested"
      ? `${accent}14`
      : "#101C45";
  const borderColor = selected
    ? accent
    : variant === "suggested"
      ? `${accent}55`
      : "#24345A";
  const textColor = selected
    ? "#01082E"
    : variant === "suggested"
      ? accent
      : "#FFFFFF";

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.88,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.spring(scale, {
        toValue: selected ? 1 : 1.1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 14,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 4,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={[
          tw`flex-row items-center rounded-full border px-4 py-2.5`,
          { backgroundColor, borderColor },
        ]}
      >
        {selected && (
          <Ionicons
            name="checkmark"
            size={13}
            color="#01082E"
            style={tw`mr-1.5`}
          />
        )}
        <Text style={[tw`text-sm font-semibold`, { color: textColor }]}>
          {item}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PreferencesScreen() {
  const router = useLockedRouter();
  const { user, setUser } = useAuth();
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const { data: currentUser } = useCurrentUser({
    enabled: Boolean(user && !user.birthDate),
  });
  const welcomeUser = user?.birthDate ? user : currentUser?.data ?? user;

  const { mutate: onUpdatePreference, isPending } = useSavePreferences({
    onSuccess: () => {
      if (user) {
        setUser({ ...user, hasPreferences: true });
      }

      setShowWelcome(true);
    },
    onError: (err: any) => {
      showGlobalError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save preferences",
      );
    },
  });

  const handleSelect = (item: string) => {
    setSelectedPrefs((prev) =>
      prev.includes(item) ? prev.filter((p) => p !== item) : [...prev, item],
    );
  };

  const savePreference = () => {
    if (!user) {
      showGlobalError("Please sign in again to save your preferences.");
      return;
    }
    if (selectedPrefs.length === 0) {
      showGlobalError("Please select at least one preference");
      return;
    }
    onUpdatePreference(selectedPrefs);
  };

  const suggestionGroups: { source: string; items: string[] }[] = [];
  const addedToGroup = new Set<string>();

  selectedPrefs.forEach((sel) => {
    const items = (INTEREST_GRAPH[sel] || []).filter(
      (suggestion) =>
        !selectedPrefs.includes(suggestion) &&
        !ALL_STARTER_ITEMS.includes(suggestion) &&
        !addedToGroup.has(suggestion),
    );

    if (items.length > 0) {
      items.forEach((i) => addedToGroup.add(i));
      suggestionGroups.push({ source: sel, items });
    }
  });

  return (
    <View style={tw`flex-1 bg-[#01082E] px-5 pt-14 pb-6`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-5 pb-4`}
      >
        <EventFeedMapPreview selectedPrefs={selectedPrefs} />

        {EVENT_INTEREST_GROUPS.map((cluster) => {
          const selectedCountInCluster = cluster.items.filter((item) =>
            selectedPrefs.includes(item),
          ).length;

          return (
            <View
              key={cluster.label}
              style={[
                tw`rounded-[26px] border bg-[#07143B] p-4`,
                { borderColor: `${cluster.accent}25` },
              ]}
            >
              <View style={tw`mb-4 flex-row items-center gap-3`}>
                <View
                  style={[
                    tw`h-11 w-11 items-center justify-center rounded-2xl`,
                    { backgroundColor: `${cluster.accent}18` },
                  ]}
                >
                  <Ionicons
                    name={cluster.iconName}
                    size={22}
                    color={cluster.accent}
                  />
                </View>
                <View style={tw`flex-1 min-w-0`}>
                  <Text
                    style={tw`text-white text-base font-semibold`}
                    numberOfLines={1}
                  >
                    {cluster.label}
                  </Text>
                  <Text style={tw`mt-1 text-[#8FA5E2] text-xs`}>
                    {selectedCountInCluster || "No"} signal
                    {selectedCountInCluster === 1 ? "" : "s"} selected here
                  </Text>
                </View>
              </View>

              <View
                style={[
                  tw`mb-4 h-px w-full`,
                  { backgroundColor: `${cluster.accent}24` },
                ]}
              />

              <View style={tw`flex-row flex-wrap gap-2`}>
                {cluster.items.map((item) => (
                  <AnimatedChip
                    key={item}
                    item={item}
                    selected={selectedPrefs.includes(item)}
                    onPress={() => handleSelect(item)}
                    accent={cluster.accent}
                  />
                ))}
              </View>
            </View>
          );
        })}

        {suggestionGroups.map(({ source, items }) => (
          <View
            key={source}
            style={tw`rounded-[24px] border border-[#0FF1CF]/25 bg-[#0A173F] p-4`}
          >
            <View style={tw`mb-3 flex-row items-center gap-2`}>
              <View
                style={tw`h-8 w-8 items-center justify-center rounded-full bg-[#0FF1CF]/12`}
              >
                <Ionicons name="git-branch-outline" size={16} color="#0FF1CF" />
              </View>
              <Text style={tw`flex-1 text-[#A8BAE4] text-xs leading-5`}>
                New branches from{" "}
                <Text style={tw`text-white font-semibold`}>{source}</Text>
              </Text>
            </View>
            <View style={tw`flex-row flex-wrap gap-2`}>
              {items.map((item) => (
                <AnimatedChip
                  key={item}
                  item={item}
                  selected={selectedPrefs.includes(item)}
                  onPress={() => handleSelect(item)}
                  variant="suggested"
                />
              ))}
            </View>
          </View>
        ))}

        <View
          style={tw`rounded-[26px] border border-[#1B2A50] bg-[#101C45] p-4`}
        >
          <View style={tw`flex-row items-center gap-3`}>
            <View
              style={tw`h-10 w-10 items-center justify-center rounded-2xl bg-[#F8D05C]/12`}
            >
              <Ionicons name="compass-outline" size={20} color="#F8D05C" />
            </View>
            <View style={tw`flex-1 min-w-0`}>
              <Text style={tw`text-white text-sm font-semibold`}>
                {selectedPrefs.length
                  ? "Your feed is starting to take shape."
                  : "Choose a few signals to wake the map up."}
              </Text>
              <Text style={tw`mt-1 text-[#8FA5E2] text-xs leading-5`}>
                GatherGo will use this to tune event discovery around your
                interests, communities, and experiences that feel close to you.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={tw`pt-4 gap-3`}>
        {selectedPrefs.length > 0 && (
          <View
            style={tw`rounded-2xl bg-[#0FF1CF]/10 border border-[#0FF1CF]/25 px-4 py-3 flex-row items-center justify-between gap-3`}
          >
            <Text style={tw`flex-1 text-[#A8BAE4] text-sm`}>
              <Text style={tw`text-white font-bold`}>
                {selectedPrefs.length}
              </Text>{" "}
              signals shaping your feed
            </Text>
            <TouchableOpacity onPress={() => setSelectedPrefs([])}>
              <Text style={tw`text-[#FF8A8A] text-sm`}>Clear all</Text>
            </TouchableOpacity>
          </View>
        )}
        <CustomButton
          onPress={savePreference}
          title={isPending ? "Saving..." : "Find my events"}
          disabled={isPending || showWelcome || selectedPrefs.length === 0}
          buttonClassName="bg-[#0FF1CF] border-0 w-full"
          textClassName="!text-black"
          arrowCircleColor="bg-[#0A7F7F]"
        />
      </View>
      {showWelcome && welcomeUser && (
        <ProfileWelcomeModal
          profile={welcomeUser}
          onContinue={() => router.replace("/")}
        />
      )}
    </View>
  );
}
