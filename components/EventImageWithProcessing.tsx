// components/EventImageWithProcessing.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Text, View } from "react-native";
import tw from "twrnc";

interface EventImageWithProcessingProps {
  imageUrl?: string | null;
  isProcessing: boolean;
  height?: number;
}

export const EventImageWithProcessing: React.FC<
  EventImageWithProcessingProps
> = ({ imageUrl, isProcessing, height = 240 }) => {
  if (imageUrl && !isProcessing) {
    return (
      <Image
        source={imageUrl}
        style={{ width: "100%", height }}
        cachePolicy="disk"
        transition={400}
        contentFit="cover"
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
        {imageUrl ? (
          <>
            <Image
              source={imageUrl}
              style={{ width: "100%", height, opacity: 0.5 }}
              cachePolicy="disk"
              contentFit="cover"
              blurRadius={10}
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
    <View
      style={[tw`flex-1 items-center justify-center bg-gray-300`, { height }]}
    >
      <Ionicons name="image-outline" size={40} color="gray" />
      <Text style={tw`text-gray-500 mt-2`}>No cover picture</Text>
    </View>
  );
};
