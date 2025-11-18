import { Globe } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import tw from "twrnc";
import Dropdown from "./CustomDropDown";

interface Props {
  nationality: string;
  setNationality: (nationality: string) => void;
}

export default function NationalityDropdown({
  nationality,
  setNationality,
}: Props) {
  const [countries, setCountries] = useState<
    { label: string; value: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,cca2"
        );
        const data = await res.json();

        const formatted = data
          .map((country: any) => ({
            label: country.name.common,
            value: country.cca2,
          }))
          .sort((a: any, b: any) => a.label.localeCompare(b.label));

        setCountries(formatted);
      } catch (error) {
        console.error("Failed to fetch countries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  if (loading) {
    return (
      <View
        style={tw`w-full max-w-[500px] bg-[#1B2A50]/40 p-4 rounded-xl flex-row justify-center`}
      >
        <ActivityIndicator color="#0FF1CF" />
      </View>
    );
  }

  return (
    <Dropdown
      LeftIcon={Globe}
      placeholder="Select Nationality"
      options={countries}
      selectedValue={nationality}
      onValueChange={setNationality}
    />
  );
}
