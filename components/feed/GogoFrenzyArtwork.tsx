import {
  FEED_FRENZY_COLORS,
  type FeedFrenzyLevel,
} from "@/constants/feedFrenzy";
import { GOGO_PALETTE } from "@/constants/mascot";
import {
  useGogoEmberMotion,
  useGogoFrenzyMotion,
} from "@/hooks/useGogoFrenzyMotion";
import {
  AnimatedGroup,
  GogoArms,
  GogoBody,
} from "@/components/ui/GogoArtworkParts";
import { type ComponentProps, useId } from "react";
import type { SharedValue } from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Path,
  RadialGradient,
  Stop,
} from "react-native-svg";

const FLAME_PATHS = [
  "M20 0C23 13 38 21 38 38C38 49 30 56 20 56C10 56 2 49 2 38C2 29 7 23 11 16C13 22 15 25 18 26C16 17 17 8 20 0Z",
  "M20 18C22 27 31 32 31 42C31 49 26 54 20 54C14 54 9 49 9 42C9 36 12 32 15 28C16 32 17 34 19 34C18 28 18 23 20 18Z",
  "M20 34C21 39 25 41 25 46C25 50 23 53 20 53C17 53 15 50 15 46C15 42 18 41 18 38C19 38 19 36 20 34Z",
];
const INFERNO_PATHS = [
  FLAME_PATHS[0],
  "M20 14C23 24 33 30 33 41C33 49 27 55 20 55C13 55 7 49 7 41C7 34 11 30 14 25C15 29 17 31 19 31C17 25 18 19 20 14Z",
  "M20 28C22 34 28 38 28 45C28 50 24 54 20 54C16 54 12 50 12 45C12 40 15 38 17 34C18 36 19 37 20 37C19 33 19 31 20 28Z",
  "M20 42C21 45 24 46 24 49C24 52 22 54 20 54C18 54 16 52 16 49C16 47 18 46 18 44C19 44 19 43 20 42Z",
];
const ARTWORK = {
  1: {
    flameScale: 0.55,
    cheekColor: "#FF8F7E",
    cheekRadius: 8,
    cheekOpacity: 0.6,
    pupilX: 4,
    pupilY: 86,
    pupilRadius: 11,
    highlightX: 8,
    highlightY: 81,
    highlightRadius: 3.5,
    mouth: "M74 140Q100 164 126 140",
  },
  2: {
    flameScale: 0.92,
    cheekColor: "#FF6B5E",
    cheekRadius: 9,
    cheekOpacity: 0.75,
    pupilX: 1,
    pupilY: 97,
    pupilRadius: 9,
    highlightX: 4,
    highlightY: 93,
    highlightRadius: 3,
    mouth: "M80 138Q100 164 120 138Z",
  },
  3: {
    flameScale: 1.25,
    cheekColor: "#FF5A36",
    cheekRadius: 9,
    cheekOpacity: 0.7,
    pupilX: 1,
    pupilY: 97,
    pupilRadius: 14,
    highlightX: 6,
    highlightY: 91,
    highlightRadius: 5,
    mouth: "M72 134Q100 180 128 134Z",
  },
  4: {
    flameScale: 1.7,
    cheekColor: "#FF5A36",
    cheekRadius: 10,
    cheekOpacity: 0.8,
    pupilX: 0,
    pupilY: 96,
    pupilRadius: 0,
    highlightX: 0,
    highlightY: 96,
    highlightRadius: 0,
    mouth: "M68 132Q100 188 132 132Z",
  },
} as const;
const EMBERS = {
  1: [],
  2: [
    { x: 82, y: -14, r: 2.5, color: "#FFC93C", phase: 0 },
    { x: 120, y: -10, r: 2, color: "#FF8A2B", phase: 1.1 / 2.2 },
  ],
  3: [
    { x: 70, y: -20, r: 2.5, color: "#FFE27A", phase: 0 },
    { x: 130, y: -24, r: 3, color: "#FF9F2E", phase: 0.5 / 1.6 },
    { x: 100, y: -34, r: 2, color: "#FF5A36", phase: 1.1 / 1.6 },
  ],
  4: [
    { x: 60, y: -30, r: 3, color: "#FFD23F", phase: 0 },
    { x: 140, y: -34, r: 3.5, color: "#FF9F2E", phase: 0.2 / 1.3 },
    { x: 92, y: -48, r: 2.5, color: "#FFF6D6", phase: 0.45 / 1.3 },
    { x: 118, y: -44, r: 3, color: "#FF6B1F", phase: 0.7 / 1.3 },
    { x: 40, y: -8, r: 2.5, color: "#FFD23F", phase: 0.95 / 1.3 },
    { x: 160, y: -12, r: 2.5, color: "#FF6B1F", phase: 1.15 / 1.3 },
  ],
} as const;
const CAR_EMBERS = {
  1: [],
  2: [
    { x: 82, y: -4, r: 2.5, color: "#FFC93C", phase: 0 },
    { x: 120, y: -2, r: 2, color: "#FF8A2B", phase: 0.5 },
  ],
  3: [
    { x: 70, y: -14, r: 3, color: "#FFE27A", phase: 0 },
    { x: 130, y: -18, r: 3.5, color: "#FF9F2E", phase: 0.5 / 1.4 },
    { x: 100, y: -30, r: 2.5, color: "#FF5A36", phase: 1 / 1.4 },
  ],
  4: [
    { x: 60, y: -20, r: 3, color: "#FFD23F", phase: 0 },
    { x: 140, y: -24, r: 3.5, color: "#FF9F2E", phase: 0.2 / 1.2 },
    { x: 92, y: -38, r: 2.5, color: "#FFF6D6", phase: 0.4 / 1.2 },
    { x: 118, y: -34, r: 3, color: "#FF6B1F", phase: 0.6 / 1.2 },
    { x: 40, y: 0, r: 2.5, color: "#FFD23F", phase: 0.8 / 1.2 },
    { x: 160, y: -2, r: 2.5, color: "#FF6B1F", phase: 1 / 1.2 },
  ],
} as const;
type EmberShape = (typeof EMBERS | typeof CAR_EMBERS)[FeedFrenzyLevel][number];
function Ember({
  piece,
  progress,
  level,
  animated,
  inCar,
}: {
  piece: EmberShape;
  progress: SharedValue<number>;
  level: FeedFrenzyLevel;
  animated: boolean;
  inCar: boolean;
}) {
  const animatedProps = useGogoEmberMotion(
    progress,
    piece.phase,
    level,
    animated,
    inCar,
  );
  return (
    <AnimatedGroup animatedProps={animatedProps}>
      <Circle cx={piece.x} cy={piece.y} r={piece.r} fill={piece.color} />
    </AnimatedGroup>
  );
}
export function GogoFrenzyFlame({
  transform,
  animatedProps,
  level,
  kind = "main",
}: {
  transform: string;
  animatedProps: NonNullable<
    ComponentProps<typeof AnimatedGroup>["animatedProps"]
  >;
  level: FeedFrenzyLevel;
  kind?: "main" | "side" | "tire";
}) {
  const palette = FEED_FRENZY_COLORS[level];
  const paths =
    kind === "main"
      ? level === 4
        ? INFERNO_PATHS
        : FLAME_PATHS
      : FLAME_PATHS.slice(0, 2);
  const colors =
    kind === "main"
      ? palette
      : [palette[0], kind === "tire" ? palette[2] : "#FF9F2E"];
  return (
    <G transform={transform}>
      <AnimatedGroup animatedProps={animatedProps}>
        {paths.map((path, index) => (
          <Path key={path} d={path} fill={colors[index]} />
        ))}
      </AnimatedGroup>
    </G>
  );
}

