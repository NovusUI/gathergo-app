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
const { default: Home } = loadTypeScript('app/(app)/(tabs)/index.tsx', {
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
  react: { useEffect() {}, useState: () => {
    const key = state.cursor++ === 0 ? 'tab' : 'bannerIndex';
    return [state[key], next => { state[key] = next; }];
  } },
  'react-native': { Dimensions: { get: () => ({ width: 390 }) }, StyleSheet: { create: value => value }, ScrollView: 'Scroll', View: 'View', Text: 'Text', TouchableOpacity: 'Button', Image: 'Image' },
  twrnc: { default: tw },
});
function home() { state.cursor = 0; return Home(); }
function stickyRow(page) {
  const scroll = one(page, 'Scroll');
  const stickyChild = scroll.props.children[scroll.props.stickyHeaderIndices[0]];
  return [...nodes(React.cloneElement(stickyChild, { style: { flex: 1 } }))].find(node => node.props.style?.some?.(style => style?.classes?.includes('flex-row')));
}
test('Home scrolls its compact carousel away while preserving a horizontal native sticky tab row', () => {
  state.tab = 'Gogo picks';
  const page = home(), scroll = one(page, 'Scroll');
  assert.deepEqual(scroll.props.stickyHeaderIndices, [1]);
  const carousel = one(scroll.props.children[0], 'Scroll');
  assert.equal(carousel.props.horizontal, true);
  assert.equal(one(carousel, 'Button').props.style.minHeight, 124);
  assert.equal([...nodes(stickyRow(page))].filter(node => node.type === 'Tab').length, 3);
  assert.ok(one(scroll.props.children[2], 'Event'));
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
const { default: FeedCard } = loadTypeScript('components/feed/FeedCard.tsx', {
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
