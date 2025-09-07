import { ReactNode } from 'react';
import { View } from 'react-native';

interface CustomViewProps {
  children?: ReactNode;
  className?: string;
}

const CustomView = ({ children, className }: CustomViewProps) => {
  return (
    <View className={` w-full max-w-[500px] my-2  ${className || ''}`}>
      {children}
    </View>
  );
};

export default CustomView;
