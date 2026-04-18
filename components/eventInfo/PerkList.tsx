import { Ionicons } from "@expo/vector-icons";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useRef, useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";

type PerksListProps = {
  value: string[];
  onChange: (updated: string[]) => void;
  insideBottomSheet?: boolean;
};

const PerksList: React.FC<PerksListProps> = ({
  value,
  onChange,
  insideBottomSheet = false,
}) => {
  const InputComponent = insideBottomSheet ? BottomSheetTextInput : TextInput;
  const inputRef = useRef<TextInput | null>(null);
  const [draftPerk, setDraftPerk] = useState("");

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const addPerk = () => {
    const trimmedPerk = draftPerk.trim();
    if (!trimmedPerk) {
      focusInput();
      return;
    }

    const exists = value.some(
      (perk) => perk.trim().toLowerCase() === trimmedPerk.toLowerCase()
    );

    if (exists) {
      setDraftPerk("");
      return;
    }

    onChange([...value.filter((perk) => perk.trim().length > 0), trimmedPerk]);
    setDraftPerk("");
    focusInput();
  };

  const deletePerk = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const editPerk = (index: number) => {
    const selectedPerk = value[index];
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
    setDraftPerk(selectedPerk);
    setTimeout(() => focusInput(), 50);
  };

  return (
    <View style={tw`gap-4`}>
      {value.length > 0 ? (
        <View style={tw`gap-3`}>
          {value.map((perk, index) => (
            <View
              key={`${perk}-${index}`}
              style={tw`flex-row items-center rounded-2xl border border-[#2A3C68] bg-[#0B183D] px-4 py-3`}
            >
              <View
                style={tw`mr-3 h-9 w-9 items-center justify-center rounded-xl bg-[#0FF1CF]/16`}
              >
                <Ionicons name="sparkles-outline" size={17} color="#0FF1CF" />
              </View>

              <View style={tw`flex-1`}>
                <Text style={tw`text-xs uppercase tracking-[1px] text-[#6D80B3]`}>
                  Included perk
                </Text>
                <Text style={tw`mt-1 text-sm text-white`}>{perk}</Text>
              </View>

              <View style={tw`ml-3 flex-row items-center gap-2`}>
                <TouchableOpacity
                  onPress={() => editPerk(index)}
                  style={tw`h-9 w-9 items-center justify-center rounded-full bg-white/6`}
                >
                  <Ionicons name="create-outline" size={16} color="#C7D6FF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deletePerk(index)}
                  style={tw`h-9 w-9 items-center justify-center rounded-full bg-[#FF6B6B]/12`}
                >
                  <Ionicons name="close" size={18} color="#FF8A8A" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={tw`rounded-2xl border border-dashed border-[#2A3C68] bg-[#07122E] px-4 py-4`}>
          <Text style={tw`text-sm font-semibold text-white`}>
            No perks added yet
          </Text>
          <Text style={tw`mt-1 text-xs leading-5 text-[#8EA3D1]`}>
            Add the extras this tier unlocks, like backstage access, merch, or
            reserved seating.
          </Text>
        </View>
      )}

      <View style={tw`rounded-2xl border border-[#2A3C68] bg-[#101C45] px-4 py-4`}>
        <Text style={tw`text-xs uppercase tracking-[1px] text-[#6D80B3]`}>
          Add a perk
        </Text>

        <View style={tw`mt-3 flex-row items-center rounded-2xl bg-[#07122E] px-4`}>
          <Ionicons name="add-circle-outline" size={18} color="#0FF1CF" />
          <InputComponent
            ref={inputRef}
            value={draftPerk}
            onChangeText={setDraftPerk}
            onSubmitEditing={addPerk}
            returnKeyType="done"
            placeholder="VIP lounge access"
            placeholderTextColor="#7D90BC"
            style={tw`ml-3 flex-1 py-4 text-base text-white`}
          />
        </View>

        <TouchableOpacity
          onPress={addPerk}
          style={tw`mt-3 flex-row items-center justify-center rounded-2xl bg-[#0FF1CF] px-4 py-3`}
        >
          <Ionicons name="add" size={18} color="#041130" />
          <Text style={tw`ml-2 text-sm font-semibold text-[#041130]`}>
            Add perk
          </Text>
        </TouchableOpacity>
      </View>

      {value.length > 0 && (
        <Text style={tw`text-xs leading-5 text-[#7D90BC]`}>
          Tap the pencil to tweak a perk, or remove any that no longer fit this
          ticket.
        </Text>
      )}
    </View>
  );
};

export default PerksList;
