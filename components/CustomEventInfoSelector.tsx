import { ArrowRight } from 'lucide-react-native'
import { Text, TouchableOpacity, View } from 'react-native'



interface Props {
    title: string
    value: string
    onPress: ()=>void
}

const CustomEventInfoSelector = ({title,value, onPress}:Props) => {
  return (
    <TouchableOpacity onPress={onPress} className=' flex flex-row items-center justify-between p-5 bg-[#1B2A50]/40 rounded-2xl'>
        <Text className='text-white capitalize'>{title}</Text>
        {!value && <View className='rounded-full p-2 bg-[#070E30]'>
            <ArrowRight color="white"/>
        </View>}
        {value &&<Text className="text-gray-300">
        {typeof value === "string" ? value : JSON.stringify(value)}
      </Text>}
    </TouchableOpacity>
  )
}

export default CustomEventInfoSelector
