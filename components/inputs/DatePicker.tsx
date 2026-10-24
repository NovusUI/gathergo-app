import { useAppTheme } from "@/hooks/useAppTheme";
import { Calendar } from "lucide-react-native";
import { forwardRef, useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type IconType = React.ComponentType<{
  size?: number;
  color?: string;
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
  const { tw } = useAppTheme();
    useEffect(() => {
      console.log(value, "birthday");
    }, [value]);

    return (
      <View
        ref={ref}
        style={[
          tw`w-full p-2 rounded-xl bg-surface dark:bg-[#1B2A50]/40 border border-borderStrong dark:border-transparent`,
          { maxWidth: 500 },
          className ? tw`${className}` : null,
        ]}
      >
        <TouchableOpacity
          style={tw`flex-row items-center px-5 py-3`}
          onPress={onPress}
          activeOpacity={0.7}
        >
          {/* Left Icon */}
          {LeftIcon && (
            <View style={tw`mr-2`}>
              <LeftIcon size={20} color={iconColor} />
            </View>
          )}

          {/* Display Selected Date or Placeholder */}
          <Text
            style={[
              tw`flex-1 text-foreground dark:text-white`,
              !value && tw`text-muted dark:text-gray-400`,
              inputClassName ? tw`${inputClassName}` : null,
            ]}
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
        {Boolean(error) && (
          <Text style={tw`text-danger dark:text-red-500 text-xs mt-1`}>{error}</Text>
        )}
      </View>
    );
  }
);

DatePicker.displayName = "DatePicker";

export default DatePicker;
