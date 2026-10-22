import { Platform } from "react-native";
import { createAnimatedPropAdapter } from "react-native-reanimated";

// The source SVGs use CSS keyframes. Native SVG groups receive the same motion
// as matrices through Reanimated; the original files stay in assets/mascot.
const nativeSvgTransformAdapter = createAnimatedPropAdapter(
  (props) => {
    props.matrix = props.transform;
    delete props.transform;
  },
  ["matrix"],
);
export const svgTransformAdapter =
  Platform.OS === "web" ? undefined : nativeSvgTransformAdapter;

export function rotationAt(
  degrees: number,
  x: number,
  y: number,
): [number, number, number, number, number, number] {
  "worklet";
  const radians = (degrees * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return [
    cosine,
    sine,
    -sine,
    cosine,
    x - x * cosine + y * sine,
    y - x * sine - y * cosine,
  ];
}
