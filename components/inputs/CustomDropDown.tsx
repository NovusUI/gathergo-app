import { useAppTheme } from "@/hooks/useAppTheme";
import { forwardRef, useState } from "react";
import { Text, View } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

type IconType = React.ComponentType<{
  size?: number;
  color?: string;
}>;

interface DropdownProps {
  LeftIcon?: IconType;
  placeholder?: string;
  className?: string; // kept for API compatibility
  iconColor?: string;
  options: { label: string; value: string }[];
  selectedValue: string | null;
  onValueChange: (value: string | null) => void;
  error?: string;
}

const Dropdown = forwardRef<View, DropdownProps>(
  (
    {
      LeftIcon,
      placeholder = "Select an option",
      className = "",
      iconColor = "#6B7280",
      options,
      selectedValue,
      onValueChange,
      error,
    },
    ref
  ) => {
  const { tw, color } = useAppTheme();
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(selectedValue);
    const [items, setItems] = useState(options);

    return (
      <View ref={ref} style={[tw`mb-4 w-full`, className ? tw`${className}` : null]}>
        <View style={tw`w-full flex-row items-center`}>
          {LeftIcon && (
            <View style={tw`mr-2`}>
              <LeftIcon size={20} color={iconColor} />
            </View>
          )}

          <DropDownPicker
            containerStyle={tw`flex-1`}
            open={open}
            value={value}
            items={items}
            setOpen={setOpen}
            setValue={(callback) => {
              const newValue = callback(value);
              setValue(newValue);
              onValueChange(newValue);
            }}
            setItems={setItems}
            placeholder={placeholder}
            style={{
              backgroundColor: color("rgba(27,42,80,0.4)", "surface"),
              borderRadius: 12,
              borderWidth: 1,
              borderColor: error ? color("#EF4444", "danger") : color("transparent", "borderStrong"),
              minHeight: 50,
              flex: 1,
            }}
            textStyle={{
              color: color("#fff", "foreground"),
              fontSize: 16,
            }}
            placeholderStyle={{
              color: color("#9CA3AF", "muted"),
            }}
            dropDownContainerStyle={{
              backgroundColor: color("rgba(27,42,80,0.9)", "surface"),
              borderRadius: 12,
              borderWidth: 1,
              borderColor: error ? color("#EF4444", "danger") : color("transparent", "borderStrong"),
            }}
            listItemLabelStyle={{
              color: color("#fff", "foreground"),
            }}
            arrowIconStyle={{
              tintColor: color("#fff", "foreground"),
            }}
          />
        </View>

        {Boolean(error) && (
          <Text style={tw`text-danger dark:text-red-500 text-xs mt-1`}>{error}</Text>
        )}
      </View>
    );
  }
);

Dropdown.displayName = "Dropdown";

export default Dropdown;
