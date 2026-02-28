import { useEffect, useState } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Line, Path } from "react-native-svg";
import tw from "twrnc";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface LineChartProps {
  data: {
    day: string;
    amount?: number;
    tickets?: number;
    registrations?: number;
  }[];
  color?: string;
  valueKey: "amount" | "tickets" | "registrations";
  label?: string;
  height?: number;
}

const LineChart = ({
  data,
  color = "#0FF1CF",
  valueKey,
  label = "Value",
  height = 150,
}: LineChartProps) => {
  const width = Dimensions.get("window").width - 80;
  const [activePoint, setActivePoint] = useState<number | null>(null);

  const getValue = (item: any) => item[valueKey] ?? 0;

  const rawMaxValue = Math.max(...data.map(getValue));
  const maxValue = rawMaxValue === 0 ? 1 : rawMaxValue;
  const isAllZero = rawMaxValue === 0;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * width;
    const value = getValue(item);
    const y = isAllZero
      ? height * 0.5
      : height - (value / maxValue) * height * 0.8;

    return { x, y, value };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // --- Line animation ---
  const pathLength = width * 2;
  const progress = useSharedValue(pathLength);

  useEffect(() => {
    progress.value = withTiming(0, { duration: 900 });
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: progress.value,
  }));

  return (
    <View>
      <Svg width={width} height={height}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((r) => (
          <Line
            key={r}
            x1={0}
            y1={height * r}
            x2={width}
            y2={height * r}
            stroke="#1B2A50"
            strokeWidth="1"
          />
        ))}

        {/* Animated Line */}
        <AnimatedPath
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeDasharray={pathLength}
          animatedProps={animatedProps}
        />

        {/* Points */}
        {points.map((p, i) => (
          <Pressable key={i} onPress={() => setActivePoint(i)}>
            <Circle cx={p.x} cy={p.y} r="5" fill={color} />
          </Pressable>
        ))}
      </Svg>

      {/* Tooltip */}
      {activePoint !== null && (
        <View
          style={[
            tw`absolute bg-black px-2 py-1 rounded`,
            {
              left: points[activePoint].x - 20,
              top: points[activePoint].y - 35,
            },
          ]}
        >
          <Text style={tw`text-white text-xs`}>
            {points[activePoint].value.toLocaleString()}
          </Text>
        </View>
      )}

      {/* X Labels */}
      <View style={tw`flex-row justify-between mt-2`}>
        {data.map((item, i) => (
          <Text key={i} style={tw`text-gray-400 text-xs`}>
            {item.day}
          </Text>
        ))}
      </View>

      {/* Y Label */}
      <Text style={tw`text-gray-400 text-xs mt-2`}>
        {label} (max: {rawMaxValue.toLocaleString()})
      </Text>

      {isAllZero && (
        <Text style={tw`text-gray-500 text-xs mt-1`}>No data available</Text>
      )}
    </View>
  );
};

export default LineChart;
