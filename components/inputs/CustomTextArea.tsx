import { Text, TextInput, View } from "react-native";

interface TextAreaProps {
  value: string;
  onChange: (text: string) => void;
  maxLength?: number;
  placeholder?: string;
  error?: string;
  className?:string
}

export default function TextArea({
  value,
  onChange,
  maxLength = 300,
  placeholder = "Write something about yourself...",
  error,
  className
}: TextAreaProps) {
 

  return (
    <View className="w-full">
      <TextInput
        className={` w-full min-h-[120px] rounded-2xl bg-[#1B2A50]/40 text-white p-4 text-base ${
          error ? "border border-red-500" : "" 
        } ${className}`}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChange}
        multiline
        maxLength={maxLength}
        textAlignVertical="top"
      />
      <Text className="text-right text-sm text-gray-400 mt-1">
        {value?.length || 0}/{maxLength}
      </Text>
      {error && <Text className="text-red-400 text-sm mt-1">{error}</Text>}
    </View>
  );
}
