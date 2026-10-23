import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

const partnership = require("@/assets/images/gather-partnership.png");
// Frame the interlocking rings without the poster's heading or goal number.
const symbol = { x: 288, y: 392, size: 448, imageSize: 1024 };

export function GatherIcon({
  size = 18,
  color = "#0FF1CF",
}: {
  size?: number;
  color?: string;
}) {
  const scale = size / symbol.size;
  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, overflow: "hidden" }}
    >
      <Image
        source={partnership}
        accessible={false}
        tintColor={color}
        style={{
          position: "absolute",
          width: symbol.imageSize * scale,
          height: symbol.imageSize * scale,
          left: -symbol.x * scale,
          top: -symbol.y * scale,
        }}
      />
    </View>
  );
}

export function GatherCardBackground() {
  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFillObject}
    >
      <View
        style={{ position: "absolute", right: -28, bottom: -30, opacity: 0.12 }}
      >
        <GatherIcon size={200} />
      </View>
    </View>
  );
}
