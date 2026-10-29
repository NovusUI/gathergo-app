import { Share } from "react-native";
import { useShortShareLink } from "@/services/queries";
import { showGlobalError } from "@/utils/globalErrorHandler";

export function useCarpoolShare(carpoolId: string, enabled: boolean) {
  const query = useShortShareLink("carpool", carpoolId, enabled);
  const share = async () => {
    if (query.isError) {
      await query.refetch();
      return;
    }
    if (!query.data) return;
    try {
      await Share.share({ message: `🚗 Join my carpool 👉 ${query.data}` });
    } catch {
      showGlobalError("Could not share this ride. Please try again.");
    }
  };
  return { share, isPending: query.isPending, isError: query.isError };
}
