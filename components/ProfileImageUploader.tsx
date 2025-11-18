import { useEditProfilePicture } from "@/services/mutations";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Plus } from "lucide-react-native";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import * as Progress from "react-native-progress";
import tw from "twrnc";

export default function ProfileImageBox({ uri }: { uri?: string }) {
  const [image, setImage] = useState<string | null>(uri || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    console.log(uri);
  }, [uri]);

  const { mutate } = useEditProfilePicture({
    onSuccess: () => {
      setUploading(false);
      setProgress(1);
      showGlobalSuccess("Upload successful");
    },
    onError: () => {
      setUploading(false);
      showGlobalError("Error occurred while uploading");
    },
  });

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const selected = result.assets[0].uri;
      setImage(selected);

      const formData = new FormData();
      formData.append("file", {
        uri: selected,
        name: "profile.jpg",
        type: "image/jpeg",
      } as any);

      setUploading(true);
      setProgress(0);
      mutate(formData);
    }
  };

  return (
    <View style={tw`relative w-18 h-18`}>
      {/* Avatar */}
      <View style={tw`rounded-2xl w-18 h-18 bg-gray-100 overflow-hidden`}>
        {image && (
          <Image
            source={image}
            cachePolicy="disk"
            transition={400}
            contentFit="cover"
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </View>

      {/* Progress ring */}
      {uploading && (
        <Progress.Circle
          size={100}
          progress={progress}
          indeterminate={progress === 0}
          showsText={false}
          color="#0FF1CF"
          borderWidth={0}
          thickness={4}
          unfilledColor="#e5e7eb"
          style={{ position: "absolute", top: -4, left: -4 }}
        />
      )}

      {/* Floating + button */}
      <TouchableOpacity
        onPress={pickImage}
        style={tw`absolute -right-3 bottom-2 bg-[#0FF1CF] w-8 h-8 rounded-full flex items-center justify-center shadow-lg`}
      >
        <Plus size={18} color="white" />
      </TouchableOpacity>
    </View>
  );
}
