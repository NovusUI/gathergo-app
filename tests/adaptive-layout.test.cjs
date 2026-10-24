/* eslint-disable react-hooks/rules-of-hooks -- This harness drives hook state directly to test native gesture behavior. */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTypeScript } = require('./loadTypeScript.cjs');
const { getAdaptiveLayout } = loadTypeScript('utils/layout.ts');

test('phone, unfolded, tablet, split-screen and landscape sizes keep readable cards inside the content area', () => {
  for (const [width, height, expectedRail, expectedColumns] of [
    [320, 544, false, 1], [390, 751, false, 1], [640, 800, false, 2], [700, 800, false, 2],
    [840, 1100, true, 2], [1024, 1366, true, 2], [1366, 1024, true, 2],
    [507, 1024, false, 1], [844, 360, false, 2],
  ]) {
    const layout = getAdaptiveLayout(width, height, 1);
    assert.equal(layout.useNavigationRail, expectedRail, `${width} × ${height}`);
    assert.equal(layout.columns, expectedColumns);
    assert.ok(layout.pageWidth <= width - layout.navigationRailWidth);
    assert.ok(layout.cardWidth >= 280);
    assert.equal(layout.cardWidth * layout.columns + layout.horizontalPadding * 2 + (layout.columns - 1) * 16, layout.pageWidth);
  }
});
test('short screens and larger text keep the compact header while large text uses one readable column', () => {
  assert.equal(getAdaptiveLayout(320, 544, 1).reachExpansion, 0);
  assert.ok(getAdaptiveLayout(390, 751, 1).reachExpansion > 0);
  const largeText = getAdaptiveLayout(1024, 1000, 2);
  assert.equal(largeText.columns, 1);
  assert.equal(largeText.navigationRailWidth, 104);
  assert.equal(largeText.reachExpansion, 0);
  assert.ok(largeText.bannerHeight > getAdaptiveLayout(390, 751, 1).bannerHeight);
});

test('detail pages keep narrow and unfolded windows stacked, use tablet columns, and restack for large text', () => {
  for (const [width, height, scale, expected] of [
    [320, 568, 1, 1], [390, 844, 1, 1], [700, 800, 1, 1],
    [844, 390, 1, 1], [959, 1100, 1, 1], [960, 1100, 1, 2],
    [1024, 1366, 1, 2], [1366, 1024, 1, 2], [1366, 1024, 1.6, 1],
  ]) {
    const layout = getAdaptiveLayout(width, height, scale, false);
    assert.equal(layout.detailColumns, expected, `${width} × ${height}, scale ${scale}`);
    assert.ok(layout.pageWidth <= 1200);
  }
});

let windowSize = { width: 1024, height: 800, fontScale: 1 };
let insets = { top: 24, left: 16, right: 16, bottom: 48 };
const { useResponsiveLayout } = loadTypeScript('hooks/useResponsiveLayout.ts', {
  'react-native': { useWindowDimensions: () => windowSize },
  'react-native-safe-area-context': { useSafeAreaInsets: () => insets },
});
test('responsive measurements update after folding and subtract actual system insets', () => {
  assert.equal(useResponsiveLayout().pageWidth, 904);
  windowSize = { width: 390, height: 844, fontScale: 1 };
  insets = { top: 59, left: 0, right: 0, bottom: 34 };
  assert.equal(useResponsiveLayout().pageWidth, 390);
  assert.equal(useResponsiveLayout().useNavigationRail, false);
  insets = { top: 24, left: 0, right: 0, bottom: 0 };
  assert.equal(useResponsiveLayout().insets.bottom, 0);
});

