import { GOGO_PALETTE } from "@/components/gogo/mascot/constants";
import { useGogoSpinnerMotion } from "@/components/gogo/mascot/motion/useGogoSpinnerMotion";
import Svg, { Circle, G, Path } from "react-native-svg";
import { AnimatedGroup, GogoBody } from "@/components/gogo/mascot/GogoArtworkParts";
import type { SharedValue } from "react-native-reanimated";

export function GogoSpinnerArtwork({
  size,
  animated,
  ringColor,
  pullProgress,
}: {
  size: number;
  animated: boolean;
  ringColor: string;
  pullProgress?: SharedValue<number>;
}) {
  const { ringProps, faceProps, pupilProps } = useGogoSpinnerMotion(
    animated,
    pullProgress,
  );
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessible={false}>
      <Circle
        cx={32}
        cy={32}
        r={29}
        fill="none"
        stroke={ringColor}
        strokeOpacity={0.25}
        strokeWidth={4}
      />
      <AnimatedGroup animatedProps={ringProps}>
        <Circle
          cx={32}
          cy={32}
          r={29}
          fill="none"
          stroke={ringColor}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray="46 137"
        />
      </AnimatedGroup>
      <AnimatedGroup animatedProps={faceProps}>
        <G transform="translate(12 10) scale(0.2)">
          <GogoBody showFeet={false} cheekOpacity={0} />
          <Circle cx={70} cy={96} r={25} fill="#fff" />
          <Circle cx={130} cy={96} r={25} fill="#fff" />
          <AnimatedGroup animatedProps={pupilProps}>
            <Circle cx={70} cy={98} r={12} fill={GOGO_PALETTE.face} />
            <Circle cx={130} cy={98} r={12} fill={GOGO_PALETTE.face} />
          </AnimatedGroup>
          <Path
            d="M76 142Q100 164 124 142"
            fill="none"
            stroke={GOGO_PALETTE.face}
            strokeWidth={9}
            strokeLinecap="round"
          />
        </G>
      </AnimatedGroup>
    </Svg>
  );
}
