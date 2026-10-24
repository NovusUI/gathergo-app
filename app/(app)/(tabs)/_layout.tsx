import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useAppTheme } from "@/hooks/useAppTheme";
// app/_layout.tsx
import { usePressGuard } from "@/hooks/usePressGuard";
import { pushWithLock, replaceWithLock } from "@/utils/navigation";
import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";

import { Stack, usePathname, useRouter } from "expo-router";
import { useCallback, useRef, type ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type TabItem = {
  name: string;
  href?: "/" | "/circle" | "/search" | "/profile";
  icon: (color: string) => ReactNode;
};

export default function RootLayout() {
  const { tw, color } = useAppTheme();
  const { useNavigationRail, navigationRailWidth } = useResponsiveLayout();
  const pathname = usePathname();
  const router = useRouter();

  // Bottom sheet setup
  const bottomSheetRef = useRef<BottomSheet>(null);
  const openSheet = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(0);
  }, []);
  const guardedOpenSheet = usePressGuard(openSheet);
  const guardedCreateCarpool = usePressGuard(() => {
    bottomSheetRef.current?.close();
    pushWithLock(router, "/new-carpool");
  });
  const guardedCreateEvent = usePressGuard(() => {
    bottomSheetRef.current?.close();
    pushWithLock(router, "/new-event");
  });

  const tabs: TabItem[] = [
    {
      name: "Explore",
      href: "/",
      icon: (color: string) => <Feather name="grid" size={20} color={color} />,
    },
    {
      name: "Circle",
      href: "/circle",
      icon: (color: string) => <Feather name="users" size={20} color={color} />,
    },
    {
      name: "New",
      href: undefined,
      icon: (color: string) => (
        <Ionicons name="add-circle-outline" size={28} color={color} />
      ),
    },
    {
      name: "Search",
      href: "/search",
      icon: (color: string) => (
        <Feather name="search" size={20} color={color} />
      ),
    },
    {
      name: "Profile",
      href: "/profile",
      icon: (color: string) => (
        <FontAwesome5 name="user" size={18} color={color} />
      ),
    },
  ];

  const navigation = (
    <View
      accessibilityRole="tablist"
      accessibilityLabel="Main navigation"
      style={[
        tw`bg-background dark:bg-[#01082E] border-border dark:border-gray-800`,
        useNavigationRail
          ? { width: navigationRailWidth, justifyContent: "center", gap: 12, borderRightWidth: 1, paddingVertical: 16 }
          : { flexDirection: "row", justifyContent: "space-around", paddingVertical: 8, borderTopWidth: 1 },
      ]}
    >
      {tabs.map((tab) => {
        const href = tab.href;
        const isActive = pathname === href;
        const iconColor = isActive ? color("#0FF1CF", "accent") : color("white", "foreground");

        if (!href) {
          return (
            <TouchableOpacity
              key={tab.name}
              accessibilityRole="button"
              accessibilityLabel="Create event or carpool"
              style={tw`min-h-12 items-center justify-center px-2 py-1`}
              onPress={guardedOpenSheet}
            >
              {tab.icon(iconColor)}
              <Text style={tw`text-xs text-foreground dark:text-white`}>{tab.name}</Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={tab.name}
            accessibilityRole="tab"
            accessibilityLabel={tab.name}
            accessibilityState={{ selected: isActive }}
            style={tw`min-h-12 items-center justify-center px-2 py-1`}
            onPress={() => replaceWithLock(router, href)}
          >
            {tab.icon(iconColor)}
            <Text
              style={tw`${
                isActive ? "text-accent dark:text-[#0FF1CF]" : "text-foreground dark:text-white"
              } text-xs`}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={[tw`flex-1 bg-background dark:bg-[#01082E]`, { flexDirection: useNavigationRail ? "row" : "column" }]}>
      {useNavigationRail ? navigation : null}
      <View key="routes" style={tw`flex-1`}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: color("#01082E", "background") },
            animation: "fade",
          }}
        />
      </View>
      {useNavigationRail ? null : navigation}

      {/* Add Tab Bottom Sheet */}
      <BottomSheet
        index={-1}
        ref={bottomSheetRef}
        enableDynamicSizing
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
        backgroundStyle={{ backgroundColor: color("#01082E", "background") }}
      >
        <BottomSheetScrollView style={tw`px-5`}>
          <View style={tw`w-full max-w-[560px] self-center p-5 gap-4`}>
            <TouchableOpacity
              style={tw`rounded-3xl bg-surface dark:bg-[#101C45] p-5`}
              onPress={guardedCreateEvent}
            >
              <View style={tw`flex-row items-center justify-between`}>
                <View style={tw`flex-row items-center gap-3`}>
                  <View
                    style={tw`h-12 w-12 items-center justify-center rounded-full bg-accentFill/15 dark:bg-[#0FF1CF]/15`}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={22}
                      color={color("#0FF1CF", "accent")}
                    />
                  </View>
                  <View>
                    <Text style={tw`text-base font-semibold text-foreground dark:text-white`}>
                      New Event
                    </Text>
                    <Text style={tw`mt-1 text-sm text-secondary dark:text-[#98ABD6]`}>
                      Create with Gogo
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={color("white", "foreground")} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`rounded-3xl bg-accentFill dark:bg-[#0FF1CF] p-5`}
              onPress={guardedCreateCarpool}
            >
              <View style={tw`flex-row items-center justify-between`}>
                <View style={tw`flex-row items-center gap-3`}>
                  <View
                    style={tw`h-12 w-12 items-center justify-center rounded-full bg-background dark:bg-[#03122F]`}
                  >
                    <Ionicons
                      name="car-sport-outline"
                      size={22}
                      color={color("#0FF1CF", "accent")}
                    />
                  </View>
                  <View>
                    <Text style={tw`text-base font-semibold text-onAccent dark:text-[#01082E]`}>
                      New Carpool
                    </Text>
                    <Text style={tw`mt-1 text-sm text-onAccent dark:text-[#194949]`}>
                      Create a shared ride
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={color("#01082E", "onAccent")} />
              </View>
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}
