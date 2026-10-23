import { useAppTheme } from "@/hooks/useAppTheme";
import { useEditProfilePicture } from "@/services/mutations";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Plus, UserRound } from "lucide-react-native";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import AppLoader from "@/components/ui/AppLoader";

export default function ProfileImageBox({ uri }: { uri?: string | null }) {
  const { tw, color } = useAppTheme();
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const imageSource = image ?? uri;

  const { mutateAsync } = useEditProfilePicture({
    onSuccess: () => {
      setUploading(false);
      showGlobalSuccess("Upload successful");
    },
    onError: (error) => {
      setUploading(false);
      console.error("Upload error:", error);
      showGlobalError("Error occurred while uploading");
      setImage(null);
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
      <View
        style={tw`rounded-full w-18 h-18 bg-surfaceMuted dark:bg-[#152342] items-center justify-center overflow-hidden`}
      >
        {imageSource ? (
          <Image
            source={imageSource}
            cachePolicy="disk"
            transition={400}
            contentFit="cover"
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <UserRound size={32} color={color("#AFC0E7", "secondary")} />
        )}
      </View>

      {uploading && (
        <View
          style={tw`absolute inset-0 rounded-full bg-black/45 items-center justify-center`}
        >
          <AppLoader size={32} accessibilityLabel="Uploading profile photo" />
        </View>
      )}

      {/* Floating + button */}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Change profile photo"
        accessibilityState={{ disabled: uploading }}
        hitSlop={8}
        onPress={pickImage}
        disabled={uploading}
        style={tw`absolute -right-1 bottom-0 bg-accentFill dark:bg-[#0FF1CF] w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${
          uploading ? "opacity-50" : ""
        }`}
      >
        <Plus size={18} color={color("#01082E", "onAccent")} />
      </TouchableOpacity>
    </View>
  );
}
