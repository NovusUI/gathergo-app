import { forwardRef, useState } from "react";
import { Text, View } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

type IconType = React.ComponentType<{
  size?: number;
  color?: string;
  className?: string;
}>;

interface DropdownProps {
  LeftIcon?: IconType;
  placeholder?: string;
  className?: string;
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
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(selectedValue);
    const [items, setItems] = useState(options);

    return (
      <View ref={ref} className={`mb-4 w-full max-w-[500px] ${className}`}>
        <View className="flex-row items-center">
          {LeftIcon && (
            <View className="mr-2">
              <LeftIcon size={20} color={iconColor} />
            </View>
          )}

          <DropDownPicker
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
              backgroundColor: "rgba(27,42,80,0.4)",
              borderRadius: 12,
              borderWidth: 0,
              minHeight: 50,
              flex: 1,
            }}
            textStyle={{
              color: "#fff",
              fontSize: 16,
            }}
            placeholderStyle={{
              color: "#9CA3AF",
            }}
            dropDownContainerStyle={{
              backgroundColor: "rgba(27,42,80,0.9)",
              borderRadius: 12,
              borderWidth: 0,
            }}
            listItemLabelStyle={{
              color: "#fff",
            }}
            arrowIconStyle={{
              tintColor: "#fff",
            }}
          />
        </View>

        {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
      </View>
    );
  }
);

export default Dropdown;
