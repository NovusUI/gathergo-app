import { usePressGuard } from "@/hooks/usePressGuard";
import LocalSvgAsset from "@/components/ui/LocalSvgAsset";
import { Text, TouchableOpacity } from "react-native";
import tw from "twrnc";

interface CustomButtonProps {
  onPress: () => void | Promise<void>;
  disabled?: boolean;
}

const GoogleLoginBtn = ({ onPress, disabled = false }: CustomButtonProps) => {
  const guardedOnPress = usePressGuard(onPress);

  return (
    <TouchableOpacity
      onPress={!disabled ? guardedOnPress : undefined}
      activeOpacity={disabled ? 1 : 0.7}
      style={tw.style(
        "rounded-xl bg-[#1B2A50] flex-row items-center justify-center p-3",
        { width: "100%", maxWidth: 500, gap: 20 } // gap-5 ≈ 20px
      )}
    >
      <LocalSvgAsset name="googleicon" width={26} height={26} />
      <Text style={tw`text-white`}>Login with Google</Text>
    </TouchableOpacity>
  );
};

export default GoogleLoginBtn;
