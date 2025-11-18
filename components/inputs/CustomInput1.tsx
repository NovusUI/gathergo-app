import { Eye, EyeOff } from "lucide-react-native";
import { forwardRef, useEffect, useState } from "react";
import {
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";

type IconType = React.ComponentType<{
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
      ...props
    },
    ref
  ) => {
    const [isSecure, setIsSecure] = useState(secureTextEntry);
    const [displayValue, setDisplayValue] = useState("");

    useEffect(() => {
      if (moneyFormat && value) {
        setDisplayValue(formatMoney(value.toString()));
      } else {
        setDisplayValue(value?.toString() || "");
      }
    }, [value, moneyFormat]);

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

    return (
      <View
        style={tw.style("w-full max-w-[500px] bg-[#1B2A50]/40 p-2 rounded-xl")}
      >
        <View style={tw`flex-row items-center px-5`}>
          {LeftIcon && (
            <View style={tw`mr-2`}>
              <LeftIcon size={20} color={iconColor} />
            </View>
          )}

          <TextInput
            ref={ref}
            style={tw.style("flex-1 py-3 text-white", {
              outlineStyle: "none",
            })}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            value={displayValue}
            onChangeText={handleChangeText}
            secureTextEntry={isSecure}
            keyboardType={moneyFormat || numeric ? "numeric" : "default"}
            {...props}
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

        {error && <Text style={tw`text-red-500 text-xs mt-1`}>{error}</Text>}
      </View>
    );
  }
);

export default Input;
