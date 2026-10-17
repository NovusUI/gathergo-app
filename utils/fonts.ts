import type { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from "react-native";

export const URBANIST_FONT_FAMILY = {
  regular: "Urbanist-Regular",
  medium: "Urbanist-Medium",
  semiBold: "Urbanist-SemiBold",
  bold: "Urbanist-Bold",
} as const;

export const URBANIST_FONT_ASSETS = {
  [URBANIST_FONT_FAMILY.regular]: require("../assets/fonts/Urbanist-Regular.ttf"),
  [URBANIST_FONT_FAMILY.medium]: require("../assets/fonts/Urbanist-Medium.ttf"),
  [URBANIST_FONT_FAMILY.semiBold]: require("../assets/fonts/Urbanist-SemiBold.ttf"),
  [URBANIST_FONT_FAMILY.bold]: require("../assets/fonts/Urbanist-Bold.ttf"),
};

type FontPatchableComponent<TProps> = {
  render?: (props: TProps, ref: unknown) => ReactNode;
};

const patchedComponents = new WeakSet<object>();

const normalizeFontWeight = (fontWeight?: TextStyle["fontWeight"]) => {
  if (fontWeight === "bold") return 700;
  if (fontWeight === "normal" || fontWeight === undefined) return 400;

  const parsedWeight = Number(fontWeight);
  return Number.isFinite(parsedWeight) ? parsedWeight : 400;
};

const resolveUrbanistFamily = (style?: StyleProp<TextStyle>) => {
  const flattenedStyle = StyleSheet.flatten(style);

  if (flattenedStyle?.fontFamily) {
    return null;
  }

  const fontWeight = normalizeFontWeight(flattenedStyle?.fontWeight);

  if (fontWeight >= 700) return URBANIST_FONT_FAMILY.bold;
  if (fontWeight >= 600) return URBANIST_FONT_FAMILY.semiBold;
  if (fontWeight >= 500) return URBANIST_FONT_FAMILY.medium;

  return URBANIST_FONT_FAMILY.regular;
};

const withUrbanistFont = (style?: StyleProp<TextStyle>) => {
  const fontFamily = resolveUrbanistFamily(style);

  if (!fontFamily) {
    return style;
  }

  return [
    style,
    {
      fontFamily,
      fontWeight: "400",
    },
  ] satisfies StyleProp<TextStyle>;
};

const applyFontPatch = <TProps extends { style?: StyleProp<TextStyle> }>(
  component: FontPatchableComponent<TProps>,
) => {
  if (patchedComponents.has(component) || typeof component.render !== "function") {
    return;
  }

  const originalRender = component.render;

  component.render = function renderWithUrbanist(
    this: unknown,
    props: TProps,
    ref: unknown,
  ) {
    return originalRender.call(
      this,
      {
        ...props,
        style: withUrbanistFont(props?.style),
      },
      ref,
    );
  };

  patchedComponents.add(component);
};

export const applyUrbanistFontDefaults = () => {
  applyFontPatch(Text as unknown as FontPatchableComponent<TextProps>);
  applyFontPatch(TextInput as unknown as FontPatchableComponent<TextInputProps>);
};
