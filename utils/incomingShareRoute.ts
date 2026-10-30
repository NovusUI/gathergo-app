import { GATHERGO_SHARE_ORIGIN, buildShareTargetRoute, resolveScannedLink } from './shareLinks';

export function incomingShareRoute(value: string) {
  try {
    const url = new URL(value);
    const path = url.protocol === 'gathergoapp:'
      ? (url.hostname ? `/${url.hostname}${url.pathname}` : url.pathname)
      : url.origin === GATHERGO_SHARE_ORIGIN ? url.pathname : null;
    if (!path) return null;
    const live = /^\/event\/[^/]+\/live\/?$/.test(path);
    const destination = resolveScannedLink(`${GATHERGO_SHARE_ORIGIN}${live ? path.replace(/\/live\/?$/, '') : path}`);
    if (!destination) return null;
    if (destination.kind === 'short') return `/s/${destination.code}` as const;
    const route = buildShareTargetRoute(destination.kind, destination.id);
    if (destination.kind === 'event' && (live || url.searchParams.get('openFeed') === '1'))
      return `${route}?openFeed=1${url.searchParams.get('feedTab') === 'carpool' ? '&feedTab=carpool' : ''}` as const;
    return route;
  } catch {
    return null;
  }
}
