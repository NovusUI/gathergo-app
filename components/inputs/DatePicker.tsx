import { Calendar } from "lucide-react-native";
import { forwardRef, useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type IconType = React.ComponentType<{
  size?: number;
  color?: string;
  className?: string;
}>;

interface DatePickerProps {
  LeftIcon?: IconType;
  RightIcon?: IconType;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  error?: string;
  iconColor?: string;
  value?: string;
  onPress?: () => void;
}

const DatePicker = forwardRef<View, DatePickerProps>(
  (
    {
      LeftIcon,
      RightIcon,
      placeholder = "Select date",
      className = "",
      inputClassName = "",
      error,
      iconColor = "#6B7280",
      value,
      onPress,
    },
    ref
  ) => {
    useEffect(() => {
      console.log(value, "birthday");
    }, [value]);
    return (
      <View
        ref={ref}
        className={`w-full max-w-[500px] bg-[#1B2A50]/40 p-2 rounded-xl ${className}`}
      >
        <TouchableOpacity
          className="flex-row items-center px-5 py-3"
          onPress={onPress}
          activeOpacity={0.7}
        >
          {/* Left Icon */}
          {LeftIcon && (
            <View className="mr-2">
              <LeftIcon size={20} color={iconColor} />
            </View>
          )}

          {/* Display Selected Date or Placeholder */}
          <Text
            className={`flex-1 text-white ${
              !value ? "text-gray-400" : ""
            } ${inputClassName}`}
          >
            {value ?? placeholder}
          </Text>

          {/* Right Icon */}
          {RightIcon ? (
            <RightIcon size={20} color={iconColor} />
          ) : (
            <Calendar size={20} color={iconColor} />
          )}
        </TouchableOpacity>

        {/* Error */}
        {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
      </View>
    );
  }
);

export default DatePicker;
