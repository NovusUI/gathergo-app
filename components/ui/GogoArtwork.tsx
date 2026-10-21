import { GOGO_PALETTE, type GogoPose } from "@/constants/mascot";
import { useGogoConfetti, useGogoMotion } from "@/hooks/useGogoMotion";
import type { SharedValue } from "react-native-reanimated";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import { AnimatedGroup, GogoArms, GogoBody } from "./GogoArtworkParts";

const CONFETTI = [
  { x: 30, width: 10, color: GOGO_PALETTE.coral, phase: 0, circle: false },
  {
    x: 68,
    width: 9,
    color: GOGO_PALETTE.yellow,
    phase: 0.5 / 2.4,
    circle: false,
  },
  {
    x: 112,
    width: 10,
    color: GOGO_PALETTE.face,
    phase: 1 / 2.4,
    circle: false,
  },
  {
    x: 150,
    width: 9,
    color: GOGO_PALETTE.limbs,
    phase: 1.5 / 2.4,
    circle: false,
  },
  { x: 14, width: 8, color: GOGO_PALETTE.yellow, phase: 2 / 2.4, circle: true },
  {
    x: 188,
    width: 8,
    color: GOGO_PALETTE.coral,
    phase: 0.25 / 2.4,
    circle: true,
  },
] as const;

function ConfettiPiece({
  piece,
  progress,
  animated,
}: {
  piece: (typeof CONFETTI)[number];
  progress: SharedValue<number>;
  animated: boolean;
}) {
  const animatedProps = useGogoConfetti(progress, piece.phase, animated);
  return (
    <AnimatedGroup animatedProps={animatedProps}>
      {piece.circle ? (
        <Circle cx={piece.x} cy={0} r={4} fill={piece.color} />
      ) : (
        <Rect
          x={piece.x}
          y={0}
          width={piece.width}
          height={5}
          rx={1}
          fill={piece.color}
        />
      )}
    </AnimatedGroup>
  );
}

export function GogoArtwork({
  pose,
  size,
  animated,
}: {
  pose: GogoPose;
  size: number;
  animated: boolean;
}) {
  const {
    bodyProps,
    shadowProps,
    antennaProps,
    eyeProps,
    pupilProps,
    leftArmProps,
    rightArmProps,
    helloProps,
    confetti,
  } = useGogoMotion(pose, animated);

  return (
    <Svg
      width={size}
      height={size}
      viewBox={pose === "base" ? "0 0 200 220" : "-12 -4 224 228"}
      accessible={false}
    >
      {pose === "celebrate"
        ? CONFETTI.map((piece) => (
            <ConfettiPiece
              key={piece.x}
              piece={piece}
              progress={confetti}
              animated={animated}
            />
          ))
        : null}
      <AnimatedGroup animatedProps={shadowProps}>
        <Ellipse cx={100} cy={207} rx={50} ry={7} fill={GOGO_PALETTE.face} />
      </AnimatedGroup>
      <AnimatedGroup animatedProps={bodyProps}>
        <GogoBody
          antennaProps={antennaProps}
          celebrating={pose === "celebrate"}
        />
        {pose === "celebrate" ? (
          <G
            fill="none"
            stroke={GOGO_PALETTE.face}
            strokeWidth={7}
            strokeLinecap="round"
          >
            <Path d="M48 102Q70 78 92 102" />
            <Path d="M108 102Q130 78 152 102" />
          </G>
        ) : (
          <AnimatedGroup animatedProps={eyeProps}>
            <Circle cx={70} cy={96} r={25} fill="#fff" />
            <Circle cx={130} cy={96} r={25} fill="#fff" />
            <AnimatedGroup animatedProps={pupilProps}>
              <Circle cx={72} cy={99} r={11} fill={GOGO_PALETTE.face} />
              <Circle cx={132} cy={99} r={11} fill={GOGO_PALETTE.face} />
              <Circle cx={76} cy={94} r={3.5} fill="#fff" />
              <Circle cx={136} cy={94} r={3.5} fill="#fff" />
            </AnimatedGroup>
          </AnimatedGroup>
        )}
        {pose === "celebrate" ? (
          <Path
            d="M70 132Q100 178 130 132Z"
            fill={GOGO_PALETTE.face}
            stroke={GOGO_PALETTE.face}
            strokeWidth={6}
            strokeLinejoin="round"
          />
        ) : pose === "lost" ? (
          <Ellipse cx={100} cy={148} rx={9} ry={7} fill={GOGO_PALETTE.face} />
        ) : (
          <Path
            d="M74 140Q100 166 126 140"
            fill="none"
            stroke={GOGO_PALETTE.face}
            strokeWidth={8}
            strokeLinecap="round"
          />
        )}
        <GogoArms
          pose={pose}
          leftProps={leftArmProps}
          rightProps={rightArmProps}
        />
        {pose === "lost" ? (
          <G
            fill="none"
            stroke={GOGO_PALETTE.body}
            strokeWidth={6}
            strokeLinecap="round"
          >
            <Path d="M150 29C150 7 184 7 185 28C186 42 171 42 171 52V57" />
            <Circle
              cx={171}
              cy={69}
              r={3.5}
              fill={GOGO_PALETTE.body}
              stroke="none"
            />
          </G>
        ) : null}
        {pose === "wave" ? (
          <G transform="translate(-12 -8)">
            <AnimatedGroup animatedProps={helloProps}>
              <Path
                d="M176 52Q184 44 192 52M200 44Q208 36 216 44"
                fill="none"
                stroke={GOGO_PALETTE.limbs}
                strokeWidth={4}
                strokeLinecap="round"
              />
            </AnimatedGroup>
          </G>
        ) : null}
      </AnimatedGroup>
    </Svg>
  );
}
