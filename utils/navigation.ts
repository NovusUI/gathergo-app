import type { Href, Router } from "expo-router";
import { useRouter } from "expo-router";
import { useMemo } from "react";

const DEFAULT_NAVIGATION_LOCK_MS = 900;
let navigationLockExpiresAt = 0;
const lockedRouterTargets = new WeakMap<Router, Router>();

const resolveRouterTarget = (router: Router) =>
  lockedRouterTargets.get(router) ?? router;

const runWithNavigationLock = (
  action: () => void,
  cooldownMs: number = DEFAULT_NAVIGATION_LOCK_MS
) => {
  const now = Date.now();

  if (now < navigationLockExpiresAt) {
    return false;
  }

  navigationLockExpiresAt = now + cooldownMs;
  action();
  return true;
};

export const pushWithLock = (
  router: Router,
  href: Href,
  cooldownMs?: number
) => {
  const target = resolveRouterTarget(router);
  return runWithNavigationLock(() => target.push(href), cooldownMs);
};

export const replaceWithLock = (
  router: Router,
  href: Href,
  cooldownMs?: number
) => {
  const target = resolveRouterTarget(router);
  return runWithNavigationLock(() => target.replace(href), cooldownMs);
};

export const safeGoBack = (router: Router, fallback: Href = "/") => {
  const target = resolveRouterTarget(router);

  runWithNavigationLock(() => {
    if (typeof target.canGoBack === "function" && target.canGoBack()) {
      target.back();
      return;
    }

    target.replace(fallback);
  });
};

export const useLockedRouter = (): Router => {
  const router = useRouter();

  return useMemo(
    () => {
      const lockedRouter = new Proxy(router, {
        get(target, prop, receiver) {
          if (prop === "push") {
            return ((href: Href) => {
              pushWithLock(target, href);
            }) as Router["push"];
          }

          if (prop === "replace") {
            return ((href: Href) => {
              replaceWithLock(target, href);
            }) as Router["replace"];
          }

          if (prop === "back") {
            return (() => {
              safeGoBack(target);
            }) as Router["back"];
          }

          return Reflect.get(target, prop, receiver);
        },
      }) as Router;

      lockedRouterTargets.set(lockedRouter, router);
      return lockedRouter;
    },
    [router]
  );
};
