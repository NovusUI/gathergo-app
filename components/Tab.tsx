import { Text, TouchableOpacity } from "react-native";


interface Props {
    title:string;
    isActive:boolean;
    className: string;
    onPress:()=>void
    key: number

}

const Tab = ({isActive,title,className,onPress,key}:Props) => {
  return (
    <TouchableOpacity key={key} onPress={onPress} className={`flex flex-row justify-center items-center gap-2 rounded-xl h-10 ${isActive ? "bg-[#0FF1CF]":"bg-[#01082E] "}  ${className}`}>
        <Text className={`${isActive ?'text-black':'text-[#0FF1CF]'}`}>{title}</Text>
    </TouchableOpacity>
      

  )
}

export default Tab
