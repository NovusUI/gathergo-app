import { useCheckoutCountdown } from "@/hooks/useCheckoutCountdown";
import { Text } from "react-native";
import tw from "twrnc";

export function CheckoutCountdown({
  deadlineMs,
}: {
  deadlineMs: number | null;
}) {
  const seconds = useCheckoutCountdown(deadlineMs);
  if (seconds === null) return null;
  return (
    <Text style={tw`px-4 py-3 text-center text-[#FFD76A]`}>
      {seconds === 0
        ? "Your hold has expired. If you paid, check payment status."
        : `Reserved for ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}
    </Text>
  );
}