test('full-screen routes use the full safe width without reserving space for a tab rail', () => {
  const tabs = getAdaptiveLayout(1024, 1366, 1);
  const fullScreen = getAdaptiveLayout(1024, 1366, 1, false);
  assert.equal(tabs.pageWidth, 936);
  assert.equal(fullScreen.pageWidth, 1024);
  assert.equal(fullScreen.availableWidth, 1024);
  assert.equal(fullScreen.navigationRailWidth, 0);
  assert.equal(fullScreen.useNavigationRail, false);
  windowSize = { width: 1024, height: 1366, fontScale: 1 };
  insets = { top: 24, left: 16, right: 16, bottom: 34 };
  assert.equal(useResponsiveLayout({hasTabNavigation: false}).pageWidth, 992);
});

let refs = [], refCursor = 0, expanded = false, reduced = false, effects = [], springs = [];
class GestureDouble {
  constructor() { this.handlers = {}; this.config = {}; }
}
for (const name of ['enabled', 'maxPointers', 'manualActivation', 'blocksExternalGesture']) {
  GestureDouble.prototype[name] = function(value) { this.config[name] = value; return this; };
}
for (const name of ['onTouchesDown', 'onTouchesMove', 'onStart', 'onUpdate', 'onEnd', 'onFinalize']) {
  GestureDouble.prototype[name] = function(callback) { this.handlers[name] = callback; return this; };
}
const { useHomeReachability } = loadTypeScript('hooks/useHomeReachability.ts', {
  '@/hooks/useReducedMotionPreference': { useReducedMotionPreference: () => reduced },
  react: {
    useCallback: fn => fn, useMemo: fn => fn(),
    useState: () => [expanded, value => { expanded = value; }],
    useEffect: effect => { effects.push(effect); },
  },
  'react-native-gesture-handler': { Gesture: { Native: () => new GestureDouble(), Pan: () => new GestureDouble() } },
  'react-native-reanimated': {
    useAnimatedScrollHandler: handlers => handlers,
    useSharedValue: value => { const index = refCursor++; if (!(index in refs)) refs[index] = { value }; return refs[index]; },
    useAnimatedStyle: fn => Object.fromEntries(Object.keys(fn()).map(key => [key, fn()[key]])),
    cancelAnimation() {}, runOnJS: fn => fn, runOnUI: fn => fn,
    withSpring: (target, config) => { springs.push({target, ...config}); return target; },
  },
});
function reach(max = 120, reset = false) {
  if (reset) { refs = []; expanded = false; effects = []; springs = []; reduced = false; }
  refCursor = 0;
  return useHomeReachability(156, max);
}
const touch = (x, y) => ({ allTouches: [{ absoluteX: x, absoluteY: y }] });
function move(ui, dy, dx = 0) {
  const pan = ui.panGesture.handlers;
  let result = 'waiting';
  pan.onTouchesDown(touch(100, 200));
  pan.onTouchesMove(touch(100 + dx, 200 + dy), { activate() { result = 'active'; }, fail() { result = 'failed'; } });
  if (result === 'active') pan.onStart({ translationY: dy });
  return result;
}
function release(ui, velocityY = 0, success = true) {
  ui.panGesture.handlers.onEnd({velocityY}, success);
  ui.panGesture.handlers.onFinalize({}, success);
}
test('the header follows the finger continuously between normal and expanded heights, then settles on release', () => {
  const ui = reach(120, true), pan = ui.panGesture.handlers;
  assert.equal(move(ui, 20), 'active');
  assert.equal(ui.headerHeight.value, 156, 'activation does not jump by the gesture threshold');
  pan.onUpdate({translationY: 50}); assert.equal(ui.headerHeight.value, 186);
  pan.onUpdate({translationY: 90}); assert.equal(ui.headerHeight.value, 226);
  assert.equal(springs.length, 0, 'finger movement starts no competing settling animation');
  release(ui);
  assert.equal(ui.headerHeight.value, 276); assert.equal(expanded, true);
  assert.equal(springs[0].overshootClamping, true);
  assert.equal(move(ui, -20), 'active');
  pan.onUpdate({translationY: -50}); assert.equal(ui.headerHeight.value, 246);
  pan.onUpdate({translationY: -110}); assert.equal(ui.headerHeight.value, 186);
  release(ui);
  assert.equal(ui.headerHeight.value, 156); assert.equal(expanded, false);
});
test('a pull must begin after the feed reaches the top, so scrolling cannot turn into header expansion mid-gesture', () => {
  const ui = reach(120, true), pan = ui.panGesture.handlers;
  assert.strictEqual(ui.panGesture.config.blocksExternalGesture, ui.scrollGesture);
  ui.scrollHandler.onBeginDrag({contentOffset: {y: 500}});
  pan.onTouchesDown(touch(100, 200));
  let decision;
  const manager = {activate() { decision = 'active'; }, fail() { decision = 'failed'; }};
  pan.onTouchesMove(touch(100, 240), manager);
  assert.equal(decision, 'failed');
  ui.scrollHandler.onScroll({contentOffset: {y: 200}});
  assert.equal(ui.headerHeight.value, 156);
  ui.scrollHandler.onScroll({contentOffset: {y: 0}});
  pan.onTouchesMove(touch(100, 300), manager);
  assert.equal(decision, 'failed', 'the same swipe remains feed scrolling after reaching its beginning');
  assert.equal(springs.length, 0);
  assert.equal(move(ui, 20), 'active', 'a fresh pull at the top can expand the card');
  pan.onUpdate({translationY: 180}); release(ui);
  assert.equal(ui.headerHeight.value, 276);
  ui.scrollHandler.onScroll({contentOffset: {y: 200}});
  assert.equal(move(ui, -30), 'failed', 'upward list browsing remains native while the card scrolls away');
});
test('a near-top feed must finish scrolling before expansion, while iOS overscroll counts as the beginning', () => {
  const ui = reach(120, true);
  ui.scrollHandler.onScroll({contentOffset: {y: 12}});
  assert.equal(move(ui, 40), 'failed');
  ui.scrollHandler.onScroll({contentOffset: {y: -8}});
  assert.equal(move(ui, 20), 'active');
  ui.panGesture.handlers.onUpdate({translationY: 90}); release(ui);
  assert.equal(ui.headerHeight.value, 276);
});
test('horizontal carousel swipes and small taps leave the header alone', () => {
  const ui = reach(120, true);
  assert.equal(move(ui, 12, 100), 'failed');
  assert.equal(move(ui, 5), 'waiting');
  ui.panGesture.handlers.onFinalize({}, false);
  assert.equal(ui.headerHeight.value, 156);
  assert.equal(springs.length, 0);
  assert.equal(reach(0).panGesture.config.enabled, false);
});
test('releasing uses the current height and velocity instead of always opening after a fixed pull distance', () => {
  const ui = reach(120, true), pan = ui.panGesture.handlers;
  move(ui, 20); pan.onUpdate({translationY: 50}); release(ui);
  assert.equal(ui.headerHeight.value, 156, 'a slow short pull returns to normal');
  move(ui, 20); pan.onUpdate({translationY: 50}); release(ui, 600);
  assert.equal(ui.headerHeight.value, 276, 'a deliberate flick can finish expanding');
  move(ui, -20); pan.onUpdate({translationY: -50}); release(ui, -600);
  assert.equal(ui.headerHeight.value, 156);
});
test('resuming an interrupted animation starts at its visible height and never exceeds either limit', () => {
  const ui = reach(120, true), pan = ui.panGesture.handlers;
  ui.headerHeight.value = 193;
  move(ui, 20);
  assert.equal(ui.headerHeight.value, 193);
  pan.onUpdate({translationY: 30}); assert.equal(ui.headerHeight.value, 203);
  pan.onUpdate({translationY: 1000}); assert.equal(ui.headerHeight.value, 276);
  pan.onUpdate({translationY: -1000}); assert.equal(ui.headerHeight.value, 156);
  release(ui);
});
test('screen-reader actions honor reduced motion and resizing keeps both sizes inside the new bounds', () => {
  reach(120, true); reduced = true;
  const ui = reach(); ui.toggle();
  assert.equal(ui.headerHeight.value, 276); assert.equal(expanded, true); assert.equal(springs.length, 0);
  effects = []; const smaller = reach(60); effects[0]();
  assert.equal(smaller.headerHeight.value, 216);
  effects = []; const compact = reach(0); effects[0]();
  assert.equal(compact.headerHeight.value, 156); assert.equal(expanded, false);
});
test('cancelling an active gesture restores its previous normal or expanded size', () => {
  const ui = reach(120, true), pan = ui.panGesture.handlers;
  move(ui, 20); pan.onUpdate({translationY: 60}); release(ui, 0, false);
  assert.equal(ui.headerHeight.value, 156);
  ui.toggle(); move(ui, -20); pan.onUpdate({translationY: -60}); release(ui, 0, false);
  assert.equal(ui.headerHeight.value, 276);
});

