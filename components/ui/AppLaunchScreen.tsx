import {
  APP_LAUNCH_BACKGROUND,
  APP_LAUNCH_LOGO_SIZE,
} from "@/constants/appLaunch";
import { Image, StatusBar, StyleSheet, View } from "react-native";

export default function AppLaunchScreen() {
  return (
    <View
      style={styles.screen}
      accessibilityRole="progressbar"
      accessibilityLabel="Starting GatherGo"
      accessibilityState={{ busy: true }}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={APP_LAUNCH_BACKGROUND}
      />
      <Image
        source={require("../../assets/images/gglogo.png")}
        accessibilityLabel="GatherGo app logo"
        resizeMode="contain"
        style={styles.logo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APP_LAUNCH_BACKGROUND,
  },
  logo: {
    width: APP_LAUNCH_LOGO_SIZE,
    height: APP_LAUNCH_LOGO_SIZE,
  },
});