export function GogoFrenzyCharacter({
  level,
  motion,
  animated,
  inCar = false,
}: {
  level: FeedFrenzyLevel;
  motion: ReturnType<typeof useGogoFrenzyMotion>;
  animated: boolean;
  inCar?: boolean;
}) {
  const config = ARTWORK[level];
  return (
    <>
      <GogoBody
        showFeet={!inCar}
        cheekColor={config.cheekColor}
        cheekRadius={config.cheekRadius}
        cheekOpacity={config.cheekOpacity}
        headwear={
          <>
            <GogoFrenzyFlame
              transform={`translate(100 9) scale(${config.flameScale}) translate(-20 -56)`}
              animatedProps={motion.flameProps}
              level={level}
            />
            {level >= 3
              ? (level === 4 ? [58, 142] : [60, 140]).map((x, index) => (
                  <GogoFrenzyFlame
                    key={x}
                    transform={`translate(${x} ${level === 4 ? 52 : 50}) rotate(${(index === 0 ? -1 : 1) * (level === 4 ? 34 : 30)}) scale(${level === 4 ? 0.62 : 0.42}) translate(-20 -56)`}
                    animatedProps={motion.sideProps}
                    level={level}
                    kind="side"
                  />
                ))
              : null}
            {(inCar ? CAR_EMBERS : EMBERS)[level].map((piece) => (
              <Ember
                key={piece.x}
                piece={piece}
                progress={motion.embers}
                level={level}
                animated={animated}
                inCar={inCar}
              />
            ))}
          </>
        }
      />
      <AnimatedGroup animatedProps={motion.eyeProps}>
        {[70, 130].map((x, index) => (
          <G key={x}>
            <Circle cx={x} cy={96} r={level === 1 ? 25 : 26} fill="#fff" />
            {level === 4 ? (
              <AnimatedGroup
                animatedProps={
                  index === 0 ? motion.leftStarProps : motion.rightStarProps
                }
              >
                <Path
                  d={`M${x} 78L${x + 5} 91L${x + 18} 96L${x + 5} 101L${x} 114L${x - 5} 101L${x - 18} 96L${x - 5} 91Z`}
                  fill="#FF8A00"
                />
              </AnimatedGroup>
            ) : (
              <>
                <Circle
                  cx={x + config.pupilX}
                  cy={config.pupilY}
                  r={config.pupilRadius}
                  fill={GOGO_PALETTE.face}
                />
                <Circle
                  cx={x + config.highlightX}
                  cy={config.highlightY}
                  r={config.highlightRadius}
                  fill="#fff"
                />
              </>
            )}
          </G>
        ))}
      </AnimatedGroup>
      <Path
        d={config.mouth}
        fill={level === 1 ? "none" : GOGO_PALETTE.face}
        stroke={GOGO_PALETTE.face}
        strokeWidth={level === 1 ? 8 : 6}
        strokeLinecap={level === 1 ? "round" : undefined}
        strokeLinejoin={level === 1 ? undefined : "round"}
      />
      <GogoArms
        pose={level === 1 ? "base" : level === 2 ? "heating" : "celebrate"}
        leftProps={motion.leftArmProps}
        rightProps={motion.rightArmProps}
      />
    </>
  );
}

