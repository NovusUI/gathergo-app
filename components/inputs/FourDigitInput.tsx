import { useRef, useState } from "react";
import { NativeSyntheticEvent, TextInput, TextInputKeyPressEventData, View } from "react-native";

export default function FourDigitCodeInput({
  onChange,
  onComplete,
}: {
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
}) {
  const [code, setCode] = useState(["", "", "", ""]);
  const inputsRef = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, "");
    const newCode = [...code];

    // If user pasted multiple digits
    if (cleanText.length > 1) {
      const chars = cleanText.split("").slice(0, 4);
      chars.forEach((c, i) => (newCode[i] = c));
      setCode(newCode);
      onChange(chars.join(""));
      if (chars.length === 4) onComplete?.(chars.join(""));
      return;
    }

    newCode[index] = cleanText;
    setCode(newCode);
    onChange(newCode.join(""));

    if (cleanText && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newCode.join("").length === 4) {
      onComplete?.(newCode.join(""));
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <View className="flex-row justify-between w-full max-w-96">
      {code.map((digit, idx) => (
        <TextInput
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          className="w-14 h-14 bg-[#1B2A50]/40 text-white text-center text-xl rounded-xl"
          keyboardType="number-pad"
          maxLength={1}
          textContentType="oneTimeCode"
          value={digit}
          onChangeText={(text) => handleChange(text, idx)}
          onKeyPress={(e) => handleKeyPress(e, idx)}
        />
      ))}
    </View>
  );
}
