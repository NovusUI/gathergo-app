import { ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useEventDetails } from "@/services/queries";
import { useMealPass } from "@/hooks/useFoodBank";
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomButton from "@/components/buttons/CustomBtn1";
import ImpactPageLoader from "@/components/ui/ImpactPageLoader";
import { safeGoBack, useLockedRouter } from "@/utils/navigation";
import MealPassAccess from "./MealPassAccess";

export default function MealPassReceipt({
  eventId,
  passId,
}: {
  eventId: string;
  passId: string;
}) {
  const { tw } = useAppTheme();
  const router = useLockedRouter();
  const event = useEventDetails(eventId, { enabled: Boolean(eventId) });
  const pass = useMealPass(eventId);
  return (
    <SafeAreaView style={tw`flex-1 bg-background dark:bg-[#01082E]`}>
      <ScrollView
        contentContainerStyle={tw`p-5 gap-6 w-full max-w-[600px] self-center`}
      >
        <CustomeTopBarNav
          title="Collection details"
          onClickBack={() => safeGoBack(router, "/")}
        />
        {event.isPending || pass.isPending ? (
          <ImpactPageLoader />
        ) : event.isError || pass.isError ? (
          <CustomButton
            title="Retry loading collection"
            onPress={() => {
              void event.refetch();
              void pass.refetch();
            }}
            showArrow={false}
          />
        ) : event.data && pass.data?.data?.id === passId ? (
          <>
            <Text
              style={tw`text-foreground dark:text-white text-2xl font-semibold`}
            >
              Your collection pass
            </Text>
            <Text style={tw`text-secondary dark:text-[#AFC0F4] leading-6`}>
              {event.data.data.title}. Open your pass for your QR code and
              assigned collection time.
            </Text>
            <MealPassAccess event={event.data.data} />
            <CustomButton
              title="Open event"
              onPress={() => router.push(`/event/${eventId}`)}
              showArrow={false}
            />
          </>
        ) : (
          <Text style={tw`text-foreground dark:text-white`}>
            This collection pass is unavailable.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
