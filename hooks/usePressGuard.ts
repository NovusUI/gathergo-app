import { useCallback, useRef } from "react";

export const DEFAULT_PRESS_GUARD_MS = 700;

export const usePressGuard = <Args extends unknown[]>(
  callback?: (...args: Args) => void | Promise<void>,
  cooldownMs: number = DEFAULT_PRESS_GUARD_MS
) => {
  const lastPressAtRef = useRef(0);

  return useCallback(
    (...args: Args) => {
      if (!callback) {
        return;
      }

      const now = Date.now();

      if (now - lastPressAtRef.current < cooldownMs) {
        return;
      }

      lastPressAtRef.current = now;
      return callback(...args);
    },
    [callback, cooldownMs]
  );
};
