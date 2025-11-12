import { useSocket } from "@/context/SocketContext";
import { LoaderCircle } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  Image,
  NativeSyntheticEvent,
  TextInput,
  TextInputContentSizeChangeEventData,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface Props {
  value: string;
  setValue: (text: string) => void;
  sending: boolean;
  onSend: () => void;
  carpoolId: string;
}

let typingTimeout: ReturnType<typeof setTimeout> | null = null;

const ChatInput = ({ value, setValue, sending, onSend, carpoolId }: Props) => {
  const { socket } = useSocket();
  const inputRef = useRef<TextInput>(null);
  const [inputHeight, setInputHeight] = useState(40); // default height
  const MAX_HEIGHT = 120; // maximum height in px

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const handleContentSizeChange = (
    event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>
  ) => {
    const { height } = event.nativeEvent.contentSize;
    // Limit height growth
    setInputHeight(Math.min(height + 10, MAX_HEIGHT));
  };

  const handleInputChange = (value: string) => {
    setValue(value);

    if (!socket) return;

    socket.emit("typing", { carpoolId, isTyping: true });

    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit("typing", { carpoolId, isTyping: false });
    }, 2000);
  };
  return (
    <TouchableWithoutFeedback onPress={focusInput}>
      <View className="w-full flex-row items-end p-2 rounded-full bg-[#1B2A50]/60">
        <TextInput
          ref={inputRef}
          className="pl-4 pr-3 flex-1 text-white text-base"
          placeholder="Message"
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={handleInputChange}
          multiline
          onContentSizeChange={handleContentSizeChange}
          style={{
            height: Math.max(40, inputHeight),
            maxHeight: MAX_HEIGHT,
          }}
        />

        <TouchableOpacity
          className="rounded-full p-3 bg-[#455479] ml-2"
          onPress={onSend}
          disabled={sending}
        >
          {!sending && (
            <Image
              source={require("../../assets/sendicon.png")}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            />
          )}
          {sending && <LoaderCircle color="#fff" size={20} />}
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ChatInput;
