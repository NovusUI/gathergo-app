import { useAppTheme } from "@/hooks/useAppTheme";
import { Text } from "react-native";

import CustomView from "../View";

interface Props {
  className?: string;
  text: string;
}

const FormLabel = ({ text, className = "" }: Props) => {
  const { tw } = useAppTheme();
  return (
    <CustomView>
      <Text style={tw`text-foreground dark:text-white text-sm capitalize ${className}`}>{text}</Text>
    </CustomView>
  );
};

export default FormLabel;
