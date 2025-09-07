import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface CustomButtonProps {
  onPress: () => void;
  title?: string;
  showArrow?: boolean;
  arrowCircleColor?: string;
  buttonClassName?: string;
  textClassName?: string;
  arrowClassName?: string;
  arrowText?: string;
  disabled?: boolean; // new prop
}

const CustomButton: React.FC<CustomButtonProps> = ({
  onPress,
  title = 'GET STARTED',
  showArrow = true,
  arrowCircleColor = 'bg-white',
  buttonClassName = '',
  textClassName = '',
  arrowClassName = '',
  arrowText = '→',
  disabled = false, // default
}: CustomButtonProps) => {
  return (
    <TouchableOpacity
    

      className={`
        flex-row justify-center items-center border border-white rounded-xl w-[300px] p-5 max-w-[500px] 
        ${buttonClassName} 
        ${disabled ? 'opacity-50' : 'opacity-100'}
        
      `}
      onPress={!disabled ? onPress : undefined}
      activeOpacity={disabled ? 1 : 0.7} // optional: prevents feedback when disabled
    >
      <Text className={`text-white font-bold mr-2 uppercase ${textClassName}`}>
        {title}
      </Text>

      {showArrow && (
        <View className={`w-8 h-8 rounded-full ${arrowCircleColor} justify-center items-center absolute right-5 ${arrowClassName}`}>
          <Text className="text-white text-lg">{arrowText}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default CustomButton;
