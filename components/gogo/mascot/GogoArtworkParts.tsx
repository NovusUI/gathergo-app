import { GOGO_PALETTE, type GogoPose } from "@/components/gogo/mascot/constants";
import type { ComponentProps, ReactNode } from "react";
import Animated from "react-native-reanimated";
import { Circle, Ellipse, G, Path, Rect } from "react-native-svg";

export const AnimatedGroup = Animated.createAnimatedComponent(G);
type GroupAnimation = NonNullable<
  ComponentProps<typeof AnimatedGroup>["animatedProps"]
>;

export function GogoBody({
  antennaProps,
  celebrating = false,
  antennaDasharray = celebrating ? "40 17" : undefined,
  cheekColor = GOGO_PALETTE.blush,
  cheekRadius = 8,
  cheekOpacity = 0.55,
  headwear,
  showFeet = true,
}: {
  antennaProps?: GroupAnimation;
  celebrating?: boolean;
  antennaDasharray?: string;
  cheekColor?: string;
  cheekRadius?: number;
  cheekOpacity?: number;
  headwear?: ReactNode;
  showFeet?: boolean;
}) {
  const antenna = (
    <Circle
      cx={100}
      cy={14}
      r={9}
      fill="none"
      stroke={GOGO_PALETTE.limbs}
      strokeWidth={5}
      strokeDasharray={antennaDasharray}
    />
  );
  return (
    <>
      {showFeet ? (
        <>
          <Ellipse cx={76} cy={199} rx={16} ry={9} fill={GOGO_PALETTE.limbs} />
          <Ellipse cx={124} cy={199} rx={16} ry={9} fill={GOGO_PALETTE.limbs} />
        </>
      ) : null}
      {headwear}
      <Path
        d="M100 23V36"
        stroke={GOGO_PALETTE.limbs}
        strokeWidth={5}
        strokeLinecap="round"
      />
      {antennaProps ? (
        <AnimatedGroup animatedProps={antennaProps}>{antenna}</AnimatedGroup>
      ) : (
        antenna
      )}
      <Rect
        x={26}
        y={34}
        width={148}
        height={164}
        rx={74}
        fill={GOGO_PALETTE.body}
      />
      {[44, 156].map((x) => (
        <Circle
          key={x}
          cx={x}
          cy={136}
          r={cheekRadius}
          fill={cheekColor}
          opacity={cheekOpacity}
        />
      ))}
    </>
  );
}

type ArmShape = { path: string; hand: { x: number; y: number } | null };
const ARMS = {
  base: [
    { path: "M28 128Q8 140 14 160", hand: null },
    { path: "M172 128Q192 140 186 160", hand: null },
  ],
  wave: [
    { path: "M28 128Q8 140 14 160", hand: null },
    { path: "M172 124Q198 112 190 80", hand: { x: 190, y: 75 } },
  ],
  celebrate: [
    { path: "M28 124Q2 108 10 70", hand: { x: 10, y: 65 } },
    { path: "M172 124Q198 108 190 70", hand: { x: 190, y: 65 } },
  ],
  lost: [
    { path: "M28 130Q4 128 8 108", hand: { x: 8, y: 103 } },
    { path: "M172 130Q196 128 192 108", hand: { x: 192, y: 103 } },
  ],
  heating: [
    { path: "M28 126Q4 120 6 94", hand: { x: 6, y: 89 } },
    { path: "M172 126Q196 120 194 94", hand: { x: 194, y: 89 } },
  ],
} satisfies Record<GogoPose | "heating", [ArmShape, ArmShape]>;

export function GogoArms({
  pose,
  leftProps,
  rightProps,
}: {
  pose: keyof typeof ARMS;
  leftProps?: GroupAnimation;
  rightProps: GroupAnimation;
}) {
  return ARMS[pose].map((arm, index) => {
    const animatedProps = index === 0 ? leftProps : rightProps;
    const artwork = (
      <>
        <Path
          d={arm.path}
          fill="none"
          stroke={GOGO_PALETTE.limbs}
          strokeWidth={12}
          strokeLinecap="round"
        />
        {arm.hand ? (
          <Circle
            cx={arm.hand.x}
            cy={arm.hand.y}
            r={10}
            fill={GOGO_PALETTE.limbs}
          />
        ) : null}
      </>
    );
    return animatedProps ? (
      <AnimatedGroup key={index} animatedProps={animatedProps}>
        {artwork}
      </AnimatedGroup>
    ) : (
      <G key={index}>{artwork}</G>
    );
  });
}
