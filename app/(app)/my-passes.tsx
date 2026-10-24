import UserPassesTab from "@/components/UserPassesTab";
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import { useAppTheme } from "@/hooks/useAppTheme";
import { safeGoBack, useLockedRouter } from "@/utils/navigation";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyPassesPage() {
  const { tw } = useAppTheme();
  const router = useLockedRouter();
  return (
    <SafeAreaView edges={["top"]} style={tw`flex-1 w-full max-w-[840px] self-center px-5 bg-background dark:bg-[#01082E]`}>
      <CustomeTopBarNav title="My passes" onClickBack={() => safeGoBack(router, "/profile")} />
      <UserPassesTab />
    </SafeAreaView>
  );
}
