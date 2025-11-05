import { useRef } from "react";
import {
  Image,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const ChatInput = () => {
  const inputRef = useRef<TextInput>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <TouchableWithoutFeedback onPress={focusInput}>
      <View className="w-full flex-row justify-between items-center p-2 rounded-full bg-[#1B2A50]/60">
        <TextInput
          ref={inputRef}
          className="pl-10 flex-1 text-white"
          placeholder="Message"
          placeholderTextColor="#9CA3AF"
          value=""
          onChangeText={() => {}}
        />
        <TouchableOpacity className="rounded-full p-3 bg-[#455479]">
          <Image source={require("../../assets/sendicon.png")} />
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ChatInput;
