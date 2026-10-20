import CustomButton from "@/components/buttons/CustomBtn1";
import { useVolunteerAction } from "@/services/mutations";
import type { VolunteerApplication } from "@/types/volunteer";
import { showGlobalSuccess } from "@/utils/globalErrorHandler";
import { canWithdrawApplication } from "@/utils/volunteer";

export default function WithdrawApplicationButton({
  application,
  startDate,
}: {
  application: VolunteerApplication;
  startDate: string;
}) {
  const mutation = useVolunteerAction(application.eventId, {
    onSuccess: () => showGlobalSuccess("Volunteer application withdrawn."),
  });
  if (!canWithdrawApplication(application, startDate)) return null;

  return (
    <CustomButton
      showArrow={false}
      disabled={mutation.isPending}
      title={mutation.isPending ? "Withdrawing…" : "Withdraw application"}
      buttonClassName="w-full border-[#FF8A8A]/50 bg-[#2C1737]"
      textClassName="!text-[#FF8A8A] shrink"
      onPress={() =>
        mutation.mutate({ type: "withdraw", applicationId: application.id })
      }
    />
  );
}
