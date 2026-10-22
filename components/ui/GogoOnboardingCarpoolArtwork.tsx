import {
  useGogoOnboardingCarpoolMotion,
  useGogoOnboardingSparkle,
  useGogoOnboardingSpeed,
} from "@/hooks/useGogoOnboardingCarpoolMotion";
import Animated, { type SharedValue } from "react-native-reanimated";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import { AnimatedGroup } from "./GogoArtworkParts";

const AnimatedPath = Animated.createAnimatedComponent(Path);

function Sparkle({
  d,
  fill,
  x,
  y,
  delay,
  progress,
  animated,
}: {
  d: string;
  fill: string;
  x: number;
  y: number;
  delay: number;
  progress: SharedValue<number>;
  animated: boolean;
}) {
  const animatedProps = useGogoOnboardingSparkle(
    progress,
    delay,
    x,
    y,
    animated,
  );
  return (
    <AnimatedGroup animatedProps={animatedProps}>
      <Path d={d} fill={fill} />
    </AnimatedGroup>
  );
}

function SpeedLine({
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
  const animatedProps = useGogoOnboardingSpeed(progress, delay, animated);
  return (
    <AnimatedGroup animatedProps={animatedProps}>
      <Path d={d} />
    </AnimatedGroup>
  );
}

export function GogoOnboardingCarpoolArtwork({
  width,
  height,
  animated,
}: {
  width: number;
  height: number;
  animated: boolean;
}) {
  const {
    carProps,
    waveProps,
    rearWheelProps,
    frontWheelProps,
    roadProps,
    routeProps,
    seatProps,
    pinProps,
    heartProps,
    eyeProps,
    sparkle,
    speed,
  } = useGogoOnboardingCarpoolMotion(animated);
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 300 315"
      fill="none"
      accessible={false}
    >
      <Path
        d="M254.959 80.8857C245.286 62.3764 219.438 46.0907 198.811 43.6492C180.744 41.5106 160.014 46.0373 148.936 61.2949C144.862 66.9057 142.36 73.6001 137.916 78.915C122.634 97.1935 94.2628 90.8951 72.3821 99.3249C57.1544 105.191 45.205 118.631 38.6785 133.886C32.152 149.141 30.6215 166.068 31.7626 182.405C32.6639 195.305 35.3475 208.437 42.6571 218.766C57.9791 240.417 89.563 243.588 115.098 234.928C123.051 232.231 130.8 228.581 139.031 227.243C147.262 225.905 156.405 227.308 161.939 233.405C166.353 238.269 167.854 245.367 172.239 250.259C178.205 256.917 188.559 258.045 197.176 255.057C205.792 252.068 212.954 245.665 219.257 238.865C245.668 210.377 284.161 136.763 254.959 80.8857Z"
        fill="#031542"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M47.4939 215.842C9.3625 191.806 55.0306 159.956 43.8748 121.872C32.7191 83.7869 5.69621 27.0017 112.304 47.2357C220.32 67.737 288.828 94.1357 272.638 175.906C256.448 257.676 85.6254 239.878 47.4939 215.842Z"
        fill="#C4FBEC"
      />
      <Path
        d="M244 58L276 22"
        stroke="#3D50DF"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M256 60L288 30"
        stroke="#6941C6"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M234 50L264 18"
        stroke="#0FF1CF"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Sparkle
        d="M268 229Q268 240 279 240Q268 240 268 251Q268 240 257 240Q268 240 268 229Z"
        fill="#031542"
        x={268}
        y={240}
        delay={800}
        progress={sparkle}
        animated={animated}
      />
      <Sparkle
        d="M66 281Q66 292 77 292Q66 292 66 303Q66 292 55 292Q66 292 66 281Z"
        fill="#6594F1"
        x={66}
        y={292}
        delay={1600}
        progress={sparkle}
        animated={animated}
      />
      <Ellipse
        cx="152"
        cy="236"
        rx="118"
        ry="6"
        fill="#031542"
        opacity="0.15"
      />
      <AnimatedPath
        d="M34 240H272"
        stroke="#031542"
        strokeOpacity="0.3"
        strokeWidth="3"
        strokeDasharray="14 12"
        animatedProps={roadProps}
      />
      <G stroke="#3D50DF" strokeWidth="3" strokeLinecap="round">
        <SpeedLine
          d="M14 176H32"
          delay={0}
          progress={speed}
          animated={animated}
        />
        <SpeedLine
          d="M8 192H30"
          delay={230}
          progress={speed}
          animated={animated}
        />
        <SpeedLine
          d="M16 208H32"
          delay={460}
          progress={speed}
          animated={animated}
        />
      </G>
      <AnimatedPath
        d="M44 122Q140 14 240 80"
        stroke="#3D50DF"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="2 8"
        animatedProps={routeProps}
      />
      <Circle
        cx="44"
        cy="122"
        r="6"
        fill="#fff"
        stroke="#031542"
        strokeWidth="3"
      />
      <AnimatedGroup animatedProps={pinProps}>
        <Path
          d="M246 48C236 48 229 55 229 64C229 77 246 94 246 94S263 77 263 64C263 55 256 48 246 48Z"
          fill="#FF5C7A"
          stroke="#031542"
          strokeWidth="3"
        />
        <Circle
          cx="246"
          cy="63"
          r="6.5"
          fill="none"
          stroke="#fff"
          strokeWidth="3.5"
        />
      </AnimatedGroup>
      <Rect
        x="30"
        y="32"
        width="82"
        height="24"
        rx="12"
        fill="#fff"
        stroke="#031542"
        strokeWidth="2.5"
      />
      <Circle cx="48" cy="44" r="5.5" fill="#3D50DF" />
      <Circle cx="64" cy="44" r="5.5" fill="#3D50DF" />
      <Circle cx="80" cy="44" r="5.5" fill="#3D50DF" />
      <AnimatedGroup animatedProps={seatProps}>
        <Circle
          cx="96"
          cy="44"
          r="5"
          fill="none"
          stroke="#3D50DF"
          strokeWidth="2.5"
          strokeDasharray="3 2.5"
        />
      </AnimatedGroup>
      <AnimatedGroup animatedProps={carProps}>
        <G transform="translate(102 95) scale(0.37)">
          <G>
            <Ellipse cx="76" cy="199" rx="16" ry="9" fill="#F5B800" />
            <Ellipse cx="124" cy="199" rx="16" ry="9" fill="#F5B800" />
            <Path
              d="M100 23V36"
              stroke="#F5B800"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <Circle
              cx="100"
              cy="14"
              r="9"
              fill="none"
              stroke="#F5B800"
              strokeWidth="5"
            />
            <Rect
              x="26"
              y="34"
              width="148"
              height="164"
              rx="74"
              fill="#FFD84D"
            />
            <Circle cx="44" cy="136" r="8" fill="#FF8F7E" opacity="0.7" />
            <Circle cx="156" cy="136" r="8" fill="#FF8F7E" opacity="0.7" />
            <AnimatedGroup animatedProps={eyeProps}>
              <Circle cx="70" cy="96" r="25" fill="#fff" />
              <Circle cx="130" cy="96" r="25" fill="#fff" />
              <Circle cx="77" cy="100" r="11" fill="#0B3B35" />
              <Circle cx="137" cy="100" r="11" fill="#0B3B35" />
              <Circle cx="81" cy="95" r="3.5" fill="#fff" />
              <Circle cx="141" cy="95" r="3.5" fill="#fff" />
            </AnimatedGroup>
            <Path
              d="M74 140Q100 166 126 140"
              fill="none"
              stroke="#0B3B35"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <AnimatedGroup animatedProps={waveProps}>
              <Path
                d="M172 128Q200 112 192 74"
                fill="none"
                stroke="#F5B800"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <G transform="translate(160 22) rotate(-8 32 20)">
                <Path
                  d="M6 0H39A5 5 0 0 0 49 0H58Q64 0 64 6V34Q64 40 58 40H49A5 5 0 0 0 39 40H6Q0 40 0 34V6Q0 0 6 0Z"
                  fill="#3D50DF"
                  stroke="#031542"
                  strokeWidth="5"
                />
                <Circle
                  cx="14"
                  cy="20"
                  r="5.5"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="4"
                />
                <Rect
                  x="24"
                  y="17.5"
                  width="12"
                  height="5"
                  rx="2.5"
                  fill="#fff"
                />
                <Path d="M53 11V29M57 11V29" stroke="#fff" strokeWidth="2.5" />
              </G>
              <Circle cx="192" cy="68" r="11" fill="#F5B800" />
            </AnimatedGroup>
          </G>
        </G>
        <G transform="translate(44 95) scale(0.37)">
          <G>
            <Ellipse cx="76" cy="199" rx="16" ry="9" fill="#3D50DF" />
            <Ellipse cx="124" cy="199" rx="16" ry="9" fill="#3D50DF" />
            <Path
              d="M100 23V36"
              stroke="#3D50DF"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <Circle
              cx="100"
              cy="14"
              r="9"
              fill="none"
              stroke="#3D50DF"
              strokeWidth="5"
            />
            <Rect
              x="26"
              y="34"
              width="148"
              height="164"
              rx="74"
              fill="#6594F1"
            />
            <Circle cx="44" cy="136" r="8" fill="#FF8F7E" opacity="0.7" />
            <Circle cx="156" cy="136" r="8" fill="#FF8F7E" opacity="0.7" />
            <Path
              d="M48 102Q70 78 92 102"
              fill="none"
              stroke="#0B3B35"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <Path
              d="M108 102Q130 78 152 102"
              fill="none"
              stroke="#0B3B35"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <Path
              d="M72 134Q100 180 128 134Z"
              fill="#0B3B35"
              stroke="#0B3B35"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <Path
              d="M172 128Q178 152 152 154"
              fill="none"
              stroke="#3D50DF"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <Circle cx="150" cy="154" r="11" fill="#3D50DF" />
          </G>
        </G>
        <Ellipse
          cx="236"
          cy="150"
          rx="3.5"
          ry="10"
          transform="rotate(20 236 150)"
          fill="none"
          stroke="#031542"
          strokeWidth="3"
        />
        <G transform="translate(168 95) scale(0.37)">
          <G>
            <Ellipse cx="76" cy="199" rx="16" ry="9" fill="#0FB898" />
            <Ellipse cx="124" cy="199" rx="16" ry="9" fill="#0FB898" />
            <Path
              d="M100 23V36"
              stroke="#0FB898"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <Circle
              cx="100"
              cy="14"
              r="9"
              fill="none"
              stroke="#0FB898"
              strokeWidth="5"
            />
            <Rect
              x="26"
              y="34"
              width="148"
              height="164"
              rx="74"
              fill="#1EEBC8"
            />
            <Circle cx="44" cy="136" r="8" fill="#FF8F7E" opacity="0.7" />
            <Circle cx="156" cy="136" r="8" fill="#FF8F7E" opacity="0.7" />
            <AnimatedGroup animatedProps={eyeProps}>
              <Circle cx="70" cy="96" r="25" fill="#fff" />
              <Circle cx="130" cy="96" r="25" fill="#fff" />
              <Circle cx="78" cy="99" r="11" fill="#0B3B35" />
              <Circle cx="138" cy="99" r="11" fill="#0B3B35" />
              <Circle cx="82" cy="94" r="3.5" fill="#fff" />
              <Circle cx="142" cy="94" r="3.5" fill="#fff" />
            </AnimatedGroup>
            <Path
              d="M74 140Q100 166 126 140"
              fill="none"
              stroke="#0B3B35"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <Path
              d="M172 128Q186 140 178 152"
              fill="none"
              stroke="#0FB898"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <Circle cx="178" cy="152" r="11" fill="#0FB898" />
          </G>
        </G>
        <G transform="translate(99 141) scale(0.72)">
          <AnimatedGroup animatedProps={heartProps}>
            <Path
              d="M0 12C-14 2 -12 -10 -5 -10C-2 -10 0 -7 0 -5C0 -7 2 -10 5 -10C12 -10 14 2 0 12Z"
              fill="#FF5C7A"
            />
          </AnimatedGroup>
        </G>
        <Path
          d="M36 190C36 172 44 160 60 160H236C252 160 266 176 266 192V204Q266 212 258 212H44Q36 212 36 204Z"
          fill="#FF5C7A"
        />
        <Path
          d="M48 184H254"
          stroke="#FFD84D"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <Path
          d="M150 164V206"
          stroke="#D93A5C"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <Rect x="136" y="170" width="10" height="4" rx="2" fill="#D93A5C" />
        <Path
          d="M232 160L244 134H252L250 160Z"
          fill="#D5F7EF"
          stroke="#031542"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <Circle
          cx="258"
          cy="186"
          r="6"
          fill="#FFF3B0"
          stroke="#1EEBC8"
          strokeWidth="3"
        />
        <Rect x="35" y="178" width="5" height="14" rx="2" fill="#FF9F2E" />
        <Circle cx="84" cy="212" r="21" fill="#031542" />
        <AnimatedGroup animatedProps={rearWheelProps}>
          <Circle cx="84" cy="212" r="17" fill="#17524A" />
          <Circle
            cx="84"
            cy="212"
            r="8"
            fill="none"
            stroke="#1EEBC8"
            strokeWidth="4"
          />
          <Path
            d="M84 197V203M84 221V227M69 212H75 M93 212H99"
            stroke="#1EEBC8"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </AnimatedGroup>
        <Circle cx="218" cy="212" r="21" fill="#031542" />
        <AnimatedGroup animatedProps={frontWheelProps}>
          <Circle cx="218" cy="212" r="17" fill="#17524A" />
          <Circle
            cx="218"
            cy="212"
            r="8"
            fill="none"
            stroke="#1EEBC8"
            strokeWidth="4"
          />
          <Path
            d="M218 197V203M218 221V227M203 212H209 M227 212H233"
            stroke="#1EEBC8"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </AnimatedGroup>
      </AnimatedGroup>
    </Svg>
  );
}
