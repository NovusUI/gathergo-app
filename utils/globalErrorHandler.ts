import { Toast } from "react-native-toast-message/lib/src/Toast";

export const showGlobalError = (message: string) => {
  Toast.show({
    type: "error",
    text1: "Error",
    text2: message,
    position: "top",
    visibilityTime: 4000,
  });
};

export const showGlobalSuccess = (message: string,time?:number) => {
  Toast.show({
    type: "success",
    text1: "Success",
    text2: message,
    position: "top",
    visibilityTime: time && time * 1000 || 3000,
  });
};
export const showGlobalWarning = (message: string) => {
  Toast.show({
    type: "warn",
    text1: "Warning",
    text2: message,
    position: "top",
    visibilityTime: 3000,
  });
};

