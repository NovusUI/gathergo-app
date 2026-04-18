import { forwardRef, useState } from "react";
import { Text, View } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import tw from "twrnc";

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
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(selectedValue);
    const [items, setItems] = useState(options);

    return (
      <View ref={ref} style={[tw`mb-4`, className ? tw`${className}` : null]}>
        <View
          style={[
            tw`flex-row items-center`,
            { width: 300 }, // w-[300px]
          ]}
        >
          {LeftIcon && (
            <View style={tw`mr-2`}>
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

        {Boolean(error) && (
          <Text style={tw`text-red-500 text-xs mt-1`}>{error}</Text>
        )}
      </View>
    );
  }
);

Dropdown.displayName = "Dropdown";

export default Dropdown;
