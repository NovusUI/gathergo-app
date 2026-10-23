const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTypeScript } = require('./loadTypeScript.cjs');
function* nodes(node) {
  if (!node || typeof node !== 'object') return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child);
}
const rn = { View: 'View', Text: 'Text', TouchableOpacity: 'Button', ScrollView: 'ScrollView', SectionList: 'SectionList' };
const state = { tab: 'About', cursor: 0, routes: [], fetched: 0, user: { id: 'user-1', fullName: 'Ada Example', isProfileComplete: true } };
const queries = {
  useUserProfile: () => ({ data: { data: { name: 'ada', bio: 'Meet people and make a difference.', profilePicUrl: undefined, eventsCount: 3, followersCount: 12, followingCount: 8 } }, isError: false, refetch() {} }),
  useMyBadges: () => ({ data: { data: { earnedCount: 2 } }, refetch() {} }),
  useGetUsersEvents: () => ({ data: { pages: [{ data: [] }] }, isFetchingNextPage: false, fetchNextPage: () => state.fetched++, hasNextPage: true, isPending: false }),
};
const { default: Profile } = loadTypeScript('app/(app)/(tabs)/profile.tsx', {
  '@/components/gogo/tasks/badges/GatherArtwork': { GatherIcon: 'GatherIcon' },
  '@/components/CustomeTopBarNav': { default: 'TopBar' }, '@/components/ProfileImageUploader': { default: 'Photo' }, '@/components/StatCard': { default: 'Stats' }, '@/components/Tab': { default: 'Tab' },
  '@/components/UserEventsTab': { default: 'Events' }, '@/components/buttons/CustomBtn1': { default: 'EditBio' }, '@/components/gogo/tasks/badges/BadgesExperience': { default: 'Gather' }, '@/components/ui/AppLoader': { default: 'Loader' },
  '@/context/AuthContext': { useAuth: () => ({ user: state.user }) }, '@/services/queries': queries,
  '@/utils/navigation': { useLockedRouter: () => ({ push: route => state.routes.push(route), replace: route => state.routes.push(route) }) },
  'expo-router': { useFocusEffect() {} }, 'lucide-react-native': { Settings: 'Settings' },
  react: { useCallback: callback => callback, useState: initial => [state.tab, next => { state.tab = next; }] },
  'react-native': rn, 'react-native-safe-area-context': { SafeAreaView: 'SafeArea' }, twrnc: { default: strings => ({ classes: strings.join('') }) },
});
const one = (root, type) => [...nodes(root)].find(node => node.type === type);
const tabsFor = page => {
  const scroll = one(page, 'ScrollView');
  return scroll ? scroll.props.children[1] : (one(page, 'Events') || one(page, 'Gather')).props.renderSectionHeader();
};
const select = title => {
  const tab = [...nodes(tabsFor(Profile()))].find(node => node.type === 'Tab' && node.props.title === title);
  assert.ok(tab, title); tab.props.onPress();
};
test('the compact profile keeps its summary in the scroll content and uses a sticky tab row', () => {
  state.tab = 'About';
  const page = Profile(); assert.equal(page.type, 'SafeArea');
  assert.deepEqual(page.props.edges, ['top']);
  assert.equal(one(page, 'TopBar').props.title, '@ada');
  const scroll = one(page, 'ScrollView'); assert.deepEqual(scroll.props.stickyHeaderIndices, [1]);
  const summary = scroll.props.children[0];
  assert.equal(one(summary, 'Stats').props.eventsCount, 3);
  assert.equal(one(summary, 'Stats').props.followersCount, 12);
  assert.ok(one(summary, 'Photo')); assert.ok(one(summary, 'EditBio'));
  assert.equal([...nodes(tabsFor(page))].filter(node => node.type === 'Tab').length, 3);
});
test('Events and Gather receive the same scrollable summary and pinned tabs without an outer ScrollView', () => {
  state.tab = 'About'; select('Events');
  const eventsPage = Profile(); const events = one(eventsPage, 'Events');
  assert.ok(events); assert.equal(one(eventsPage, 'ScrollView'), undefined);
  assert.ok(one(events.props.ListHeaderComponent, 'Stats')); assert.ok(one(events.props.ListHeaderComponent, 'EditBio'));
  select('Gather'); const gatherPage = Profile(); const gather = one(gatherPage, 'Gather');
  assert.ok(gather); assert.equal(one(gatherPage, 'ScrollView'), undefined);
  assert.ok(one(gather.props.ListHeaderComponent, 'Stats'));
  assert.deepEqual([...nodes(gather.props.renderSectionHeader())].filter(node => node.type === 'Tab').map(node => node.props.title), ['About', 'Events', 'Gather']);
});
test('About tabs stay in one row when React Native replaces the sticky child style', () => {
  state.tab = 'About';
  const stickyChild = tabsFor(Profile());
  // Native ScrollViewStickyHeader transfers this child's style to its wrapper.
  const clonedChild = require('react').cloneElement(stickyChild, { style: { flex: 1 } });
  const row = [...nodes(clonedChild)].find(node => node.props.style?.classes?.includes('flex-row'));
  assert.ok(row);
  assert.deepEqual(row.props.children.map(tab => tab.props.title), ['About', 'Events', 'Gather']);
});
test('editing the bio and opening settings retain their real navigation paths', () => {
  state.tab = 'About'; state.routes = [];
  one(Profile(), 'EditBio').props.onPress();
  const settings = one(Profile(), 'TopBar').props.rightNode; settings.props.onPress();
  state.user.isProfileComplete = false; one(Profile(), 'EditBio').props.onPress();
  assert.deepEqual(state.routes, ['/edit-bio', '/settings', '/profile-setup']);
  state.user.isProfileComplete = true;
});

