// components/EventImageWithProcessing.tsx
import { EventArtworkFallback } from "@/components/ui/ArtworkFallback";
import { Registration } from "@/types/auth";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import tw from "twrnc";

interface EventImageWithProcessingProps {
  imageUrl?: string | null;
  isProcessing: boolean;
  height?: number;
  registrationType?: Registration | null;
}

export const EventImageWithProcessing: React.FC<
  EventImageWithProcessingProps
> = ({ imageUrl, isProcessing, height = 240, registrationType }) => {
  const [showImage, setShowImage] = useState(Boolean(imageUrl));

  useEffect(() => {
    setShowImage(Boolean(imageUrl));
  }, [imageUrl]);

  if (showImage && !isProcessing) {
    return (
      <Image
        source={imageUrl}
        style={{ width: "100%", height }}
        cachePolicy="disk"
        transition={400}
        contentFit="cover"
        onError={() => setShowImage(false)}
      />
    );
  }

  if (isProcessing) {
    return (
      <View
        style={[
          tw`flex-1 items-center justify-center bg-[#1B2A50]`,
          { height },
        ]}
      >
        {showImage ? (
          <>
            <Image
              source={imageUrl}
              style={{ width: "100%", height, opacity: 0.5 }}
              cachePolicy="disk"
              contentFit="cover"
              blurRadius={10}
              onError={() => setShowImage(false)}
            />
            <View style={tw`absolute inset-0 items-center justify-center`}>
              <Ionicons name="cloud-upload-outline" size={40} color="#0FF1CF" />
              <Text style={tw`text-[#0FF1CF] mt-2 font-semibold`}>
                Uploading image...
              </Text>
              <Text style={tw`text-gray-400 text-xs mt-1`}>
                This may take a moment
              </Text>
            </View>
          </>
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={40} color="#0FF1CF" />
            <Text style={tw`text-[#0FF1CF] mt-2 font-semibold`}>
              Image uploading...
            </Text>
            <Text style={tw`text-gray-400 text-xs mt-1`}>
              Your event is ready! Image will appear soon
            </Text>
          </>
        )}
      </View>
    );
  }

  return (
    <EventArtworkFallback
      registrationType={registrationType}
      height={height}
    />
  );
};