function* nodes(node) { if (!node || typeof node !== 'object') return; yield node; for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child); }
let navWidth = 390, paths = [];
const styling = () => ({}); styling.style = () => ({});
const { default: Tabs } = loadTypeScript('app/(app)/(tabs)/_layout.tsx', {
  '@/hooks/useResponsiveLayout': { useResponsiveLayout: () => getAdaptiveLayout(navWidth, 800, 1) },
  '@/hooks/usePressGuard': { usePressGuard: fn => fn },
  '@/utils/navigation': { replaceWithLock: (_router, path) => paths.push(path), pushWithLock: (_router, path) => paths.push(path) },
  '@expo/vector-icons': { Feather: 'Icon', FontAwesome5: 'Icon', Ionicons: 'Icon' },
  '@gorhom/bottom-sheet': { default: 'Sheet', BottomSheetBackdrop: 'Backdrop', BottomSheetScrollView: 'Scroll' },
  'expo-router': { Stack: 'Stack', usePathname: () => '/', useRouter: () => ({}) },
  react: { useCallback: fn => fn, useRef: () => ({ current: { snapToIndex() {}, close() {} } }) },
  'react-native': { View: 'View', Text: 'Text', TouchableOpacity: 'Button' }, twrnc: { default: styling },
});
test('navigation reserves a normal layout slot on phones and becomes a left rail on wide windows', () => {
  for (const width of [390, 1024]) {
    navWidth = width;
    const page = Tabs(), children = page.props.children;
    const nav = [...nodes(page)].find(node => node.props.accessibilityRole === 'tablist');
    const routes = [...nodes(page)].find(node => node.type === 'View' && node.key === 'routes');
    assert.ok(routes); assert.ok([...nodes(routes)].some(node => node.type === 'Stack'));
    assert.equal(nav.props.style[1].position, undefined);
    assert.equal(page.props.style[1].flexDirection, width === 390 ? 'column' : 'row');
    assert.strictEqual(children[width === 390 ? 2 : 0], nav);
    assert.equal([...nodes(nav)].filter(node => node.type === 'Button').length, 5);
  }
});
test('rail navigation and creation keep the existing routes and the creation sheet can close from its backdrop', () => {
  navWidth = 1024; paths = [];
  const page = Tabs();
  const profile = [...nodes(page)].find(node => node.props.accessibilityLabel === 'Profile');
  profile.props.onPress();
  const event = [...nodes(page)].find(node => node.type === 'Button' && [...nodes(node)].some(child => child.props.children === 'New Event'));
  event.props.onPress();
  assert.deepEqual(paths, ['/profile', '/new-event']);
  const sheet = [...nodes(page)].find(node => node.type === 'Sheet');
  assert.equal(sheet.props.enableDynamicSizing, true);
  assert.equal(sheet.props.backdropComponent({}).props.appearsOnIndex, 0);
  assert.equal(sheet.props.backdropComponent({}).props.disappearsOnIndex, -1);
});
