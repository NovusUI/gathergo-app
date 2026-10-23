import { useAppTheme } from "@/hooks/useAppTheme";
import { Image, View } from "react-native";
import { UserRound } from "lucide-react-native";

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
  const { tw, color } = useAppTheme();
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
            borderColor: color("white", "borderStrong"),
            overflow: "hidden",
            backgroundColor: color("#1B2A50", "surfaceMuted"),
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          {image ? (
            <Image source={{ uri: image }} style={tw.style({ width: size, height: size })} />
          ) : (
            <UserRound size={Math.max(12, size * 0.45)} color={color("#8FA5E2", "secondary")} />
          )}
        </View>
      ))}
    </View>
  );
};

export default OverlappingImages;
