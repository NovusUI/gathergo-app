import { Image, View } from "react-native";

interface Props {
  images: any[];
  size?: number;
  overlap?: number;
  className?: string;
}

const OverlappingImages = ({
  images,
  size = 40,
  overlap = 10,
  className,
}: Props) => {
  return (
    <View className={`flex-row items-center ${className}`}>
      {images.map((image, index) => (
        <Image
          key={index}
          source={image}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            marginLeft: index === 0 ? 0 : -overlap,
            zIndex: images.length - index, // ensures first image stays on top
            borderWidth: 2,
            borderColor: "white", // optional for cleaner look
          }}
        />
      ))}
    </View>
  );
};

export default OverlappingImages;
