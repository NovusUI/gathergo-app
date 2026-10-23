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
const reset = () => { stored = null; writes = []; storageFailure = false; useAppearanceStore.setState({ mode: 'dark', hasHydrated: false }); };
test('appearance defaults to the existing dark mode and hydrates the saved app setting', async () => {
  reset(); assert.equal(useAppearanceStore.getState().mode, 'dark');
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
  assert.equal(useAppearanceStore.getState().mode, 'dark'); assert.deepEqual(writes, []);
});
test('the theme hook follows app settings without reading the phone color scheme', () => {
  let mode = 'light'; const requested = [];
  const { useAppTheme } = loadTypeScript('hooks/useAppTheme.ts', {
    '@/store/appearance': { useAppearanceStore: selector => selector({ mode }) },
    '@/utils/theme': { getAppTheme: value => { requested.push(value); return { mode: value }; } },
  });
  assert.equal(useAppTheme().mode, 'light'); mode = 'dark'; assert.equal(useAppTheme().mode, 'dark');
  assert.deepEqual(requested, ['light', 'dark']);
});
function luminance(hex) {
  const values = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
}
const contrast = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((a, b) => b - a); return (hi + .05) / (lo + .05); };
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
  '@/store/appearance': { useAppearanceStore: selector => selector({ setMode: async mode => { saved = mode; uiMode = mode; } }) },
  '@/utils/globalErrorHandler': { showGlobalError: value => { message = value; } },
  '@expo/vector-icons': { Ionicons: 'Icon' }, react: { useState: () => [pending, value => { pending = value; }] },
  'react-native': { Text: 'Text', View: 'View', TouchableOpacity: 'Button' },
});
test('Appearance offers accessible Light and Dark app choices and updates the selected control after saving', async () => {
  uiMode = 'dark'; pending = false; saved = undefined; message = undefined;
  const radios = [...nodes(Preference())].filter(node => node.props.accessibilityRole === 'radio');
  assert.deepEqual(radios.map(node => node.props.accessibilityLabel), ['Light mode', 'Dark mode']);
  assert.deepEqual(radios.map(node => node.props.accessibilityState.checked), [false, true]);
  radios[0].props.onPress(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(saved, 'light'); assert.equal(message, undefined);
  assert.equal([...nodes(Preference())].find(node => node.props.accessibilityLabel === 'Light mode').props.accessibilityState.checked, true);
});
