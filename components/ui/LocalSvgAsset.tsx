import { Asset } from "expo-asset";
import { memo, useEffect, useMemo, useState } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { SvgUri } from "react-native-svg";

const SVG_ASSETS = {
  ggcircle: require("../../assets/images/ggcircle.svg"),
  gglogo: require("../../assets/images/gglogo.svg"),
  googleicon: require("../../assets/images/googleicon.svg"),
  onboarding1: require("../../assets/images/onboarding1.svg"),
  onboarding2: require("../../assets/images/onboarding2.svg"),
  vector1: require("../../assets/images/vector1.svg"),
  vector2: require("../../assets/images/vector2.svg"),
  vector3: require("../../assets/images/vector3.svg"),
} as const;

export type LocalSvgAssetName = keyof typeof SVG_ASSETS;

type LocalSvgAssetProps = {
  name: LocalSvgAssetName;
  width: number | string;
  height: number | string;
  style?: StyleProp<ViewStyle>;
};

const LocalSvgAsset = ({
  name,
  width,
  height,
  style,
}: LocalSvgAssetProps) => {
  const asset = useMemo(() => Asset.fromModule(SVG_ASSETS[name]), [name]);
  const [uri, setUri] = useState<string | null>(asset.localUri ?? asset.uri);

  useEffect(() => {
    let isMounted = true;

    Asset.loadAsync(SVG_ASSETS[name])
      .then(([loadedAsset]) => {
        if (!isMounted) {
          return;
        }

        setUri(loadedAsset.localUri ?? loadedAsset.uri ?? null);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setUri(asset.localUri ?? asset.uri ?? null);
      });

    return () => {
      isMounted = false;
    };
  }, [asset.localUri, asset.uri, name]);

  if (!uri) {
    return null;
  }

  return (
    <View style={[{ width, height, flexShrink: 0 }, style]}>
      <SvgUri uri={uri} width="100%" height="100%" />
    </View>
  );
};

export default memo(LocalSvgAsset);
