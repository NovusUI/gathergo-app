import EventsOverview from "@/components/EventsOverview";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ImpactPageLoader from "@/components/ui/ImpactPageLoader";
import Payments from "@/components/ui/Payments";
import WalletSetupReminder from "@/components/ui/WalletSetupReminder";
import { useDashboardData, useShortcut } from "@/hooks/useDashboard";
import { useWalletOnboarding } from "@/services/queries";
import { safeGoBack, useLockedRouter } from "@/utils/navigation";

export default function Dashboard() {
  const router = useLockedRouter();
  const { isLoading, data } = useDashboardData();
  const { data: onboarding } = useWalletOnboarding();
  const { data: shortcuts } = useShortcut();

  return (
    <DashboardLayout
      title="Dashboard"
      onBack={() => safeGoBack(router, "/")}
      shortcuts={shortcuts?.data.shortcuts ?? []}
      loading={isLoading ? (
        <ImpactPageLoader title="Mapping your dashboard" message="Loading your events, attendance, and payments." />
      ) : undefined}
      header={onboarding?.data.showPersistentAlert ? (
        <WalletSetupReminder nextAction={onboarding.data.nextAction} onPress={() => router.push("/wallet")} />
      ) : null}
      secondary={<Payments payments={data?.data.payments ?? []} />}
    >
      <EventsOverview initialEvents={data?.data.events} />
    </DashboardLayout>
  );
}
