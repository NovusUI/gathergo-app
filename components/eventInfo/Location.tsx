import { useState } from "react";
import { View } from "react-native";
import tw from "twrnc";
import CustomView from "../View";
import CustomButton from "../buttons/CustomBtn1";
import Input from "../inputs/CustomInput1";

interface LocationProps {
  value: string;
  onSave: (val: string) => void;
}

const Location = ({ value, onSave }: LocationProps) => {
  const [location, setLocation] = useState(value || "");
  return (
    <View style={tw`w-full flex flex-col`}>
      <CustomView style={tw`flex-1 mb-10`}>
        <Input
          placeholder="Location"
          onChangeText={setLocation}
          value={location}
        />
      </CustomView>

      <CustomButton
        onPress={() => onSave(location)}
        disabled={location.length === 0 && value.length === 0}
        showArrow={false}
        buttonClassName="bg-[#0FF1CF] w-full"
        textClassName="!text-black"
        title="Save and Continue"
      />
    </View>
  );
};

export default Location;
