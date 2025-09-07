import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

type PerksListProps = {
  value: string[];
  onChange: (updated: string[]) => void;
};

const PerksList: React.FC<PerksListProps> = ({ value, onChange }) => {
  const handleInputChange = (text: string, index: number) => {
    const updated = [...value];
    updated[index] = text;
    onChange(updated);
  };

  const addPerk = () => {
    onChange([...value, ""]);
  };

  const deletePerk = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <View>
      {value.map((perk, index) => {
        const isInput = index === value.length - 1; // last perk is editable
        return (
          <View
            key={index}
            className="flex-row items-center bg-blue-900 rounded-2xl p-4 mb-3"
          >
            <View className="flex-1">
              {isInput ? (
                <TextInput
                  value={perk}
                  onChangeText={(text) => handleInputChange(text, index)}
                  placeholder="Enter perk..."
                  placeholderTextColor="#94a3b8"
                  className="text-white text-base"
                />
              ) : (
                <Text className="text-white text-base">{perk}</Text>
              )}
            </View>

            <TouchableOpacity onPress={() => deletePerk(index)}>
              <Text className="text-red-400 text-sm ml-3">❌</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <TouchableOpacity onPress={addPerk}>
        <Text className="text-teal-400 text-sm mt-2">Add New Perk</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PerksList;
