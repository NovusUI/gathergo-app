import { GOGO_PALETTE } from "@/components/gogo/mascot/constants";
import {
  useGogoLoadingMotion,
  useGogoLoadingRing,
} from "@/components/gogo/mascot/motion/useGogoLoadingMotion";
import type { SharedValue } from "react-native-reanimated";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";
import { AnimatedGroup, GogoArms, GogoBody } from "@/components/gogo/mascot/GogoArtworkParts";

function LoadingRing({
  x,
  delay,
  progress,
  animated,
}: {
  x: number;
  delay: number;
  progress: SharedValue<number>;
  animated: boolean;
}) {
  const animatedProps = useGogoLoadingRing(progress, delay, animated);
  return (
    <AnimatedGroup animatedProps={animatedProps}>
      <Circle cx={x} cy={248} r={7} />
    </AnimatedGroup>
  );
}

export function GogoLoadingArtwork({
  width,
  animated,
}: {
  width: number;
  animated: boolean;
}) {
  const {
    bodyProps,
    shadowProps,
    antennaProps,
    eyeProps,
    pupilProps,
    rightArmProps,
    rings,
  } = useGogoLoadingMotion(animated);
  // Leave room for the antenna above the source frame during its bob.
  return (
    <Svg
      width={width}
      height={(width * 280) / 240}
      viewBox="-20 -8 240 280"
      accessible={false}
    >
      <AnimatedGroup animatedProps={shadowProps}>
        <Ellipse cx={100} cy={207} rx={50} ry={7} fill={GOGO_PALETTE.face} />
      </AnimatedGroup>
      <AnimatedGroup animatedProps={bodyProps}>
        <GogoBody antennaProps={antennaProps} antennaDasharray="30 27" />
        <AnimatedGroup animatedProps={eyeProps}>
          <Circle cx={70} cy={96} r={25} fill="#fff" />
          <Circle cx={130} cy={96} r={25} fill="#fff" />
          <AnimatedGroup animatedProps={pupilProps}>
            <Circle cx={70} cy={98} r={11} fill={GOGO_PALETTE.face} />
            <Circle cx={130} cy={98} r={11} fill={GOGO_PALETTE.face} />
            <Circle cx={74} cy={93} r={3.5} fill="#fff" />
            <Circle cx={134} cy={93} r={3.5} fill="#fff" />
          </AnimatedGroup>
        </AnimatedGroup>
        <Path
          d="M78 144Q100 156 122 144"
          fill="none"
          stroke={GOGO_PALETTE.face}
          strokeWidth={8}
          strokeLinecap="round"
        />
        <GogoArms pose="base" rightProps={rightArmProps} />
      </AnimatedGroup>
      <G fill="none" stroke={GOGO_PALETTE.limbs} strokeWidth={4.5}>
        {[72, 100, 128].map((x, index) => (
          <LoadingRing
            key={x}
            x={x}
            delay={index * 200}
            progress={rings}
            animated={animated}
          />
        ))}
      </G>
    </Svg>
  );
}
