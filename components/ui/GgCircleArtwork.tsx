import { memo } from "react";
import { StyleProp, ViewStyle } from "react-native";
import LocalSvgAsset from "./LocalSvgAsset";

type GgCircleArtworkProps = {
  width: number | string;
  height: number | string;
  style?: StyleProp<ViewStyle>;
};

const GgCircleArtwork = ({
  width,
  height,
  style,
}: GgCircleArtworkProps) => {
  return (
    <LocalSvgAsset name="ggcircle" width={width} height={height} style={style} />
  );
};

export default memo(GgCircleArtwork);
