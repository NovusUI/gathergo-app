import { Image, View } from "react-native";
import tw from "twrnc";

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
    <View style={tw.style("flex-row items-center", className)}>
      {images.map((image, index) => (
        <Image
          key={index}
          source={image}
          style={tw.style({
            width: size,
            height: size,
            borderRadius: size / 2,
            marginLeft: index === 0 ? 0 : -overlap,
            zIndex: images.length - index,
            borderWidth: 2,
            borderColor: "white",
          })}
        />
      ))}
    </View>
  );
};

export default OverlappingImages;
