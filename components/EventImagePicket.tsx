import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Pressable, Text, View } from "react-native";

interface CoverImagePickerProps {
  value: string | null;
  onChange: (uri: string | null) => void;
}

export default function CoverImagePicker({ value, onChange }: CoverImagePickerProps) {
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Permission required to pick an image");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      onChange(uri);
    }
  };

  return (
    <View className="w-full h-72 rounded-2xl overflow-hidden relative bg-gray-200 flex items-center">
      {value ? (
        <Image
          source={value}
          cachePolicy="disk"       // ✅ persist image on disk
          transition={400}         // ✅ fade in smoothly
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"       // ✅ equivalent to resizeMode="cover"
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Ionicons name="image-outline" size={40} color="gray" />
          <Text className="text-gray-500 mt-2">No cover selected</Text>
        </View>
      )}

      <Pressable
        onPress={pickImage}
        className="absolute bottom-5 left-auto bg-[#95DFD4] px-4 py-5 rounded-xl flex-row items-center"
      >
        <Ionicons name="image" size={18} color="black" />
        <Text className="ml-2 text-black font-medium">Edit Cover</Text>
      </Pressable>
    </View>
  );
}
