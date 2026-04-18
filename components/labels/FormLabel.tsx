import { Text } from "react-native";
import tw from "twrnc";
import CustomView from "../View";

interface Props {
  className?: string;
  text: string;
}

const FormLabel = ({ text, className = "" }: Props) => {
  return (
    <CustomView>
      <Text style={tw`text-white text-sm capitalize ${className}`}>{text}</Text>
    </CustomView>
  );
};

export default FormLabel;
