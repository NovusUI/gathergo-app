import { GOGO_PALETTE } from "@/constants/mascot";
import {
  GOGO_STARTUP_BACKGROUND,
  type StartupTrackName,
} from "@/constants/gogoStartup";
import {
  useStartupGroup,
  useStartupRing,
  useStartupStroke,
} from "@/hooks/useGogoStartupMotion";
import type { ReactNode } from "react";
import Animated, { type SharedValue } from "react-native-reanimated";
import Svg, {
  Circle,
  Ellipse,
  G,
  Path,
  Rect,
  type PathProps,
} from "react-native-svg";
import { AnimatedGroup } from "./GogoArtworkParts";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
type StartupMotion = { progress: SharedValue<number>; animated: boolean };

function StartupGroup({
  motion,
  name,
  originX,
  originY,
  children,
}: {
  motion: StartupMotion;
  name: StartupTrackName;
  originX: number;
  originY: number;
  children: ReactNode;
}) {
  const props = useStartupGroup(
    motion.progress,
    name,
    originX,
    originY,
    motion.animated,
  );
  return <AnimatedGroup animatedProps={props}>{children}</AnimatedGroup>;
}

function StartupPath({
  motion,
  name,
  length,
  ...props
}: PathProps & {
  motion: StartupMotion;
  name: StartupTrackName;
  length: number;
}) {
  const animatedProps = useStartupStroke(
    motion.progress,
    name,
    length,
    motion.animated,
  );
  return (
    <AnimatedPath
      {...props}
      strokeDasharray={[length, length * 2]}
      animatedProps={animatedProps}
    />
  );
}

function StartupRing({
  motion,
  name,
}: {
  motion: StartupMotion;
  name: "ring1c" | "ring2c" | "ring3c";
}) {
  const props = useStartupRing(motion.progress, name, motion.animated);
  return (
    <AnimatedCircle
      r={24}
      fill="none"
      strokeWidth={12}
      strokeDasharray={[2 * Math.PI * 24, 4 * Math.PI * 24]}
      animatedProps={props}
    />
  );
}

