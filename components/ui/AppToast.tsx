import { useAppTheme } from "@/hooks/useAppTheme";
import type { ComponentProps } from "react";
import Toast, { BaseToast, type ToastConfig } from "react-native-toast-message";

function WarningToast(props: ComponentProps<typeof BaseToast>) {
  const { colors } = useAppTheme();
  return (
    <BaseToast
      {...props}
      style={{ borderLeftColor: colors.warning, backgroundColor: colors.surface }}
      text1Style={{ color: colors.foreground, fontSize: 16, fontWeight: "bold" }}
      text2Style={{ color: colors.secondary }}
    />
  );
}

export const toastConfig: ToastConfig = { warn: (props) => <WarningToast {...props} /> };
export default function AppToast() {
  return <Toast config={toastConfig} />;
}
