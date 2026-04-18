import { useSocket } from "@/context/SocketContext";
import { LoaderCircle, Send } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  NativeSyntheticEvent,
  Pressable,
  TextInput,
  TextInputContentSizeChangeEventData,
  TouchableOpacity,
  View
} from "react-native";
import tw from "twrnc";

interface Props {
  value: string;
  setValue: (text: string) => void;
  sending: boolean;
  onSend: () => void;
  carpoolId: string;
  disabled: boolean;
}

let typingTimeout: ReturnType<typeof setTimeout> | null = null;

const ChatInput = ({
  value,
  setValue,
  sending,
  onSend,
  carpoolId,
  disabled,
}: Props) => {
  const { socket } = useSocket();
  const inputRef = useRef<TextInput>(null);
  const [inputHeight, setInputHeight] = useState(40); // default height
  const MAX_HEIGHT = 120; // maximum height in px

  const focusInput = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  const handleContentSizeChange = (
    event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>
  ) => {
    const { height } = event.nativeEvent.contentSize;
    setInputHeight(Math.min(height + 10, MAX_HEIGHT));
  };

  const handleInputChange = (text: string) => {
    setValue(text);

    if (!socket || disabled) return;

    socket.emit("typing", { carpoolId, isTyping: true });

    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit("typing", { carpoolId, isTyping: false });
    }, 2000);
  };

  const handleSend = () => {
    if (!disabled) {
      onSend();
    }
  };

  return (
    <Pressable onPress={focusInput}>
      <View
        style={[
          tw`w-full flex-row items-end px-2 py-2 rounded-2xl`,
          disabled ? tw`bg-[#2A3A5A]/30` : tw`bg-[#1B2A50]/60`,
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[
            tw`pl-3 pr-2 flex-1 text-base`,
            {
              minHeight: 40,
              height: Math.max(40, inputHeight),
              maxHeight: MAX_HEIGHT,
              paddingTop: 10,
              paddingBottom: 10,
            },
            disabled ? tw`text-gray-400` : tw`text-white`,
          ]}
          placeholder={disabled ? "Chat is disabled" : "Message"}
          placeholderTextColor={disabled ? "#6B7280" : "#9CA3AF"}
          value={value}
          onChangeText={handleInputChange}
          multiline
          onContentSizeChange={handleContentSizeChange}
          editable={!disabled}
          selectTextOnFocus={!disabled}
        />

        <TouchableOpacity
          style={[
            tw`rounded-full ml-2 w-10 h-10 items-center justify-center self-end`,
            disabled || sending || value.trim().length === 0
              ? tw`bg-[#455479]/30`
              : tw`bg-[#455479]`,
          ]}
          onPress={handleSend}
          disabled={sending || disabled || value.trim().length === 0}
        >
          {!sending && (

            <Send color={"#ffffff"}/>
            
          )}
          {sending && (
            <LoaderCircle color={disabled ? "#6B7280" : "#fff"} size={20} />
          )}
        </TouchableOpacity>
      </View>
    </Pressable>
  );
};

export default ChatInput;
