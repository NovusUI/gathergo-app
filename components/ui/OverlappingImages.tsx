import { Image, View } from "react-native";
import { UserRound } from "lucide-react-native";
import tw from "twrnc";

interface Props {
  images: Array<string | null | undefined>;
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
        <View
          key={index}
          style={tw.style({
            width: size,
            height: size,
            borderRadius: size / 2,
            marginLeft: index === 0 ? 0 : -overlap,
            zIndex: images.length - index,
            borderWidth: 2,
            borderColor: "white",
            overflow: "hidden",
            backgroundColor: "#1B2A50",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          {image ? (
            <Image source={{ uri: image }} style={tw.style({ width: size, height: size })} />
          ) : (
            <UserRound size={Math.max(12, size * 0.45)} color="#8FA5E2" />
          )}
        </View>
      ))}
    </View>
  );
};

export default OverlappingImages;
