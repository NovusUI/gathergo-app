import { Text } from "react-native"


interface Props {
    className?: string
    text: string
}
const FormLabel = ({text,className}:Props) => {
  return (
    <Text className={`text-white text-sm capitalize ${className}` }>
    {text}
    </Text>
  )
}

export default FormLabel
