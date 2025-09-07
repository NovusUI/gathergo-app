import { Text, View } from "react-native"

export const EventDetails = ({title, subtitle}:{title:string,subtitle:string})=>{
    return (
        <View className="gap-2">
            <Text className="capitalize text-[#8E8E8E] text-sm">{title}</Text>
            <Text className="text-white">{subtitle}</Text>
        </View>
    )
}