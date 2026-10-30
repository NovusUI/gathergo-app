import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useClaimMeal, useMealPass, useFoodBankCollection } from "@/hooks/useFoodBank";
import CollectionControls from "@/components/foodBank/CollectionControls";
import InfoDisclosure from "@/components/ui/InfoDisclosure";
import { useEventDetails } from "@/services/queries";
import { safeGoBack, useLockedRouter } from "@/utils/navigation";
import { getApiErrorMessage } from "@/utils/apiError";
import { showGlobalError } from "@/utils/globalErrorHandler";
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomButton from "@/components/buttons/CustomBtn1";
import ImpactPageLoader from "@/components/ui/ImpactPageLoader";
import { formatEventDateTime } from "@/utils/dateTimeHandler";

export default function FoodBankPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useLockedRouter();
  const { tw, color } = useAppTheme();
  const event = useEventDetails(id);
  const isFoodBank = event.data?.data.registrationType === "foodbank";
  const meal = useMealPass(id, isFoodBank);
  const collection = useFoodBankCollection(id, isFoodBank);
  const claim = useClaimMeal(id);
  const openPass = (passId: string) =>
    router.replace(
      `/transaction/${passId}?type=MEAL&eventId=${encodeURIComponent(id)}`,
    );
  const collect = async () => {
    if (claim.isPending || !meal.isSuccess) return;
    if (meal.data.data) {
      openPass(meal.data.data.id);
      return;
    }
    if (!collection.data?.data.canReserve) return;
    try {
      const response = await claim.mutateAsync();
      openPass(response.data.id);
    } catch (error) {
      showGlobalError(
        getApiErrorMessage(
          error,
          "Could not reserve a collection window. Please try again.",
        ),
      );
    }
  };
  const canDonate = event.data
    ? new Date(event.data.data.endDate).getTime() > Date.now()
    : false;
  return (
    <SafeAreaView style={tw`flex-1 bg-background dark:bg-[#01082E]`}>
      <ScrollView
        contentContainerStyle={tw`p-5 gap-6 w-full max-w-[600px] self-center pb-12`}
      >
        <CustomeTopBarNav
          title="Food bank"
          onClickBack={() => safeGoBack(router, "/")}
        />
        {event.isPending ? (
          <ImpactPageLoader />
        ) : event.isError ? (
          <CustomButton
            title="Retry loading food bank"
            onPress={() => void event.refetch()}
            showArrow={false}
          />
        ) : !isFoodBank ? (
          <Text style={tw`text-foreground dark:text-white`}>
            This event is not a food bank.
          </Text>
        ) : event.data ? (
          <>
            <View
              style={tw`rounded-3xl bg-surface dark:bg-[#101C45] p-6 gap-4`}
            >
              <Ionicons
                name="restaurant-outline"
                size={36}
                color={color("#0FF1CF", "accent")}
              />
              <Text
                style={tw`text-foreground dark:text-white text-3xl font-semibold`}
              >
                {event.data.data.title}
              </Text>
              <Text style={tw`text-secondary dark:text-[#AFC0F4] leading-6`}>
                A place at the table for everyone.
              </Text>
              <Text style={tw`text-foreground dark:text-white`}>
                {event.data.data.location}
              </Text>
              <Text style={tw`text-secondary dark:text-[#AFC0F4]`}>
                {formatEventDateTime(
                  event.data.data.startDate,
                  event.data.data.endDate,
                  collection.data?.data.timeZone,
                )}
              </Text>
            </View>
            {collection.data ? (
              <CollectionControls eventId={id} collection={collection.data.data} />
            ) : collection.isError ? (
              <CustomButton title="Retry loading collection" onPress={() => void collection.refetch()} showArrow={false} />
            ) : null}
            <Text
              style={tw`text-foreground dark:text-white text-xl font-semibold`}
            >
              {meal.data?.data
                ? "Your meal pass is ready"
                : "Collect a meal"}
            </Text>
            {meal.isError ? (
              <CustomButton
                title="Retry checking your meal pass"
                onPress={() => void meal.refetch()}
                showArrow={false}
              />
            ) : (
              <CustomButton
                buttonClassName="bg-accentFill dark:bg-[#0FF1CF] border-0"
                textClassName="!text-onAccent dark:text-black"
                title={
                  meal.isPending
                    ? "Checking your pass…"
                    : claim.isPending
                      ? "Reserving collection window…"
                      : meal.data?.data
                        ? "View meal pass"
                        : collection.isPending
                          ? "Checking collection…"
                          : !collection.data?.data.canReserve
                            ? "Reservations closed"
                            : "Continue without donating"
                }
                disabled={
                  meal.isPending ||
                  claim.isPending ||
                  (!meal.data?.data && !collection.data?.data.canReserve)
                }
                onPress={() => void collect()}
                showArrow={false}
              />
            )}
            {canDonate ? (
              <CustomButton
                title={meal.data?.data ? "Donate again" : collection.data?.data.canReserve ? "Donate and collect" : "Support with a donation"}
                onPress={() =>
                  router.push(`/event/${id}?donate=1&donationSource=FOOD_BANK`)
                }
                disabled={claim.isPending}
                showArrow={false}
              />
            ) : null}
            <InfoDisclosure
              label="Donations are optional"
              message="Everyone receives the same meal pass, whether or not they donate, while collection windows are available. A donation supports the food bank and is not a payment for food. Additional donations do not issue another pass. Your pass includes a suggested arrival window. The team can serve you earlier or later while collection is open."
            />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
