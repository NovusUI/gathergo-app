import { useEditProfilePicture } from "@/services/mutations";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Plus } from "lucide-react-native";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import * as Progress from "react-native-progress";
import tw from "twrnc";

export default function ProfileImageBox({ uri }: { uri?: string }) {
  const [image, setImage] = useState<string | null>(uri || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { mutateAsync } = useEditProfilePicture({
    onSuccess: () => {
      setUploading(false);
      setProgress(1);
      showGlobalSuccess("Upload successful");
      setTimeout(() => setProgress(0), 1000); // Hide progress after success
    },
    onError: (error) => {
      setUploading(false);
      console.error("Upload error:", error);
      showGlobalError("Error occurred while uploading");
      // Optionally revert to previous image
      setImage(uri || null);
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

      // Create FormData properly
      const formData = new FormData();

      // Get file name from URI
      const uriParts = selected.split("/");
      const fileName = uriParts[uriParts.length - 1] || "profile.jpg";

      // Determine MIME type
      let mimeType = "image/jpeg";
      if (fileName.toLowerCase().endsWith(".png")) {
        mimeType = "image/png";
      }

      formData.append("file", {
        uri: selected,
        name: fileName,
        type: mimeType,
      } as any);

      setUploading(true);
      setProgress(0);

      try {
        await mutateAsync(formData);
      } catch (error) {
        // Error is already handled in onError callback
        console.error("Mutation error:", error);
      }
    }
  };

  return (
    <View style={tw`relative w-18 h-18`}>
      {/* Avatar */}
      <View style={tw`rounded-2xl w-18 h-18 bg-gray-100 overflow-hidden`}>
        {Boolean(image) && (
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
        disabled={uploading}
        style={tw`absolute -right-3 bottom-2 bg-[#0FF1CF] w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
          uploading ? "opacity-50" : ""
        }`}
      >
        <Plus size={18} color="white" />
      </TouchableOpacity>
    </View>
  );
}
