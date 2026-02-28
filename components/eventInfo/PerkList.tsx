import { Text, TextInput, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

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
            style={tw`flex-row items-center bg-blue-900 rounded-2xl p-4 mb-3`}
          >
            <View style={tw`flex-1`}>
              {isInput ? (
                <TextInput
                  value={perk}
                  onChangeText={(text) => handleInputChange(text, index)}
                  placeholder="Enter perk..."
                  placeholderTextColor="#94a3b8"
                  style={tw`text-white text-base`}
                />
              ) : (
                <Text style={tw`text-white text-base`}>{perk}</Text>
              )}
            </View>

            <TouchableOpacity onPress={() => deletePerk(index)}>
              <Text style={tw`text-red-400 text-sm ml-3`}>❌</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <TouchableOpacity onPress={addPerk}>
        <Text style={tw`text-teal-400 text-sm mt-2`}>Add Ticket Perk</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PerksList;
