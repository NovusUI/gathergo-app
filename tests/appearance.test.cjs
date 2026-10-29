/* eslint-disable react-hooks/rules-of-hooks -- This harness calls the theme hook with stubbed subscriptions to simulate device appearance changes. */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTypeScript } = require('./loadTypeScript.cjs');
const { LIGHT_COLORS, DARK_COLORS, resolveThemeColor } = loadTypeScript('constants/theme.ts');
let stored = null, writes = [], storageFailure = false;
const { useAppearanceStore, APPEARANCE_KEY } = loadTypeScript('store/appearance.ts', {
  '@react-native-async-storage/async-storage': { default: {
    getItem: async key => { assert.equal(key, APPEARANCE_KEY); return stored; },
    setItem: async (key, value) => { if (storageFailure) throw new Error('Storage unavailable'); writes.push([key, value]); stored = value; },
  } },
});
const reset = () => { stored = null; writes = []; storageFailure = false; useAppearanceStore.setState({ mode: 'system', hasHydrated: false }); };
test('appearance defaults to the phone setting and hydrates an explicit saved app setting', async () => {
  assert.equal(useAppearanceStore.getInitialState().mode, 'system');
  reset(); assert.equal(useAppearanceStore.getState().mode, 'system');
  stored = 'light'; await useAppearanceStore.getState().hydrate();
  assert.equal(useAppearanceStore.getState().mode, 'light'); assert.equal(useAppearanceStore.getState().hasHydrated, true);
  stored = 'dark'; await useAppearanceStore.getState().hydrate();
  assert.equal(useAppearanceStore.getState().mode, 'light');
});
test('changing appearance persists the app choice and restores it after a restart', async () => {
  reset(); await useAppearanceStore.getState().setMode('light');
  assert.deepEqual(writes, [[APPEARANCE_KEY, 'light']]); assert.equal(useAppearanceStore.getState().mode, 'light');
  useAppearanceStore.setState({ mode: 'dark', hasHydrated: false });
  await useAppearanceStore.getState().hydrate(); assert.equal(useAppearanceStore.getState().mode, 'light');
  await useAppearanceStore.getState().setMode('dark'); assert.equal(stored, 'dark');
});
test('a failed save leaves the selected mode unchanged and exposes the failure', async () => {
  reset(); storageFailure = true;
  await assert.rejects(useAppearanceStore.getState().setMode('light'), /Storage unavailable/);
  assert.equal(useAppearanceStore.getState().mode, 'system'); assert.deepEqual(writes, []);
});
test('System is persisted and restored after changing back from a manual theme', async () => {
  reset();
  await useAppearanceStore.getState().setMode('light');
  await useAppearanceStore.getState().setMode('system');
  useAppearanceStore.setState({ mode: 'dark', hasHydrated: false });
  await useAppearanceStore.getState().hydrate();
  assert.equal(stored, 'system');
  assert.equal(useAppearanceStore.getState().mode, 'system');
});
let appSetting = 'system', deviceScheme = 'light';
const { useAppTheme } = loadTypeScript('hooks/useAppTheme.ts', {
  '@/store/appearance': { useAppearanceStore: selector => selector({ mode: appSetting }) },
  '@/utils/theme': { getAppTheme: mode => ({ mode }) },
  'react-native': { useColorScheme: () => deviceScheme },
});
test('manual Light and Dark choices remain selected when the device theme changes', () => {
  for (appSetting of ['light', 'dark']) {
    for (deviceScheme of ['light', 'dark']) assert.equal(useAppTheme().mode, appSetting);
  }
});
test('System follows device theme changes while mounted and handles a phone with no preference', () => {
  appSetting = 'system';
  for (deviceScheme of ['light', 'dark', 'light', 'dark']) assert.equal(useAppTheme().mode, deviceScheme);
  deviceScheme = null;
  assert.equal(useAppTheme().mode, 'light');
});
const { contrast } = require('./colorContrast.cjs');
test('the reference palette has readable text, selected controls and solid primary buttons', () => {
  for (const background of [LIGHT_COLORS.background, LIGHT_COLORS.surface]) {
    for (const role of ['foreground', 'secondary', 'muted', 'accent', 'danger', 'warning']) assert.ok(contrast(LIGHT_COLORS[role], background) >= 4.5, role);
  }
  assert.ok(contrast(LIGHT_COLORS.onAccent, LIGHT_COLORS.accentFill) >= 4.5);
  assert.ok(contrast(LIGHT_COLORS.onPrimary, LIGHT_COLORS.primary) >= 4.5);
  assert.equal(resolveThemeColor('dark', '#07164F', 'surface'), '#07164F');
  assert.equal(resolveThemeColor('light', '#07164F', 'surface'), '#FFFFFF');
});
let uiMode = 'dark', pending = false, saved, message;
function* nodes(node) { if (!node || typeof node !== 'object') return; yield node; for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child); }
const tw = () => ({}); tw.style = () => ({});
const { default: Preference } = loadTypeScript('components/AppearancePreference.tsx', {
  '@/hooks/useAppTheme': { useAppTheme: () => ({ mode: uiMode, colors: uiMode === 'light' ? LIGHT_COLORS : DARK_COLORS, tw }) },
  '@/store/appearance': { useAppearanceStore: selector => selector({ mode: uiMode, setMode: async mode => { saved = mode; uiMode = mode; } }) },
  '@/utils/globalErrorHandler': { showGlobalError: value => { message = value; } },
  '@expo/vector-icons': { Ionicons: 'Icon' }, react: { useState: () => [pending, value => { pending = value; }] },
  'react-native': { Text: 'Text', View: 'View', TouchableOpacity: 'Button' },
});
test('Appearance offers accessible System, Light and Dark choices and updates the selected control after saving', async () => {
  uiMode = 'dark'; pending = false; saved = undefined; message = undefined;
  const radios = [...nodes(Preference())].filter(node => node.props.accessibilityRole === 'radio');
  assert.deepEqual(radios.map(node => node.props.accessibilityLabel), ['System mode', 'Light mode', 'Dark mode']);
  assert.deepEqual(radios.map(node => node.props.accessibilityState.checked), [false, false, true]);
  radios[1].props.onPress(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(saved, 'light'); assert.equal(message, undefined);
  assert.equal([...nodes(Preference())].find(node => node.props.accessibilityLabel === 'Light mode').props.accessibilityState.checked, true);
  [...nodes(Preference())].find(node => node.props.accessibilityLabel === 'System mode').props.onPress();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(saved, 'system');
  assert.equal([...nodes(Preference())].find(node => node.props.accessibilityLabel === 'System mode').props.accessibilityState.checked, true);
});
