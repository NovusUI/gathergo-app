import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

export function useReducedMotionPreference() {
  const initialPreference = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(initialPreference);

  useEffect(() => {
    let shouldApplySnapshot = true;
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => {
        shouldApplySnapshot = false;
        setReducedMotion(enabled);
      },
    );
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (shouldApplySnapshot) setReducedMotion(enabled);
    });
    return () => {
      shouldApplySnapshot = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}
