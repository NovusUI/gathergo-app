import { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useMealPass } from "@/hooks/useFoodBank";
import { useLockedRouter } from "@/utils/navigation";
import CustomButton from "@/components/buttons/CustomBtn1";
import InfoDisclosure from "@/components/ui/InfoDisclosure";
import MealPassCard from "./MealPassCard";
import type { EventDetails } from "@/types/event";

export default function MealPassAccess({ event }: { event: EventDetails }) {
  const { tw, color } = useAppTheme();
  const router = useLockedRouter();
  const [open, setOpen] = useState(false);
  const query = useMealPass(event.id);
  const pass = query.data?.data;
  const donationsClosed = new Date(event.endDate).getTime() <= Date.now();
  return (
    <View style={tw`gap-3`}>
      {query.isError ? (
        <CustomButton
          title="Retry loading meal pass"
          onPress={() => void query.refetch()}
          showArrow={false}
        />
      ) : query.isPending ? (
        <Text style={tw`text-secondary dark:text-[#AFC0F4] text-center`}>
          Checking your collection pass…
        </Text>
      ) : pass ? (
        <CustomButton
          title="View meal pass"
          showArrow={false}
          onPress={() => setOpen(true)}
        />
      ) : (
        <Text
          style={tw`text-secondary dark:text-[#AFC0F4] text-center leading-5`}
        >
          No collection pass is available. Collection windows may be full or
          closed. Your donation still supports the food bank.
        </Text>
      )}
      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView style={tw`flex-1 bg-background dark:bg-[#01082E]`}>
          <ScrollView
            contentContainerStyle={tw`p-5 gap-5 w-full max-w-[600px] self-center`}
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close meal pass"
              style={tw`self-end p-3`}
              onPress={() => setOpen(false)}
            >
              <Ionicons
                name="close"
                size={24}
                color={color("white", "foreground")}
              />
            </TouchableOpacity>
            {pass ? (
              <MealPassCard
                pass={pass}
                title={event.title}
                location={event.location}
              />
            ) : null}
            <CustomButton
              title={donationsClosed ? "Donations closed" : "Donate again"}
            disabled={donationsClosed}
              onPress={() => {
                setOpen(false);
                router.push(`/event/${event.id}?donate=1`);
              }}
              showArrow={false}
            />
            <InfoDisclosure
              label="Donation info"
              message="Donations support this food bank. Additional donations do not issue another meal pass."
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
