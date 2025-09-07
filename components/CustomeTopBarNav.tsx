import { ArrowLeft } from 'lucide-react-native';
import { Image, Text, TouchableOpacity, View } from "react-native";


interface Props {
    title:string;
    onClickBack:()=>void;
    rightIcon?: any;
    rightText?: string;
    onClickRight?: ()=>void;
}

const CustomeTopBarNav = ({
 title,
 onClickBack,
 onClickRight,
 rightIcon,
 rightText,

}:Props) => {
  return (
    <View className="flex flex-row justify-between items-center w-full max-w-[500px]">
        <View className="flex flex-row items-center gap-8">
            <TouchableOpacity onPress={onClickBack}>
                <ArrowLeft color={'white'}/>
            </TouchableOpacity>
            <Text className='text-white'>{title}</Text>
            
        </View>
        <TouchableOpacity onPress={onClickRight}>
                {
                    rightIcon && <Image source={rightIcon}/>
                }
                {
                    rightText && <Text className='text-white'>{rightText}</Text>
                }
            </TouchableOpacity>

    </View>
      

  )
}

export default CustomeTopBarNav
