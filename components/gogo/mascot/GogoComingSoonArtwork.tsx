import { GOGO_PALETTE } from "@/components/gogo/mascot/constants";
import {
  useGogoComingSoonCode,
  useGogoComingSoonMotion,
} from "@/components/gogo/mascot/motion/useGogoComingSoonMotion";
import type { SharedValue } from "react-native-reanimated";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import { AnimatedGroup } from "@/components/gogo/mascot/GogoArtworkParts";

function CodeSymbol({
  d,
  delay,
  progress,
  animated,
}: {
  d: string;
  delay: number;
  progress: SharedValue<number>;
  animated: boolean;
}) {
  const animatedProps = useGogoComingSoonCode(progress, delay, animated);
  return (
    <AnimatedGroup animatedProps={animatedProps}>
      <Path d={d} />
    </AnimatedGroup>
  );
}

export function GogoComingSoonArtwork({
  width,
  animated,
}: {
  width: number;
  animated: boolean;
}) {
  const {
    bodyProps,
    leftArmProps,
    rightArmProps,
    eyeProps,
    pupilProps,
    antennaProps,
    glowProps,
    sweatProps,
    particles,
  } = useGogoComingSoonMotion(animated);
  return (
    <Svg
      width={width}
      height={(width * 270) / 260}
      viewBox="-30 -40 260 270"
      accessible={false}
    >
      <Ellipse
        cx="100"
        cy="226"
        rx="96"
        ry="8"
        fill={GOGO_PALETTE.face}
        opacity="0.12"
      />
      <AnimatedGroup animatedProps={bodyProps}>
        <Rect
          x="26"
          y="34"
          width="148"
          height="164"
          rx="74"
          fill={GOGO_PALETTE.body}
        />
        <Circle
          cx="44"
          cy="136"
          r="8"
          fill={GOGO_PALETTE.blush}
          opacity="0.7"
        />
        <Circle
          cx="156"
          cy="136"
          r="8"
          fill={GOGO_PALETTE.blush}
          opacity="0.7"
        />
        <AnimatedGroup animatedProps={eyeProps}>
          <Circle cx="70" cy="96" r="25" fill="#fff" />
          <Circle cx="130" cy="96" r="25" fill="#fff" />
          <AnimatedGroup animatedProps={pupilProps}>
            <Circle cx="70" cy="107" r="11" fill={GOGO_PALETTE.face} />
            <Circle cx="130" cy="107" r="11" fill={GOGO_PALETTE.face} />
            <Circle cx="74" cy="102" r="3.5" fill="#fff" />
            <Circle cx="134" cy="102" r="3.5" fill="#fff" />
          </AnimatedGroup>
        </AnimatedGroup>
        <Path
          d="M46 62L90 72"
          stroke={GOGO_PALETTE.face}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <Path
          d="M154 62L110 72"
          stroke={GOGO_PALETTE.face}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <Path d="M110 148Q110 160 119 156Q122 148 114 146Z" fill="#FF7A8A" />
        <Path
          d="M84 144Q100 152 116 144"
          fill="none"
          stroke={GOGO_PALETTE.face}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <Path d="M44 50C44 8 156 8 156 50Z" fill={GOGO_PALETTE.yellow} />
        <Path d="M92 50V22Q100 18 108 22V50Z" fill="#F5B800" />
        <Path
          d="M60 38Q68 22 88 17"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.55"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <Rect x="34" y="44" width="132" height="12" rx="6" fill="#FFC72E" />
        <Rect x="34" y="52" width="132" height="4" rx="2" fill="#E0A800" />
        <Path
          d="M100 20V9"
          stroke={GOGO_PALETTE.limbs}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <AnimatedGroup animatedProps={antennaProps}>
          <Circle
            cx="100"
            cy="0"
            r="9"
            fill="none"
            stroke={GOGO_PALETTE.limbs}
            strokeWidth="5"
          />
        </AnimatedGroup>
        <AnimatedGroup animatedProps={sweatProps}>
          <Path
            d="M162 74C158 82 154 86 162 92C170 86 166 82 162 74Z"
            fill="#8FD9F7"
          />
        </AnimatedGroup>
      </AnimatedGroup>
      <Rect
        x="4"
        y="212"
        width="192"
        height="10"
        rx="5"
        fill={GOGO_PALETTE.face}
      />
      <Rect x="14" y="160" width="172" height="54" rx="10" fill="#17524A" />
      <Rect
        x="20"
        y="166"
        width="160"
        height="42"
        rx="6"
        fill="none"
        stroke="#1F6D61"
        strokeWidth="2"
      />
      <AnimatedGroup animatedProps={glowProps}>
        <Circle cx="100" cy="187" r="19" fill={GOGO_PALETTE.body} />
      </AnimatedGroup>
      <Circle
        cx="100"
        cy="187"
        r="11"
        fill="none"
        stroke={GOGO_PALETTE.body}
        strokeWidth="5"
      />
      <AnimatedGroup animatedProps={leftArmProps}>
        <Path
          d="M28 128Q10 152 44 158"
          fill="none"
          stroke={GOGO_PALETTE.limbs}
          strokeWidth="12"
          strokeLinecap="round"
        />
        <Circle cx="46" cy="158" r="10" fill={GOGO_PALETTE.limbs} />
      </AnimatedGroup>
      <AnimatedGroup animatedProps={rightArmProps}>
        <Path
          d="M172 128Q190 152 156 158"
          fill="none"
          stroke={GOGO_PALETTE.limbs}
          strokeWidth="12"
          strokeLinecap="round"
        />
        <Circle cx="154" cy="158" r="10" fill={GOGO_PALETTE.limbs} />
      </AnimatedGroup>
      <G
        fill="none"
        stroke={GOGO_PALETTE.limbs}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <CodeSymbol
          d="M-14 138l-7 6 7 6M-2 138l7 6-7 6M-9 136l2 16"
          delay={0}
          progress={particles}
          animated={animated}
        />
        <CodeSymbol
          d="M200 128l-7 6 7 6M212 128l7 6-7 6M205 126l2 16"
          delay={900}
          progress={particles}
          animated={animated}
        />
        <CodeSymbol
          d="M-8 112l-7 6 7 6M4 112l7 6-7 6M-3 110l2 16"
          delay={1700}
          progress={particles}
          animated={animated}
        />
      </G>
    </Svg>
  );
}
