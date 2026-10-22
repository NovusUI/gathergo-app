import { AnimatedGroup } from "@/components/gogo/mascot/GogoArtworkParts";
import { GOGO_PALETTE } from "@/components/gogo/mascot/constants";
import { useGogoCarMotion } from "@/components/gogo/mascot/motion/useGogoCarMotion";
import { useGogoFrenzyMotion } from "@/components/gogo/mascot/motion/useGogoFrenzyMotion";
import { type ComponentProps, useId } from "react";
import Animated from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import {
  GogoFrenzyCharacter,
  GogoFrenzyFlame,
  type GogoFrenzyArtwork,
} from "@/components/gogo/mascot/GogoFrenzyArtwork";

const AnimatedLine = Animated.createAnimatedComponent(Line);
const RAYS = [
  [350, 190, 390, 190],
  [330, 265, 364.5, 285],
  [275, 320, 295, 354.5],
  [200, 340, 200, 380],
  [125, 320, 105, 354.5],
  [70, 265, 35.5, 285],
  [50, 190, 10, 190],
  [70, 115, 35.5, 95],
  [125, 60, 105, 25.5],
  [200, 40, 200, 0],
  [275, 60, 295, 25.5],
  [330, 115, 364.5, 95],
] as const;

export function GogoCarFrenzyArtwork({
  level,
  size,
  animated,
}: ComponentProps<typeof GogoFrenzyArtwork>) {
  const car = useGogoCarMotion(level, animated);
  const character = useGogoFrenzyMotion(level, animated, true);
  const auraId = `gogo-car-aura-${useId()}`;
  const rays = RAYS.filter((_, index) => level !== 1 || index !== 3).map(
    ([x1, y1, x2, y2]) => (
      <Line key={`${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} />
    ),
  );
  return (
    // Include the widest ray pulse and Inferno aura without clipping them.
    <Svg
      width={size}
      height={size}
      viewBox="-90 -90 580 570"
      accessible={false}
    >
      {level === 4 ? (
        <>
          <Defs>
            <RadialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#FF8A2B" stopOpacity={0.55} />
              <Stop offset="0.6" stopColor="#FF5A36" stopOpacity={0.2} />
              <Stop offset="1" stopColor="#FF5A36" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <AnimatedGroup animatedProps={car.auraProps}>
            <Ellipse
              cx={200}
              cy={160}
              rx={260}
              ry={220}
              fill={`url(#${auraId})`}
            />
          </AnimatedGroup>
        </>
      ) : null}
      <G
        stroke={level === 4 ? "#FF8A2B" : GOGO_PALETTE.limbs}
        strokeWidth={5}
        strokeLinecap="round"
      >
        <AnimatedGroup animatedProps={car.rayProps}>{rays}</AnimatedGroup>
        {level >= 3 ? (
          <AnimatedGroup animatedProps={car.secondRayProps}>
            {rays}
          </AnimatedGroup>
        ) : null}
      </G>
      <Ellipse
        cx={200}
        cy={332}
        rx={160}
        ry={14}
        fill={GOGO_PALETTE.face}
        opacity={level === 4 ? 0.16 : 0.14}
      />
      <AnimatedGroup animatedProps={car.zoomProps}>
        <AnimatedGroup animatedProps={car.bounceProps}>
          <AnimatedGroup animatedProps={car.shakeProps}>
            <AnimatedGroup animatedProps={character.bodyProps}>
              <G transform="translate(128 60) scale(0.72)">
                <GogoFrenzyCharacter
                  level={level}
                  motion={character}
                  animated={animated}
                  inCar
                />
              </G>
            </AnimatedGroup>
            {level === 4
              ? [46, 354].map((x, index) => (
                  <GogoFrenzyFlame
                    key={x}
                    transform={`translate(${x} 300) rotate(${index === 0 ? -25 : 25}) scale(0.45) translate(-20 -56)`}
                    animatedProps={car.tireProps}
                    level={level}
                    kind="tire"
                  />
                ))
              : null}
            {[52, 316].map((x) => (
              <Rect
                key={x}
                x={x}
                y={262}
                width={32}
                height={68}
                rx={13}
                fill={GOGO_PALETTE.face}
              />
            ))}
            {[68, 332].map((x) => (
              <AnimatedLine
                key={x}
                animatedProps={car.treadProps}
                x1={x}
                y1={266}
                x2={x}
                y2={326}
                stroke="#17524A"
                strokeWidth={22}
                strokeDasharray="6 10"
              />
            ))}
            <Rect
              x={70}
              y={200}
              width={260}
              height={92}
              rx={30}
              fill={GOGO_PALETTE.coral}
            />
            <Rect
              x={190}
              y={200}
              width={20}
              height={46}
              fill={GOGO_PALETTE.yellow}
            />
            <Path
              d="M112 200L128 168L272 168L288 200Z"
              fill="#D5F7EF"
              fillOpacity={0.45}
              stroke={GOGO_PALETTE.face}
              strokeWidth={5}
              strokeLinejoin="round"
            />
            {[102, 298].map((x) => (
              <Circle key={x} cx={x} cy={190} r={9} fill="#D93A5C" />
            ))}
            <AnimatedGroup animatedProps={car.glowProps}>
              {[120, 280].map((x) => (
                <Circle
                  key={x}
                  cx={x}
                  cy={238}
                  r={level === 1 ? 28 : level === 4 ? 34 : 30}
                  fill={GOGO_PALETTE.yellow}
                />
              ))}
            </AnimatedGroup>
            {[120, 280].map((x) => (
              <Circle
                key={x}
                cx={x}
                cy={238}
                r={18}
                fill="#FFF3B0"
                stroke={GOGO_PALETTE.body}
                strokeWidth={7}
              />
            ))}
            <Path
              d="M160 262Q200 288 240 262"
              fill="none"
              stroke={GOGO_PALETTE.face}
              strokeWidth={8}
              strokeLinecap="round"
            />
            <Rect
              x={84}
              y={284}
              width={232}
              height={16}
              rx={8}
              fill="#D93A5C"
            />
            <Rect
              x={172}
              y={286}
              width={56}
              height={12}
              rx={4}
              fill={GOGO_PALETTE.yellow}
            />
          </AnimatedGroup>
        </AnimatedGroup>
      </AnimatedGroup>
    </Svg>
  );
}
