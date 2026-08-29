import {
  Banknote,
  Briefcase,
  Droplet,
  Equal,
  GraduationCap,
  Handshake,
  HeartPulse,
  House,
  Leaf,
  Lightbulb,
  Recycle,
  Scale,
  TreePine,
  Utensils,
  Venus,
  Waves,
  Zap,
} from "lucide-react-native";
import { ComponentProps } from "react";

type IconProps = ComponentProps<typeof Leaf>;

const SDG_ICON_MAP = {
  1: Banknote,
  2: Utensils,
  3: HeartPulse,
  4: GraduationCap,
  5: Venus,
  6: Droplet,
  7: Zap,
  8: Briefcase,
  9: Lightbulb,
  10: Equal,
  11: House,
  12: Recycle,
  13: Leaf,
  14: Waves,
  15: TreePine,
  16: Scale,
  17: Handshake,
} as const;

interface SdgGoalIconProps extends Omit<IconProps, "color" | "size"> {
  number?: number | null;
  color?: string;
  size?: number;
}

export function SdgGoalIcon({
  number,
  color = "white",
  size = 18,
  strokeWidth = 2.2,
  ...props
}: SdgGoalIconProps) {
  const Icon = SDG_ICON_MAP[number as keyof typeof SDG_ICON_MAP] || Leaf;

  return (
    <Icon
      color={color}
      size={size}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}
