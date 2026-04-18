import { Eye, EyeOff } from "lucide-react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import {
  ComponentType,
  forwardRef,
  MutableRefObject,
  useCallback,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";

type IconType = ComponentType<{
  size?: number;
  color?: string;
}>;

interface InputProps extends TextInputProps {
  LeftIcon?: IconType;
  RightIcon?: IconType;
  secureTextEntry?: boolean;
  placeholder?: string;
  error?: string;
  iconColor?: string;
  numeric?: boolean;
  moneyFormat?: boolean; // New prop
  insideBottomSheet?: boolean;
}

// Helper function to format number with commas
const formatMoney = (value: string): string => {
  const numericValue = value.replace(/[^\d.]/g, "");
  const parts = numericValue.split(".");
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? `.${parts[1]}` : "";

  if (integerPart) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  return integerPart + decimalPart;
};

// Helper function to parse formatted money back to raw number string
const parseMoney = (formattedValue: string): string =>
  formattedValue.replace(/,/g, "");

const Input = forwardRef<TextInput, InputProps>(
  (
    {
      LeftIcon,
      RightIcon,
      secureTextEntry = false,
      placeholder = "",
      value,
      onChangeText,
      error,
      iconColor = "#6B7280",
      numeric = false,
      moneyFormat = false,
      insideBottomSheet = false,
      style: inputStyle,
      placeholderTextColor,
      ...restProps
    },
    ref
  ) => {
    const inputRef = useRef<TextInput | null>(null);
    const [isSecure, setIsSecure] = useState(secureTextEntry);
    const InputComponent = insideBottomSheet ? BottomSheetTextInput : TextInput;
    const resolvedValue = moneyFormat
      ? formatMoney(value?.toString() || "")
      : value?.toString() || "";

    const handleChangeText = (text: string) => {
      if (!onChangeText) return;

      if (moneyFormat) {
        onChangeText(parseMoney(text));
      } else if (numeric) {
        const numericValue = text.replace(/[^0-9.]/g, "");
        const decimalCount = (numericValue.match(/\./g) || []).length;
        if (decimalCount <= 1) onChangeText(numericValue);
      } else {
        onChangeText(text);
      }
    };

    const setRefs = useCallback(
      (node: TextInput | null) => {
        inputRef.current = node;
        if (!ref) return;
        if (typeof ref === "function") {
          ref(node);
        } else {
          (ref as MutableRefObject<TextInput | null>).current = node;
        }
      },
      [ref]
    );

    return (
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={tw.style("w-full max-w-[500px] bg-[#1B2A50]/40 p-2 rounded-xl")}
      >
        <View style={tw`flex-row items-center px-5`}>
          {LeftIcon && (
            <View style={tw`mr-2`}>
              <LeftIcon size={20} color={iconColor} />
            </View>
          )}

          <InputComponent
            {...restProps}
            ref={setRefs}
            style={tw.style(
              "flex-1 py-3 text-white",
              {
                outlineStyle: "none",
              },
              inputStyle
            )}
            placeholder={placeholder}
            placeholderTextColor={placeholderTextColor ?? "#9CA3AF"}
            value={resolvedValue}
            onChangeText={handleChangeText}
            secureTextEntry={isSecure}
            keyboardType={moneyFormat || numeric ? "numeric" : "default"}
          />

          {RightIcon ? (
            <View style={tw`ml-2`}>
              <RightIcon size={20} color={iconColor} />
            </View>
          ) : secureTextEntry ? (
            <TouchableOpacity
              onPress={() => setIsSecure(!isSecure)}
              style={tw`ml-2`}
            >
              {isSecure ? (
                <Eye size={20} color={iconColor} />
              ) : (
                <EyeOff size={20} color={iconColor} />
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        {Boolean(error) && (
          <Text style={tw`text-red-500 text-xs mt-1`}>{error}</Text>
        )}
      </Pressable>
    );
  }
);

Input.displayName = "Input";

export default Input;