export function GogoFrenzyArtwork({
  level,
  size,
  animated,
}: {
  level: FeedFrenzyLevel;
  size: number;
  animated: boolean;
}) {
  const motion = useGogoFrenzyMotion(level, animated);
  const auraId = `gogo-frenzy-aura-${useId()}`;
  return (
    // Allow room for Inferno's flame, embers and aura at the top of its hop.
    <Svg
      width={size}
      height={size}
      viewBox="-48 -145 296 365"
      accessible={false}
    >
      {level === 4 ? (
        <>
          <Defs>
            <RadialGradient id={auraId} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#FF8A2B" stopOpacity={0.6} />
              <Stop offset="0.6" stopColor="#FF5A36" stopOpacity={0.22} />
              <Stop offset="1" stopColor="#FF5A36" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <AnimatedGroup animatedProps={motion.auraProps}>
            <Ellipse
              cx={100}
              cy={60}
              rx={130}
              ry={150}
              fill={`url(#${auraId})`}
            />
          </AnimatedGroup>
        </>
      ) : null}
      <AnimatedGroup animatedProps={motion.shadowProps}>
        <Ellipse cx={100} cy={207} rx={50} ry={7} fill={GOGO_PALETTE.face} />
      </AnimatedGroup>
      <AnimatedGroup animatedProps={motion.shakeProps}>
        <AnimatedGroup animatedProps={motion.bodyProps}>
          <GogoFrenzyCharacter
            level={level}
            motion={motion}
            animated={animated}
          />
        </AnimatedGroup>
      </AnimatedGroup>
    </Svg>
  );
}
