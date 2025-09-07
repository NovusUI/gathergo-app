import { useEditProfilePicture } from "@/services/mutations";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Plus } from "lucide-react-native";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import * as Progress from "react-native-progress";

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
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const selected = result.assets[0].uri;
      setImage(selected);

      // Create FormData for upload
      const formData = new FormData();
      formData.append("file", {
        uri: selected,
        name: "profile.jpg",
        type: "image/jpeg",
      } as any);

      // Start upload
      setUploading(true);
      setProgress(0);

      mutate(formData);
    }
  };

  return (
    <View className="relative w-24 h-24">
      {/* Avatar */}
      <View className="rounded-2xl w-24 h-24 bg-gray-100 overflow-hidden">
        {image ? (
          <Image
            source={image}
            cachePolicy="disk"       // ✅ cached persistently
            transition={400}         // ✅ fade-in effect
            contentFit="cover"       // ✅ equivalent to resizeMode="cover"
            style={{ width: "100%", height: "100%" }}
          />
        ) : null}
      </View>

      {/* Show progress ring ONLY while uploading */}
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
        className="absolute -right-3 bottom-2 bg-[#0FF1CF] w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
      >
        <Plus size={18} color="white" />
      </TouchableOpacity>
    </View>
  );
}
