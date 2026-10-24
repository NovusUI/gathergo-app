import { useAppTheme } from "@/hooks/useAppTheme";
import AppLoader from "@/components/ui/AppLoader";
import { useSocket } from "@/context/SocketContext";
import { Send } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  NativeSyntheticEvent,
  Pressable,
  TextInput,
  TextInputContentSizeChangeEventData,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  value: string;
  setValue: (text: string) => void;
  sending: boolean;
  onSend: () => void;
  onFocus?: () => void;
  carpoolId: string;
  disabled: boolean;
}

let typingTimeout: ReturnType<typeof setTimeout> | null = null;

const ChatInput = ({
  value,
  setValue,
  sending,
  onSend,
  onFocus,
  carpoolId,
  disabled,
}: Props) => {
  const { tw, color } = useAppTheme();
  const { socket } = useSocket();
  const inputRef = useRef<TextInput>(null);
  const [inputHeight, setInputHeight] = useState(40); // default height
  const MAX_HEIGHT = 120; // maximum height in px

  const focusInput = () => {
    if (!disabled) {
      onFocus?.();
      inputRef.current?.focus();
    }
  };

  const handleFocus = () => {
    if (!disabled) {
      onFocus?.();
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
          tw`w-full flex-row items-end px-2 py-2 rounded-2xl border`,
          disabled
            ? tw`bg-surfaceMuted/30 dark:bg-[#2A3A5A]/30 border-border/30 dark:border-[#455479]/30`
            : tw`bg-surface dark:bg-[#01082E] border-borderStrong dark:border-[#1B2A50]`,
        ]}
      >
        <TextInput
          accessibilityLabel="Message"
          autoCapitalize="none"
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
            disabled ? tw`text-muted dark:text-gray-400` : tw`text-foreground dark:text-white`,
          ]}
          placeholder={disabled ? "Chat is disabled" : "Message"}
          placeholderTextColor={disabled ? color("#6B7280", "muted") : color("#9CA3AF", "muted")}
          value={value}
          onChangeText={handleInputChange}
          multiline
          onFocus={handleFocus}
          onContentSizeChange={handleContentSizeChange}
          editable={!disabled}
          selectTextOnFocus={!disabled}
        />

        <TouchableOpacity
          style={[
            tw`rounded-full ml-2 w-10 h-10 items-center justify-center self-end`,
            disabled || sending || value.trim().length === 0
              ? tw`bg-surfaceRaised/30 dark:bg-[#455479]/30`
              : tw`bg-accentFill dark:bg-[#0FF1CF]`,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          onPress={handleSend}
          disabled={sending || disabled || value.trim().length === 0}
        >
          {!sending && (
            <Send
              color={
                disabled || value.trim().length === 0 ? color("#ffffff", "foreground") : color("#01082E", "onAccent")
              }
            />
          )}
          {sending && (
            <AppLoader
              color={color("#FFFFFF", "foreground")}
              size={24}
              accessibilityLabel="Sending message"
            />
          )}
        </TouchableOpacity>
      </View>
    </Pressable>
  );
};

export default ChatInput;
