import { useAppTheme } from "@/hooks/useAppTheme";
// components/EventImageWithProcessing.tsx
import { EventArtworkFallback } from "@/components/ui/ArtworkFallback";
import { Registration } from "@/types/auth";
import AppLoader from "@/components/ui/AppLoader";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

interface EventImageWithProcessingProps {
  imageUrl?: string | null;
  isProcessing: boolean;
  height?: number;
  registrationType?: Registration | null;
}

export const EventImageWithProcessing: React.FC<
  EventImageWithProcessingProps
> = ({ imageUrl, isProcessing, height = 240, registrationType }) => {
  const { tw } = useAppTheme();
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
          tw`flex-1 items-center justify-center bg-surfaceMuted dark:bg-[#1B2A50]`,
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
              <AppLoader size={40} accessibilityLabel="Uploading event image" />
              <Text style={tw`text-accent dark:text-[#0FF1CF] mt-2 font-semibold`}>
                Uploading image...
              </Text>
              <Text style={tw`text-muted dark:text-gray-400 text-xs mt-1`}>
                This may take a moment
              </Text>
            </View>
          </>
        ) : (
          <>
            <AppLoader size={40} accessibilityLabel="Uploading event image" />
            <Text style={tw`text-accent dark:text-[#0FF1CF] mt-2 font-semibold`}>
              Image uploading...
            </Text>
            <Text style={tw`text-muted dark:text-gray-400 text-xs mt-1`}>
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