const { default: Events } = loadTypeScript('components/UserEventsTab.tsx', {
  '@/components/ui/AppLoader': { default: 'Loader' }, '@/utils/navigation': { useLockedRouter: () => ({ push: route => state.routes.push(route) }) },
  './ui/EventCard': { default: 'EventCard' }, 'react-native': rn, twrnc: { default: () => ({}) },
});
const eventOptions = { events: [], isFetchingNextPage: false, fetchNextPage: () => state.fetched++, hasNextPage: true, isPending: true, ListHeaderComponent: { type: 'Summary' }, renderSectionHeader: () => ({ type: 'Tabs' }) };
test('event loading and empty states keep the profile summary and sticky tabs visible', () => {
  const loading = Events(eventOptions); assert.equal(loading.type, 'SectionList');
  assert.strictEqual(loading.props.ListHeaderComponent, eventOptions.ListHeaderComponent);
  assert.equal(loading.props.stickySectionHeadersEnabled, true);
  assert.equal(one(loading.props.ListFooterComponent, 'Loader').props.accessibilityLabel, 'Loading events');
  const empty = Events({ ...eventOptions, isPending: false });
  assert.strictEqual(empty.props.ListHeaderComponent, eventOptions.ListHeaderComponent);
  assert.equal(empty.props.ListFooterComponent.props.children, 'No events yet.');
});
test('event scrolling loads the next page once and keeps the existing event detail navigation', () => {
  state.fetched = 0; state.routes = [];
  const ready = { ...eventOptions, isPending: false, events: [{ id: 'event-1', title: 'Meet up' }] };
  const list = Events(ready); list.props.onEndReached();
  Events({ ...ready, isFetchingNextPage: true }).props.onEndReached();
  Events({ ...ready, hasNextPage: false }).props.onEndReached();
  Events({ ...ready, isPending: true }).props.onEndReached();
  assert.equal(state.fetched, 1);
  list.props.renderItem({ item: ready.events[0] }).props.onPress();
  assert.deepEqual(state.routes, ['/event/event-1']);
});

const photoState = { values: [], cursor: 0 };
const { default: Photo } = loadTypeScript('components/ProfileImageUploader.tsx', {
  '@/services/mutations': { useEditProfilePicture: () => ({ mutateAsync: async () => {} }) },
  '@/utils/globalErrorHandler': { showGlobalError() {}, showGlobalSuccess() {} },
  'expo-image': { Image: 'Image' }, 'expo-image-picker': {}, 'lucide-react-native': { Plus: 'Plus', UserRound: 'Person' },
  '@/components/ui/AppLoader': { default: 'Loader' }, 'react-native': rn, twrnc: { default: () => ({}) },
  react: { useState: initial => { const index = photoState.cursor++; if (!(index in photoState.values)) photoState.values[index] = initial; return [photoState.values[index], value => { photoState.values[index] = value; }]; } },
});
test('the profile photo appears when its real URL arrives after the first render', () => {
  photoState.values = []; photoState.cursor = 0;
  assert.equal(one(Photo({}), 'Image'), undefined);
  photoState.cursor = 0;
  const loaded = Photo({ uri: 'https://images.example/ada.jpg' });
  assert.equal(one(loaded, 'Image').props.source, 'https://images.example/ada.jpg');
  assert.equal(one(loaded, 'Button').props.accessibilityLabel, 'Change profile photo');
});
