import { Redirect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useResolvedShortLink } from "@/services/queries";
import { buildShareTargetRoute } from "@/utils/shareLinks";
import { useLockedRouter } from "@/utils/navigation";
import CustomButton from "@/components/buttons/CustomBtn1";
import ImpactPageLoader from "@/components/ui/ImpactPageLoader";

export default function SharedLinkPage() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const query = useResolvedShortLink(code);
  const { tw } = useAppTheme();
  const router = useLockedRouter();
  if (query.data) {
    const { kind, targetId } = query.data.data;
    return <Redirect href={buildShareTargetRoute(kind, targetId)} />;
  }
  return (
    <SafeAreaView style={tw`flex-1 bg-background dark:bg-[#01082E]`}>
      {query.isPending ? (
        <ImpactPageLoader />
      ) : (
        <View
          style={tw`flex-1 justify-center px-6 gap-4 w-full max-w-[600px] self-center`}
        >
          <Text
            style={tw`text-foreground dark:text-white text-xl font-semibold`}
          >
            Couldn’t open this link
          </Text>
          <Text style={tw`text-secondary dark:text-[#AFC0F4] leading-6`}>
            The link may no longer be available, or your connection may be
            interrupted.
          </Text>
          <CustomButton
            title="Try again"
            onPress={() => void query.refetch()}
            showArrow={false}
          />
          <CustomButton
            title="Go home"
            onPress={() => router.replace("/")}
            showArrow={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
