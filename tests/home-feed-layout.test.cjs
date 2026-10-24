const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { loadTypeScript } = require('./loadTypeScript.cjs');
function* nodes(node) {
  if (!node || typeof node !== 'object') return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child);
}
const one = (root, type) => [...nodes(root)].find(node => node.type === type);
const text = root => [...nodes(root)].flatMap(node => [node.props.children].flat(Infinity).filter(value => typeof value === 'string' || typeof value === 'number')).join('');
const tw = strings => ({ classes: strings.join('') });
const state = { tab: 'Gogo picks', bannerIndex: 0, cursor: 0, routes: [] };
const { getAdaptiveLayout } = loadTypeScript('utils/layout.ts');
let homeWidth = 390, homeHeight = 751, homeExpanded = false, homePullProgress = 0;
const homeLayout = () => ({ ...getAdaptiveLayout(homeWidth, homeHeight, 1), fontScale: 1 });
const { default: Home } = loadTypeScript('app/(app)/(tabs)/index.tsx', {
  '@/hooks/useResponsiveLayout': { useResponsiveLayout: homeLayout },
  '@/hooks/useHomeReachability': { useHomeReachability: (restingHeight, maxExpansion) => ({
    headerHeight: { value: restingHeight + (homeExpanded ? maxExpansion : homePullProgress * maxExpansion) },
    headerStyle: { height: restingHeight + (homeExpanded ? maxExpansion : homePullProgress * maxExpansion) },
    expanded: homeExpanded, panGesture: 'home-pan', scrollGesture: 'feed-scroll', scrollHandler: 'feed-offset-handler', toggle() { homeExpanded = !homeExpanded; },
  }) },
  'react-native-safe-area-context': { SafeAreaView: 'SafeArea' },
  'react-native-gesture-handler': { GestureDetector: 'Detector' },
  'react-native-reanimated': { default: { View: 'AnimatedView', ScrollView: 'Scroll' }, useAnimatedStyle: fn => fn() },
  '@/components/gogo/tasks/interestMap/PostEventSurveyPrompt': { PostEventSurveyPrompt: 'Survey' },
  '@/components/Tab': { default: 'Tab' },
  '@/components/gogo/mascot/GatherGoMascot': { GatherGoMascot: 'Gogo' },
  '@/components/ui/CarpoolCard': { default: 'Carpool' }, '@/components/ui/EventCard': { default: 'Event' },
  '@/components/ui/GgCircleArtwork': { default: 'CircleArt' }, '@/components/gogo/mascot/MascotMoment': { MascotMoment: 'Moment' },
  '@/components/ui/ImpactPageLoader': { default: 'Loader' },
  '@/context/AuthContext': { useAuth: () => ({ user: { id: 'ada', username: 'ada' } }) },
  '@/services/queries': {
    useForYouEvents: () => ({ data: { data: [{ id: 'event-1', title: 'Community gathering' }] } }),
    useForYouCarpools: () => ({ data: { data: [{ id: 'ride-1', event: { title: 'Community gathering' } }] } }),
    useHomeAdCards: () => ({ data: { data: [] } }),
  },
  '@/utils/navigation': { useLockedRouter: () => ({ push: route => state.routes.push(route), replace: route => state.routes.push(route) }) },
  '@/utils/utils': { formatBadgeCount: String },
  '@/hooks/useLocationManager': { useLocationManager: () => ({ requestLocation() {} }) },
  '@/hooks/useNotifications': { useNotifications: () => ({ unreadCount: 0 }) },
  '@/hooks/useSocketReactHook': { useUnreadCounts: () => ({ data: { totalUnread: 0 } }) },
  '@expo/vector-icons': { Ionicons: 'Icon' },
  react: { useRef: current => ({ current }), useEffect() {}, useState: () => {
    const key = state.cursor++ === 0 ? 'tab' : 'bannerIndex';
    return [state[key], next => { state[key] = next; }];
  } },
  'react-native': { Animated: { View: 'AnimatedView', add: (a, b) => a + b }, Dimensions: { get: () => ({ width: 390 }) }, StyleSheet: { create: value => value }, ScrollView: 'Scroll', View: 'View', Text: 'Text', TouchableOpacity: 'Button', Image: 'Image' },
  twrnc: { default: tw },
});
function home() { state.cursor = 0; return Home(); }
function mainScroll(page) { return [...nodes(page)].find(node => node.type === 'Scroll' && !node.props.horizontal); }
function carouselFor(page) { return [...nodes(page)].find(node => node.type === 'Scroll' && node.props.horizontal); }
function stickyRow(page) {
  return [...nodes(page)].find(node => node.type === 'View' && [node.props.children].flat().some(child => child?.type === 'Tab'));
}
test('Home scrolls its two-size card away and keeps the horizontal tab row in a native sticky header', () => {
  state.tab = 'Gogo picks';
  const page = home(), scroll = mainScroll(page), carousel = carouselFor(page);
  assert.equal(one(carousel, 'AnimatedView').props.style.height, 124);
  assert.equal([...nodes(stickyRow(page))].filter(node => node.type === 'Tab').length, 3);
  assert.deepEqual(scroll.props.stickyHeaderIndices, [1]);
  assert.strictEqual(carouselFor(scroll.props.children[0]), carousel);
  const sticky = scroll.props.children[1];
  const cloned = React.cloneElement(sticky, {style: {flex: 1}});
  assert.equal([...nodes(stickyRow(cloned))].filter(node => node.type === 'Tab').length, 3);
  assert.ok(one(scroll.props.children[2], 'Event'));
  assert.equal(page.props.gesture, 'home-pan');
  assert.equal([...nodes(page)].find(node => node.props.gesture === 'feed-scroll').props.children, scroll);
  assert.equal(scroll.props.onScroll, 'feed-offset-handler');
  carousel.props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { x: 390 } } });
  assert.equal(state.bannerIndex, 1);
});
test('Home tab changes and event, ride, Circle, notification and message routes remain connected', () => {
  state.tab = 'Gogo picks'; state.routes = [];
  one(home(), 'Event').props.onPress();
  [...nodes(stickyRow(home()))].find(node => node.props.title === 'Carpool').props.onPress();
  one(home(), 'Carpool').props.onPress();
  [...nodes(stickyRow(home()))].find(node => node.props.title === 'Circle').props.onPress();
  const circle = [...nodes(home())].find(node => node.type === 'Button' && one(node, 'Moment'));
  circle.props.onPress();
  for (const button of [...nodes(home())].filter(node => node.type === 'Button' && one(node, 'Icon')).slice(0, 2)) button.props.onPress();
  assert.deepEqual(state.routes, ['/event/event-1', '/carpool/ride-1', '/circle', '/notifications', '/conversations']);
});
test('Home reflows cards and carousel pages on unfolding without changing the active tab', () => {
  try {
    state.tab = 'Carpool'; homeWidth = 1200;
    let page = home();
    const carousel = [...nodes(page)].find(node => node.type === 'Scroll' && node.props.horizontal);
    assert.equal(carousel.props.children[0].props.style.width, homeLayout().pageWidth);
    assert.equal(one(page, 'Carpool').props.id, 'ride-1');
    const wrapper = [...nodes(page)].find(node => node.type === 'View' && node.props.children?.type === 'Carpool');
    assert.equal(wrapper.props.style.width, homeLayout().cardWidth);
    homeWidth = 390;
    page = home();
    assert.equal(one(page, 'Carpool').props.id, 'ride-1');
    assert.equal(state.tab, 'Carpool');
  } finally { homeWidth = 390; state.tab = 'Gogo picks'; }
});
test('each Home tab keeps the same native scroll area and top-only pull gate', () => {
  try {
    for (const tab of ['Gogo picks', 'Carpool', 'Circle']) {
      state.tab = tab;
      const scroll = mainScroll(home());
      assert.deepEqual(scroll.props.stickyHeaderIndices, [1]);
      assert.equal(scroll.props.onScroll, 'feed-offset-handler');
    }
  } finally { state.tab = 'Gogo picks'; }
});
test('Home uses gestures and screen-reader actions without adding a visible reachability button', () => {
  try {
    homeExpanded = false;
    const page = home();
    assert.equal(text(page).includes('Bring tabs closer'), false);
    assert.equal([...nodes(page)].some(node => node.props.accessibilityLabel === 'Bring Home tabs closer'), false);
    const carousel = [...nodes(page)].find(node => node.type === 'Scroll' && node.props.horizontal);
    const banner = one(carousel, 'Button');
    assert.deepEqual(banner.props.accessibilityActions, [{ name: 'expandHeader', label: 'Expand Home header' }]);
    banner.props.onAccessibilityAction({ nativeEvent: { actionName: 'expandHeader' } });
    const expanded = home();
    assert.equal(one(carouselFor(expanded), 'AnimatedView').props.style.height, homeLayout().bannerHeight + homeLayout().reachExpansion);
    homeHeight = 520;
    const shortCarousel = [...nodes(home())].find(node => node.type === 'Scroll' && node.props.horizontal);
    assert.deepEqual(one(shortCarousel, 'Button').props.accessibilityActions, []);
  } finally { homeHeight = 751; homeExpanded = false; }
});
test('banner copy stays grouped and reveals the description at intermediate heights without changing the text layout', () => {
  try {
    homeExpanded = false;
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      homePullProgress = progress;
      const page = home(), banners = [...nodes(carouselFor(page))].filter(node => node.type === 'Button');
      const copy = banners[1], content = copy.props.children;
      assert.equal(copy.props.style[0].justifyContent, 'center');
      assert.equal(content.type, 'View'); assert.equal(content.props.style.gap, 4);
      const description = [...nodes(content)].find(node => node.type === 'AnimatedView');
      assert.equal(description.props.style[1].maxHeight, 16 * (1 + 2 * progress));
      assert.equal(description.props.children.props.numberOfLines, 3, 'text line count stays stable throughout the gesture');
    }
  } finally { homeExpanded = false; homePullProgress = 0; }
});
const { LIGHT_COLORS, resolveThemeColor } = loadTypeScript('constants/theme.ts');
let feedMode = 'dark';
const { default: FeedCard } = loadTypeScript('components/feed/FeedCard.tsx', {
  '@/hooks/useAppTheme': { useAppTheme: () => ({ tw, color: (darkColor, role) => resolveThemeColor(feedMode, darkColor, role) }) },
  '@expo/vector-icons': { Ionicons: 'Icon' }, 'lucide-react-native': { UserRound: 'User' },
  react: { useEffect() {}, useRef: value => ({ current: value }) },
  'react-native': { Animated: { View: 'Card', Value: class { interpolate() { return '0deg'; } } }, View: 'View', Text: 'Text', TouchableOpacity: 'Button', Image: 'Image' },
  twrnc: { default: tw },
});
const feed = (type, changes = {}) => ({ id: type, type, title: 'Event update', content: 'An update for your event.', metadata: {}, actions: [], isPinned: false, createdAt: new Date().toISOString(), ...changes });
test('all feed types share the ticket purchase appearance and retain their distinct icons', () => {
  const icons = { TICKET_PURCHASED: 'ticket-outline', DONATION_MADE: 'heart-outline', REGISTRATION: 'person-add-outline', CURRENT_FRENZY: 'flame-outline', MILESTONE: 'trophy-outline', EVENT_CREATED: 'add-circle-outline' };
  for (const [type, icon] of Object.entries(icons)) {
    const tree = FeedCard({ feed: feed(type, { isPinned: true }) });
    const style = one(tree, 'Card').props.style[1];
    assert.equal(style.backgroundColor, '#0C1447'); assert.equal(style.borderColor, '#0C7F7F');
    assert.equal(one(tree, 'Icon').props.name, icon);
    assert.equal([...nodes(tree)].some(node => node.props.name === 'pin'), false);
    assert.equal(one(tree, 'Card').props.style.some(style => style?.borderLeftWidth), false);
  }
});
test('simplified feed cards keep action payloads, amount normalization and progress details', () => {
  const action = { type: 'REGISTER', eventId: 'event-1' }; let opened;
  const tree = FeedCard({ feed: feed('REGISTRATION_PERCENT', { title: 'Registration ₦50', metadata: { registrationFeeInNaira: 5000, percentage: 0.5, targetInNaira: 10000 }, actions: [action] }), onAction: value => { opened = value; } });
  tree.props.onPress(); assert.strictEqual(opened, action);
  assert.match(text(tree), /Registration ₦5,000/); assert.match(text(tree), /50%/); assert.match(text(tree), /Goal:/);
  assert.equal(FeedCard({ feed: feed('EVENT_CREATED') }).props.disabled, true);
});
test('donations restore their purple progress fill inside the shared ticket card and retain actions and messages', () => {
  const action = { type: 'DONATE', label: 'Support Now', url: '/events/event-1/donate' };
  let opened;
  const tree = FeedCard({ feed: feed('DONATION_MADE', {
    title: 'New Donation', content: 'Ada donated to community tree planting.',
    metadata: { percentage: 0.5, amountInNaira: 5000, targetInNaira: 10000, supportMessage: 'Let our community grow.' },
    actions: [action],
  }), onAction: value => { opened = value; } });
  const progress = [...nodes(tree)].find(node => node.props.accessibilityRole === 'progressbar');
  assert.ok(progress, 'donations show their fundraising fill');
  assert.equal(progress.props.style[1].width, '50%');
  assert.equal(progress.props.style[1].backgroundColor, '#9B51E022');
  assert.equal(progress.props.pointerEvents, 'none');
  assert.deepEqual(progress.props.accessibilityValue, { min: 0, max: 100, now: 50 });
  assert.equal(one(tree, 'Card').props.style[1].backgroundColor, '#0C1447');
  assert.equal(one(tree, 'Card').props.style[1].borderColor, '#0C7F7F');
  assert.equal(one(tree, 'Icon').props.name, 'heart-outline');
  assert.match(text(tree), /50%/);
  assert.match(text(tree), /₦5,000/);
  assert.match(text(tree), /Goal: ₦10,000/);
  assert.match(text(tree), /Let our community grow/);
  tree.props.onPress();
  assert.strictEqual(opened, action);
});
test('donation milestones use the original near-target color and cap funded and overfunded goals at full', () => {
  for (const [type, ratio, percent] of [
    ['DONATION_PROGRESS_MILESTONE', 0.1, 10],
    ['DONATION_50_PERCENT', 0.5, 50],
    ['DONATION_90_PERCENT', 0.9, 90],
    ['DONATION_95_PERCENT', 0.95, 95],
    ['DONATION_100_PERCENT', 1, 100],
    ['DONATION_100_PERCENT', 1.5, 100],
  ]) {
    const tree = FeedCard({ feed: feed(type, { metadata: { percentage: ratio } }) });
    const progress = [...nodes(tree)].find(node => node.props.accessibilityRole === 'progressbar');
    assert.ok(progress, type);
    assert.equal(progress.props.style[1].width, `${percent}%`);
    assert.equal(progress.props.style[1].backgroundColor, ratio >= 0.9 ? '#FF6B6B22' : '#9B51E022');
    assert.equal(progress.props.accessibilityValue.now, percent);
    assert.match(text(tree), new RegExp(`${percent}%`));
  }
});
test('zero donation progress stays empty and donation updates without a percentage have no fill', () => {
  const zero = FeedCard({ feed: feed('DONATION_MADE', { metadata: { percentage: 0 } }) });
  const progress = [...nodes(zero)].find(node => node.props.accessibilityRole === 'progressbar');
  assert.ok(progress);
  assert.equal(progress.props.style[1].width, '0%');
  assert.equal(progress.props.accessibilityValue.now, 0);
  for (const percentage of [undefined, null]) {
    const tree = FeedCard({ feed: feed('DONATION_MADE', { metadata: { percentage } }) });
    assert.equal([...nodes(tree)].some(node => node.props.accessibilityRole === 'progressbar'), false);
  }
});
test('ticket, registration and other feed cards keep their shared appearance without a donation fill', () => {
  for (const type of ['TICKET_PURCHASED', 'TICKET_PROGRESS_MILESTONE', 'REGISTRATION_PROGRESS_MILESTONE', 'CURRENT_FRENZY', 'EVENT_CREATED']) {
    const tree = FeedCard({ feed: feed(type, { metadata: { percentage: 0.5 } }) });
    assert.equal([...nodes(tree)].some(node => node.props.accessibilityRole === 'progressbar'), false);
    assert.equal(one(tree, 'Card').props.style[1].backgroundColor, '#0C1447');
  }
});
test('donation progress preserves the ticket surfaces and donation colors in both app appearances', () => {
  try {
    for (const mode of ['light', 'dark']) {
      feedMode = mode;
      for (const ratio of [0.5, 0.95]) {
        const tree = FeedCard({ feed: feed('DONATION_MADE', { metadata: { percentage: ratio } }) });
        const progress = [...nodes(tree)].find(node => node.props.accessibilityRole === 'progressbar');
        assert.ok(progress);
        assert.equal(progress.props.style[1].backgroundColor, `${ratio < 0.9 ? '#9B51E0' : mode === 'light' ? LIGHT_COLORS.danger : '#FF6B6B'}22`);
        assert.equal(one(tree, 'Card').props.style[1].backgroundColor, mode === 'light' ? LIGHT_COLORS.surface : '#0C1447');
      }
    }
  } finally { feedMode = 'dark'; }
});
const icons = Object.fromEntries(['Check','Clock3','Gift','Handshake','Heart','LockKeyhole','PartyPopper','Sparkles','Sprout','Tent'].map(icon => [icon, icon]));
const { BadgeEmblem, default: BadgeCard } = loadTypeScript('components/gogo/tasks/badges/BadgeCard.tsx', {
  './BadgeProgress': { default: 'Progress' }, './GatherArtwork': { GatherCardBackground: 'PartnershipBackground' },
  'lucide-react-native': icons, 'react-native': { View: 'View', Text: 'Text', TouchableOpacity: 'Button' }, twrnc: { default: tw },
});
test('Gather achievements recover their own icons while retaining the partnership card artwork', () => {
  for (const [icon, component] of Object.entries({ party: 'PartyPopper', sparkles: 'Sparkles', handshake: 'Handshake', clock: 'Clock3', tent: 'Tent', sprout: 'Sprout', gift: 'Gift', heart: 'Heart' })) {
    assert.ok(one(BadgeEmblem({ badge: { icon, status: 'earned' } }), component));
  }
  assert.ok(one(BadgeCard({ badge: { name: 'First Gift', category: 'giving', icon: 'gift', status: 'earned', description: 'Give once.', progress: {} }, onPress() {} }), 'PartnershipBackground'));
});
