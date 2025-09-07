import { Eye, EyeOff } from "lucide-react-native";
import { forwardRef, useEffect, useState } from "react";
import { Text, TextInput, TextInputProps, TouchableOpacity, View } from "react-native";

type IconType = React.ComponentType<{
  size?: number;
  color?: string;
  className?: string;
}>;

interface InputProps extends TextInputProps {
  LeftIcon?: IconType;
  RightIcon?: IconType;
  secureTextEntry?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  error?: string;
  iconColor?: string;
  numeric?: boolean;
  moneyFormat?: boolean; // New prop for money formatting
}

// Helper function to format number with commas
const formatMoney = (value: string): string => {
  // Remove all non-digit characters except decimal point
  const numericValue = value.replace(/[^\d.]/g, '');
  
  // Split integer and decimal parts
  const parts = numericValue.split('.');
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? `.${parts[1]}` : '';
  
  // Add commas to integer part
  if (integerPart) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  return integerPart + decimalPart;
};

// Helper function to parse formatted money back to raw number string
const parseMoney = (formattedValue: string): string => {
  return formattedValue.replace(/,/g, '');
};

const Input = forwardRef<TextInput, InputProps>(
  (
    {
      LeftIcon,
      RightIcon,
      secureTextEntry = false,
      placeholder = "",
      value,
      onChangeText,
      className = "",
      inputClassName = "",
      error,
      iconColor = "#6B7280",
      numeric = false,
      moneyFormat = false, // Default to false
      ...props
    },
    ref
  ) => {
    const [isSecure, setIsSecure] = useState(secureTextEntry);
    const [displayValue, setDisplayValue] = useState("");

    // Update display value when the value prop changes
    useEffect(() => {
      if (moneyFormat && value) {
        const formatted = formatMoney(value.toString());
        setDisplayValue(formatted);
      } else {
        setDisplayValue(value?.toString() || "");
      }
    }, [value, moneyFormat]);

    const handleChangeText = (text: string) => {
      if (onChangeText) {
        if (moneyFormat) {
          // For money format, parse the formatted text to get raw number
          const rawValue = parseMoney(text);
          onChangeText(rawValue);
        } else if (numeric) {
          // Allow only numbers and decimal point
          const numericValue = text.replace(/[^0-9.]/g, '');
          // Ensure only one decimal point
          const decimalCount = (numericValue.match(/\./g) || []).length;
          if (decimalCount <= 1) {
            onChangeText(numericValue);
          }
        } else {
          onChangeText(text);
        }
      }
    };

    return (
      <View className={`w-full max-w-[500px] bg-[#1B2A50]/40 p-2 rounded-xl ${className}`}>
        <View className="flex-row items-center px-5">
          {LeftIcon && (
            <View className="mr-2">
              <LeftIcon size={20} color={iconColor} />
            </View>
          )}

          <TextInput
            ref={ref}
            className={`flex-1 py-3 text-white outline-none ${inputClassName}`}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            value={displayValue}
            onChangeText={handleChangeText}
            secureTextEntry={isSecure}
            keyboardType={moneyFormat || numeric ? "numeric" : "default"}
            {...props}
          />

          {RightIcon ? (
            <View className="ml-2">
              <RightIcon size={20} color={iconColor} />
            </View>
          ) : secureTextEntry ? (
            <TouchableOpacity
              onPress={() => setIsSecure(!isSecure)}
              className="ml-2"
            >
              {isSecure ? (
                <Eye size={20} color={iconColor} />
              ) : (
                <EyeOff size={20} color={iconColor} />
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
      </View>
    );
  }
);

export default Input;