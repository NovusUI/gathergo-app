import { Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function QRCodeGenerator({value}:{value:string}) {

    console.log(value)
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ marginBottom: 10 }}>Scan this QR Code</Text>
      <QRCode
        value={value}  // The string to encode
        size={120}     // Size of the QR code
        color="black"  // Foreground color
        backgroundColor="white" // Background color
      />
    </View>
  );
}
