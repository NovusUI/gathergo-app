import { Image, Text, TouchableOpacity } from "react-native";
import tw from "twrnc";

interface CustomButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

const GoogleLoginBtn = ({ onPress, disabled = false }: CustomButtonProps) => {
  return (
    <TouchableOpacity
      onPress={!disabled ? onPress : undefined}
      activeOpacity={disabled ? 1 : 0.7}
      style={tw.style(
        "rounded-xl bg-[#1B2A50] flex-row items-center justify-center p-3",
        { width: "100%", maxWidth: 500, gap: 20 } // gap-5 ≈ 20px
      )}
    >
      <Image source={require("../../assets/images/googleicon.png")} />
      <Text style={tw`text-white`}>Login with Google</Text>
    </TouchableOpacity>
  );
};

export default GoogleLoginBtn;
