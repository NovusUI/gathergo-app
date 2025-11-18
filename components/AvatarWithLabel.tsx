import { Image } from "expo-image";
import { Text, View } from "react-native";
import tw from "twrnc";

type AvatarWithLabelProps = {
  imageUrl?: string | { uri: string };
  username?: string;
  role?: string;
  size?: number; // default 44
  rounded?: boolean; // default false (square with rounded-md)
};

export default function AvatarWithLabel({
  imageUrl,
  username = "Organizer",
  role = "Organizer",
  size = 44,
  rounded = false,
}: AvatarWithLabelProps) {
  return (
    <View style={tw`flex-row items-center gap-3`}>
      {imageUrl ? (
        <Image
          source={imageUrl}
          style={{
            width: size,
            height: size,
            borderRadius: rounded ? size / 2 : 10,
          }}
          cachePolicy="disk"
          transition={400}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            tw`bg-gray-500`,
            {
              width: size,
              height: size,
              borderRadius: rounded ? size / 2 : 10,
            },
          ]}
        />
      )}

      <View style={tw`py-2`}>
        <Text style={tw`capitalize text-white`}>{username}</Text>
        <Text style={tw`text-[#8E8E8E] text-sm`}>{role}</Text>
      </View>
    </View>
  );
}
