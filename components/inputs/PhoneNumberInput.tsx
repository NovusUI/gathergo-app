import { Picker } from "@react-native-picker/picker";
import { Phone } from "lucide-react-native";
import { forwardRef, useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";

interface PhoneInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
}

const PhoneNumberInput = forwardRef<TextInput, PhoneInputProps>(
  ({ placeholder = "Enter phone number", value, onChangeText, error }, ref) => {
    const [selectedCode, setSelectedCode] = useState("+234"); // Default Nigeria
    const [countries, setCountries] = useState<
      { label: string; value: string }[]
    >([]);

    useEffect(() => {
      const fetchCountries = async () => {
        try {
          const res = await fetch(
            "https://restcountries.com/v3.1/all?fields=idd,name"
          );
          const data = await res.json();

          const formatted = data
            .filter((c: any) => c.idd?.root)
            .map((c: any) => ({
              label: `${c.name.common} (${c.idd.root}${c.idd.suffixes?.[0] || ""})`,
              value: `${c.idd.root}${c.idd.suffixes?.[0] || ""}`,
            }))
            .sort((a: any, b: any) => a.label.localeCompare(b.label));

          setCountries(formatted);
        } catch (err) {
          console.error("Error fetching countries", err);
        }
      };
      fetchCountries();
    }, []);

    return (
      <View className="mb-4 w-full max-w-96 bg-[#1B2A50]/40 p-2 rounded-xl">
        <View className="flex-row items-center px-2">
          {/* Phone icon */}
          <View className="mr-2">
            <Phone size={20} color="#6B7280" />
          </View>

          {/* Country Code Picker */}
          <Picker
            selectedValue={selectedCode}
            onValueChange={(code) => setSelectedCode(code)}
            style={{ width: 60, color: "#FFFFFF" }}
            dropdownIconColor="#FFFFFF"
            className="bg-transparent outline-none"
          >
            {countries.map((c) => (
              <Picker.Item
                key={c.value}
                label={c.label}
                value={c.value}
                color="#FFFFFF"
              />
            ))}
          </Picker>

          {/* Phone Number Input */}
          <TextInput
            ref={ref}
            className="flex-1 py-3 text-white outline-none ml-2"
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={value}
            onChangeText={onChangeText}
          />
        </View>

        {/* Error Message */}
        {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
      </View>
    );
  }
);

export default PhoneNumberInput;
