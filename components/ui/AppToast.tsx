import Toast, { BaseToast } from "react-native-toast-message";

export const toastConfig = {
  warn: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "#FFA500" }}
      text1Style={{ fontSize: 16, fontWeight: "bold" }}
    />
  )
};

const AppToast = () => <Toast config={toastConfig} />;

export default AppToast;