export function GogoStartupArtwork({
  progress,
  animated,
  size,
}: StartupMotion & { size: number }) {
  const motion = { progress, animated };
  return (
    <Svg
      width={size}
      height={size}
      viewBox="-50 -30 300 300"
      accessible={false}
    >
      <Rect
        x="-50"
        y="-30"
        width="300"
        height="300"
        fill={GOGO_STARTUP_BACKGROUND}
      />
      <G>
        <StartupGroup motion={motion} name="shadow" originX={100} originY={207}>
          <Ellipse cx="100" cy="207" rx="50" ry="7" fill={GOGO_PALETTE.face} />
        </StartupGroup>
        <StartupGroup motion={motion} name="shock" originX={100} originY={116}>
          <Circle
            cx="100"
            cy="116"
            r="18"
            fill="none"
            stroke={GOGO_PALETTE.body}
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
          />
        </StartupGroup>
        <StartupGroup motion={motion} name="pop" originX={100} originY={200}>
          <StartupGroup motion={motion} name="idle" originX={0} originY={0}>
            <StartupGroup
              motion={motion}
              name="foot1"
              originX={76}
              originY={199}
            >
              <Ellipse
                cx="76"
                cy="199"
                rx="16"
                ry="9"
                fill={GOGO_PALETTE.limbs}
              />
            </StartupGroup>
            <StartupGroup
              motion={motion}
              name="foot2"
              originX={124}
              originY={199}
            >
              <Ellipse
                cx="124"
                cy="199"
                rx="16"
                ry="9"
                fill={GOGO_PALETTE.limbs}
              />
            </StartupGroup>
            <StartupPath
              motion={motion}
              name="stalk"
              length={13}
              d="M100 23V36"
              stroke={GOGO_PALETTE.limbs}
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            <StartupGroup
              motion={motion}
              name="smile1"
              originX={0}
              originY={48}
            >
              <Path
                d="M-18 44Q0 60 18 44"
                fill="none"
                stroke={GOGO_PALETTE.body}
                strokeWidth="11"
                strokeLinecap="round"
              />
            </StartupGroup>
            <StartupGroup
              motion={motion}
              name="smile2"
              originX={0}
              originY={48}
            >
              <Path
                d="M-18 44Q0 60 18 44"
                fill="none"
                stroke={GOGO_PALETTE.body}
                strokeWidth="11"
                strokeLinecap="round"
              />
            </StartupGroup>
            <StartupGroup
              motion={motion}
              name="body"
              originX={100}
              originY={116}
            >
              <Rect
                x="26"
                y="34"
                width="148"
                height="164"
                rx="74"
                fill={GOGO_PALETTE.body}
              />
            </StartupGroup>
            <StartupGroup motion={motion} name="cheeks" originX={0} originY={0}>
              <Circle cx="44" cy="136" r="8" fill={GOGO_PALETTE.blush} />
              <Circle cx="156" cy="136" r="8" fill={GOGO_PALETTE.blush} />
            </StartupGroup>
            <StartupGroup motion={motion} name="ring3" originX={0} originY={0}>
              <StartupRing motion={motion} name="ring3c" />
            </StartupGroup>
            <G>
              <StartupGroup motion={motion} name="eye1" originX={0} originY={0}>
                <StartupRing motion={motion} name="ring1c" />
                <StartupGroup
                  motion={motion}
                  name="disc1"
                  originX={0}
                  originY={0}
                >
                  <Circle r="30" fill="#fff" />
                </StartupGroup>
              </StartupGroup>
              <StartupGroup motion={motion} name="eye2" originX={0} originY={0}>
                <StartupRing motion={motion} name="ring2c" />
                <StartupGroup
                  motion={motion}
                  name="disc2"
                  originX={0}
                  originY={0}
                >
                  <Circle r="30" fill="#fff" />
                </StartupGroup>
              </StartupGroup>
              <StartupGroup motion={motion} name="look" originX={0} originY={0}>
                <StartupGroup
                  motion={motion}
                  name="pup1"
                  originX={72}
                  originY={99}
                >
                  <Circle cx="72" cy="99" r="11" fill={GOGO_PALETTE.face} />
                  <Circle cx="76" cy="94" r="3.5" fill="#fff" />
                </StartupGroup>
                <StartupGroup
                  motion={motion}
                  name="pup2"
                  originX={132}
                  originY={99}
                >
                  <Circle cx="132" cy="99" r="11" fill={GOGO_PALETTE.face} />
                  <Circle cx="136" cy="94" r="3.5" fill="#fff" />
                </StartupGroup>
              </StartupGroup>
            </G>
            <StartupPath
              motion={motion}
              name="mouth"
              length={59.685264}
              d="M74 140Q100 166 126 140"
              fill="none"
              stroke={GOGO_PALETTE.face}
              strokeWidth="8"
              strokeLinecap="round"
            />
            <StartupPath
              motion={motion}
              name="armL"
              length={38.162993}
              d="M28 128Q8 140 14 160"
              fill="none"
              stroke={GOGO_PALETTE.limbs}
              strokeWidth="12"
              strokeLinecap="round"
            />
            <StartupGroup
              motion={motion}
              name="wave"
              originX={172}
              originY={128}
            >
              <StartupPath
                motion={motion}
                name="armR"
                length={55.521111}
                d="M172 128Q198 112 190 80"
                fill="none"
                stroke={GOGO_PALETTE.limbs}
                strokeWidth="12"
                strokeLinecap="round"
              />
              <StartupGroup
                motion={motion}
                name="hand"
                originX={190}
                originY={75}
              >
                <Circle cx="190" cy="75" r="10" fill={GOGO_PALETTE.limbs} />
              </StartupGroup>
            </StartupGroup>
          </StartupGroup>
        </StartupGroup>
      </G>
    </Svg>
  );
}
