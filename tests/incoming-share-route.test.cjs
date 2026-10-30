const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTypeScript } = require('./loadTypeScript.cjs');
const links = loadTypeScript('utils/shareLinks.ts');
const { incomingShareRoute } = loadTypeScript('utils/incomingShareRoute.ts', { './shareLinks': links });

test('incoming links retain event, carpool, meal and short destinations through sign-in', () => {
  for (const path of ['/event/event-1', '/food-bank/event-1', '/carpool/ride-1', '/s/Code1234']) {
    assert.equal(incomingShareRoute(`https://gathergo.events${path}`), path);
    assert.equal(incomingShareRoute(`gathergoapp://${path.slice(1)}`), path);
  }
});
test('public Live links use the native event feed destination', () => {
  assert.equal(incomingShareRoute('https://gathergo.events/event/event-1/live'), '/event/event-1?openFeed=1');
  assert.equal(incomingShareRoute('gathergoapp://event/event-1?openFeed=1&feedTab=carpool'), '/event/event-1?openFeed=1&feedTab=carpool');
});
test('unrelated and malformed URLs cannot set an app destination', () => {
  for (const value of ['https://other.example/event/event-1', 'https://gathergo.events/checkout/private', 'gathergoapp://wallet', 'not a URL', 'https://gathergo.events/event/a%2Fb']) assert.equal(incomingShareRoute(value), null);
});

let pending = null;
let authenticated = false;
let profileReady = false;
let preferencesReady = false;
let phase = 'idle';
let listener;
const effects = [];
const navigated = [];
const { default: RootNavigator } = loadTypeScript('navigators/RootNavigators.tsx', {
  react: { useState: () => [pending, (value) => { pending = value; }], useEffect: (effect) => effects.push(effect) },
  'react-native': { View: 'View', StyleSheet: { absoluteFillObject: {} } },
  'expo-linking': { getInitialURL: async () => 'https://gathergo.events/food-bank/food-1', addEventListener: (_name, callback) => { listener = callback; return { remove() {} }; } },
  'expo-router': { Stack: Object.assign(() => null, { Screen: 'Screen' }), usePathname: () => '/', useRootNavigationState: () => ({ key: 'root' }), useRouter: () => ({ replace: (value) => navigated.push(value) }) },
  '@/utils/incomingShareRoute': { incomingShareRoute },
  '@/components/ui/AppLaunchScreen': { default: 'LaunchScreen' },
  '@/components/ui/FullScreenLoader': { default: 'Loader' },
  '@/hooks/useAppTheme': { useAppTheme: () => ({ color: (value) => value }) },
  '@/context/AuthContext': { useAuth: () => ({ loading: false, user: { isProfileComplete: profileReady, hasPreferences: preferencesReady } }) },
  '@/store/auth': { useAuthStore: () => ({ isAuthenticated: authenticated, hasHydrated: true, googleAuthPhase: phase }) },
});
const render = () => { effects.length = 0; RootNavigator(); };

test('the app keeps the shared destination until sign-in, profile and preferences finish', async () => {
  render(); effects[0]();
  await Promise.resolve();
  assert.equal(pending, '/food-bank/food-1');
  render(); effects[1]();
  assert.deepEqual(navigated, []);
  authenticated = true;
  render(); effects[1]();
  assert.deepEqual(navigated, []);
  profileReady = true;
  render(); effects[1]();
  assert.deepEqual(navigated, []);
  preferencesReady = true;
  phase = 'completing';
  render(); effects[1]();
  assert.deepEqual(navigated, []);
  phase = 'idle';
  render(); effects[1]();
  assert.deepEqual(navigated, ['/food-bank/food-1']);
  assert.equal(pending, null);
  listener({ url: 'gathergoapp://event/event-2?openFeed=1' });
  render(); effects[1]();
  assert.equal(navigated.at(-1), '/event/event-2?openFeed=1');
});
