// app/_layout.tsx
import { usePressGuard } from "@/hooks/usePressGuard";
import { pushWithLock, replaceWithLock } from "@/utils/navigation";
import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";

import { Stack, usePathname, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

type TabItem = {
  name: string;
  href?: "/" | "/circle" | "/search" | "/profile";
  icon: (color: string) => ReactNode;
};

export default function RootLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const [sheetMode, setSheetMode] = useState<"root" | "eventType">("root");

  // Bottom sheet setup
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["34%"], []);
  const openSheet = useCallback(() => {
    setSheetMode("root");
    bottomSheetRef.current?.snapToIndex(0);
  }, []);
  const guardedOpenSheet = usePressGuard(openSheet);
  const guardedCreateCarpool = usePressGuard(() => {
    bottomSheetRef.current?.close();
    pushWithLock(router, "/new-carpool");
  });
  const guardedCreateDonationEvent = usePressGuard(() => {
    bottomSheetRef.current?.close();
    pushWithLock(router, "/new-event?eventType=donation");
  });
  const guardedCreateGeneralEvent = usePressGuard(() => {
    bottomSheetRef.current?.close();
    pushWithLock(router, "/new-event?eventType=general");
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

  return (
    <View style={tw`flex-1 bg-[#01082E]`}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#01082E" },
          animation: "fade",
        }}
      />

      {/* Bottom Nav */}
      <View
        style={tw`absolute bottom-0 left-0 right-0 flex-row justify-around bg-[#01082E] py-4 border-t border-gray-800`}
      >
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const color = isActive ? "#0FF1CF" : "white";

          if (!tab.href) {
            return (
              <TouchableOpacity
                key={tab.name}
                style={tw`items-center`}
                onPress={guardedOpenSheet}
              >
                {tab.icon(color)}
                <Text style={tw`text-xs text-white`}>{tab.name}</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.name}
              style={tw`items-center`}
              onPress={() => replaceWithLock(router, tab.href)}
            >
              {tab.icon(color)}
              <Text
                style={tw`${
                  isActive ? "text-[#0FF1CF]" : "text-white"
                } text-xs`}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Add Tab Bottom Sheet */}
      <BottomSheet
        index={-1}
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={() => setSheetMode("root")}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={0}
            appearsOnIndex={1}
          />
        )}
        backgroundStyle={{ backgroundColor: "#01082E" }}
      >
        <BottomSheetScrollView style={tw`px-5`}>
          <View style={tw`p-5 gap-4`}>
            {sheetMode === "root" ? (
              <>
                <TouchableOpacity
                  style={tw`rounded-3xl bg-[#101C45] p-5`}
                  onPress={() => setSheetMode("eventType")}
                >
                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center gap-3`}>
                      <View style={tw`h-12 w-12 items-center justify-center rounded-full bg-[#0FF1CF]/15`}>
                        <Ionicons
                          name="sparkles-outline"
                          size={22}
                          color="#0FF1CF"
                        />
                      </View>
                      <View>
                        <Text style={tw`text-base font-semibold text-white`}>
                          New Event
                        </Text>
                        <Text style={tw`mt-1 text-sm text-[#98ABD6]`}>
                          Choose event type
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="white" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={tw`rounded-3xl bg-[#0FF1CF] p-5`}
                  onPress={guardedCreateCarpool}
                >
                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center gap-3`}>
                      <View style={tw`h-12 w-12 items-center justify-center rounded-full bg-[#03122F]`}>
                        <Ionicons
                          name="car-sport-outline"
                          size={22}
                          color="#0FF1CF"
                        />
                      </View>
                      <View>
                        <Text style={tw`text-base font-semibold text-[#03122F]`}>
                          New Carpool
                        </Text>
                        <Text style={tw`mt-1 text-sm text-[#194949]`}>
                          Create a shared ride
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#03122F"
                    />
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={tw`self-start rounded-full bg-[#101C45] px-4 py-2`}
                  onPress={() => setSheetMode("root")}
                >
                  <Text style={tw`text-sm font-semibold text-white`}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={tw`rounded-3xl border border-[#FF6B6B]/30 bg-[#2A1022] p-5`}
                  onPress={guardedCreateDonationEvent}
                >
                  <View style={tw`flex-row items-center gap-4`}>
                    <View style={tw`h-12 w-12 items-center justify-center rounded-full bg-[#FF6B6B]/15`}>
                      <Ionicons name="heart-outline" size={22} color="#FF8A8A" />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-base font-semibold text-white`}>
                        Donation Event
                      </Text>
                      <Text style={tw`mt-1 text-sm leading-5 text-[#F1B3C2]`}>
                        100% of every donation goes directly to the selected cause.
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={tw`rounded-3xl border border-[#0FF1CF]/20 bg-[#101C45] p-5`}
                  onPress={guardedCreateGeneralEvent}
                >
                  <View style={tw`flex-row items-center gap-4`}>
                    <View style={tw`h-12 w-12 items-center justify-center rounded-full bg-[#0FF1CF]/15`}>
                      <Ionicons
                        name="calendar-outline"
                        size={22}
                        color="#0FF1CF"
                      />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-base font-semibold text-white`}>
                        Other Event
                      </Text>
                      <Text style={tw`mt-1 text-sm leading-5 text-[#98ABD6]`}>
                        Tickets or paid registrations with a selectable impact share. Perfect for offering a service with impact in mind
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}
