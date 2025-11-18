// app/_layout.tsx
import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";

import { Link, Stack, usePathname, useRouter } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

export default function RootLayout() {
  const pathname = usePathname();
  const router = useRouter();

  // Bottom sheet setup
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["25"], []);
  const openSheet = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  const tabs = [
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
      href: "",
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
    <View style={tw`flex-1 bg-black`}>
      <Stack screenOptions={{ headerShown: false }} />

      {/* Bottom Nav */}
      <View
        style={tw`absolute bottom-0 left-0 right-0 flex-row justify-around bg-[#01082E] py-4 border-t border-gray-800`}
      >
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const color = isActive ? "#0FF1CF" : "white";

          if (tab.name === "New") {
            return (
              <TouchableOpacity
                key={tab.name}
                style={tw`items-center`}
                onPress={openSheet}
              >
                {tab.icon(color)}
                <Text style={tw`text-xs text-white`}>{tab.name}</Text>
              </TouchableOpacity>
            );
          }

          return (
            <Link key={tab.name} href={tab.href} asChild>
              <TouchableOpacity style={tw`items-center`}>
                {tab.icon(color)}
                <Text
                  style={tw`${
                    isActive ? "text-[#0FF1CF]" : "text-white"
                  } text-xs`}
                >
                  {tab.name}
                </Text>
              </TouchableOpacity>
            </Link>
          );
        })}
      </View>

      {/* Add Tab Bottom Sheet */}
      <BottomSheet
        index={-1}
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
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
            <TouchableOpacity
              style={tw`p-4 bg-[#0FF1CF] rounded-xl items-center`}
              onPress={() => {
                bottomSheetRef.current?.close();
                router.push("/new-event");
              }}
            >
              <Text style={tw`text-black font-semibold`}>Create New Event</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`p-4 bg-[#0FF1CF] rounded-xl items-center`}
              onPress={() => {
                bottomSheetRef.current?.close();
                router.push("/new-carpool");
              }}
            >
              <Text style={tw`text-black font-semibold`}>
                Create New Carpool
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}
