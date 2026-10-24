import { useAppTheme } from "@/hooks/useAppTheme";
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, G, Path, Pattern, Rect } from "react-native-svg";

export default memo(function ChatBackdrop() {
  const { colors, mode } = useAppTheme();

  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.chatBackground }]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="gathergo-chat" width={192} height={208} patternUnits="userSpaceOnUse">
            <G
              fill="none"
              stroke={colors.chatPattern}
              strokeWidth={1.3}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={mode === "light" ? 0.24 : 0.08}
            >
              <G transform="translate(18 18) rotate(-16 14 14)">
                <Path d="M4 25C4 10 15 3 27 3c0 15-8 25-23 22ZM4 25l17-16M12 17v-6M12 17h7" />
              </G>
              <G transform="translate(114 32) rotate(14 17 12)">
                <Path d="M2 2h30v7a4 4 0 0 0 0 8v7H2v-7a4 4 0 0 0 0-8V2ZM22 5v3m0 4v2m0 4v3" />
              </G>
              <G transform="translate(66 104) rotate(-9 16 14)">
                <Path d="M16 27 4 15C-8 3 9-5 16 6 23-5 40 3 28 15L16 27Z" />
              </G>
              <G transform="translate(140 142)">
                <Path d="M10 20S2 12 2 7a8 8 0 0 1 16 0c0 5-8 13-8 13Z" />
                <Path d="M7 7a3 3 0 1 0 6 0 3 3 0 0 0-6 0ZM10 25v4c0 7-26 0-26 9" />
              </G>
              <Path d="M83 25v8m-4-4h8M24 139v6m-3-3h6M111 187v8m-4-4h8" />
            </G>
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#gathergo-chat)" />
      </Svg>
    </View>
  );
});
