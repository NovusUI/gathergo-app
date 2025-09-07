import { Image, Text, TouchableOpacity } from "react-native";




interface CustomButtonProps {
  onPress: () => void;
  disabled?: boolean; // new prop
}

const GoogleLoginBtn = ({onPress,disabled=false}:CustomButtonProps) => {
  return (
    <TouchableOpacity 
    onPress={!disabled ? onPress : undefined}
    activeOpacity={disabled ? 1 : 0.7}  
    className="rounded-xl bg-[#1B2A50] flex flex-row w-full max-w-[500px] p-3 items-center justify-center gap-5">
        <Image source={require("../../assets/images/googleicon.png")}/>
        <Text className="text-white">Login with Google</Text>
    </TouchableOpacity>
  )
}

export default GoogleLoginBtn
