import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useRef } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";
import tw from "twrnc";

interface TextAreaProps extends TextInputProps {
  value: string;
  onChange: (text: string) => void;
  maxLength?: number;
  placeholder?: string;
  error?: string;
  className?: string;
  insideBottomSheet?: boolean;
}

export default function TextArea({
  value,
  onChange,
  maxLength = 300,
  placeholder = "Write something about yourself...",
  error,
  className = "",
  insideBottomSheet = false,
  ...props
}: TextAreaProps) {
  const inputRef = useRef<TextInput | null>(null);
  const InputComponent = insideBottomSheet ? BottomSheetTextInput : TextInput;

  return (
    <View style={tw`w-full`}>
      <Pressable onPress={() => inputRef.current?.focus()}>
        <InputComponent
          ref={inputRef}
          style={tw.style(
            `w-full min-h-[120px] rounded-2xl bg-[#1B2A50]/40 text-white p-4 text-base`,
            error && `border border-red-500`,
            className
          )}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChange}
          multiline
          maxLength={maxLength}
          textAlignVertical="top"
          {...props}
        />
      </Pressable>
      <Text style={tw`text-right text-sm text-gray-400 mt-1`}>
        {value?.length || 0}/{maxLength}
      </Text>
      {Boolean(error) && (
        <Text style={tw`text-red-400 text-sm mt-1`}>{error}</Text>
      )}
    </View>
  );
}
