const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTypeScript } = require('./loadTypeScript.cjs');

function* nodes(node) {
  if (!node || typeof node !== 'object') return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child);
}
function text(node) {
  return [...nodes(node)].flatMap(child => [child.props?.children].flat(Infinity).filter(value => typeof value === 'string')).join(' ');
}
const rn = Object.fromEntries(['View', 'Text', 'TouchableOpacity', 'FlatList', 'SectionList', 'Modal', 'ScrollView', 'Switch'].map(name => [name, name]));
const badge = (changes = {}) => ({
  code: 'FAMILIAR_FACE', name: 'Familiar Face', category: 'attending', icon: 'sparkles', description: 'Keep showing up for your community.',
  requirement: 'Check in to 5 different events. Multiple tickets count once.', status: 'in_progress', earnedAt: null, isPublic: false,
  progress: { current: 3, target: 5, remaining: 2, percent: 60, unit: 'events', label: '3 / 5 events' },
  gogo: { message: 'Check in to 2 more events to earn Familiar Face.' }, ...changes,
});
const firstGift = badge({ code: 'FIRST_GIFT', name: 'First Gift', category: 'giving', icon: 'gift', status: 'earned', earnedAt: '2026-01-01T00:00:00.000Z', progress: { current: 1, target: 1, remaining: 0, percent: 100, unit: 'donations', label: '1 / 1 donations' }, requirement: 'Make 1 successful donation. Refunded payments do not count.', gogo: { message: 'You earned First Gift. Thank you!' } });
const collection = { badges: [badge(), firstGift, badge({ code: 'GATHER_MAKER', name: 'Gather Maker', status: 'locked', progress: { current: 0, target: 1, remaining: 1, percent: 0, unit: 'events', label: '0 / 1 events' } })], earnedCount: 1, totalCount: 3 };
const envelope = { status: 'success', message: 'Request successful', data: collection };
const calls = [];
let failure;
const urls = loadTypeScript('services/urls.ts', { '@/constants/network': { API_BASE_URL: 'https://gathergo.test/api/v1' } });
const send = async (method, ...args) => { calls.push([method, ...args]); if (failure) throw failure; return { data: envelope }; };
const api = loadTypeScript('services/serviceFn.ts', {
  '@/api/client': { default: { get: (...args) => send('GET', ...args), patch: (...args) => send('PATCH', ...args) } },
  '@/api/uploadClient': { uploadClient: {} }, '@/utils/checkout': { checkoutDeadline() {} }, './urls': urls,
});
test('badge requests use the verified API envelope, routes and visibility body', async () => {
  assert.strictEqual(await api.getMyBadges(), envelope);
  assert.deepEqual(calls.at(-1), ['GET', '/badges/me']);
  assert.strictEqual(await api.updateBadgeVisibility({ code: 'FIRST_GIFT', isPublic: false }), envelope);
  assert.deepEqual(calls.at(-1), ['PATCH', '/badges/me/FIRST_GIFT/visibility', { isPublic: false }]);
  failure = new Error('offline');
  await assert.rejects(api.getMyBadges(), error => error === failure);
  await assert.rejects(api.updateBadgeVisibility({ code: 'FIRST_GIFT', isPublic: true }), error => error === failure);
  failure = undefined;
});

let account = { id: 'first-user' };
let queryConfig;
const queryKeys = loadTypeScript('services/queryKeys.ts');
const queries = loadTypeScript('services/queries.ts', {
  '@/context/AuthContext': { useAuth: () => ({ user: account }) }, './serviceFn': api, './queryKeys': queryKeys,
  '@tanstack/react-query': { useQuery: config => { queryConfig = config; return config; }, useInfiniteQuery: config => config },
});
test('personal badges are cached per signed-in account and disabled after logout', () => {
  queries.useMyBadges(); assert.deepEqual(queryConfig.queryKey, ['badges', 'first-user']);
  account = { id: 'second-user' }; queries.useMyBadges(); assert.deepEqual(queryConfig.queryKey, ['badges', 'second-user']);
  account = null; queries.useMyBadges(); assert.equal(queryConfig.enabled, false);
  account = { id: 'first-user' };
});
const cache = [];
let mutationConfig;
const mutations = loadTypeScript('services/mutations.ts', {
  '@/context/AuthContext': { useAuth: () => ({ user: account }) }, '@/utils/globalErrorHandler': { showGlobalError() {} }, '@/utils/storage': { saveItem() {} },
  './serviceFn': api, './queryKeys': queryKeys,
  '@tanstack/react-query': { useQueryClient: () => ({ setQueryData: (key, data) => cache.push(['set', key, data]), invalidateQueries: async ({ queryKey }) => cache.push(['refresh', queryKey]) }), useMutation: config => { mutationConfig = config; return config; } },
});
test('visibility saves replace personal badge data and refresh the public profile only after success', async () => {
  mutations.useBadgeVisibility();
  assert.equal(mutationConfig.onMutate, undefined);
  await mutationConfig.onSuccess(envelope);
  assert.deepEqual(cache, [['set', ['badges', 'first-user'], envelope], ['refresh', [queryKeys.QUERY_KEYS.userPublicProfile, 'first-user']]]);
});

const state = { values: [], cursor: 0, query: { isPending: false, isError: false, isRefetching: false, data: envelope, refetch: () => { state.refetched++; } }, refetched: 0 };
const { default: Experience } = loadTypeScript('components/gogo/tasks/badges/BadgesExperience.tsx', {
  react: { useState: initial => { const index = state.cursor++; if (!(index in state.values)) state.values[index] = initial; return [state.values[index], value => { state.values[index] = value; }]; } },
  'react-native': rn, twrnc: { default: () => ({}) },
  '@/components/gogo/mascot/MascotMoment': { MascotMoment: 'Gogo' },
  '@/components/ui/AppRefreshControl': { default: 'RefreshControl', RefreshIndicator: 'Refreshing' },
  '@/components/ui/ImpactPageLoader': { default: 'Loader' },
  '@/services/queries': { useMyBadges: () => ({ ...state.query, isSuccess: !state.query.isPending && !state.query.isError }) },
  './BadgeCard': { default: 'BadgeCard' }, './BadgeDetails': { default: 'BadgeDetails' },
});
const render = (props = {}) => { state.cursor = 0; return Experience(props); };
const list = (props = {}) => [...nodes(render(props))].find(node => node.type === 'SectionList');
const intro = () => list().props.renderItem({ item: collection.badges[0], index: 0 });
test('Gather shows the entire collection without filters, keeps Gogo’s closest next step and opens details', () => {
  state.values = [];
  assert.strictEqual(list().props.sections[0].data, collection.badges);
  const header = intro();
  assert.match(text(header), /Gather/);
  assert.equal([...nodes(header)].some(node => node.type === 'TouchableOpacity'), false);
  const gogo = [...nodes(intro())].find(node => node.type === 'Gogo');
  assert.equal(gogo.props.message, collection.badges[0].gogo.message);
  [...nodes(list().props.renderItem({ item: firstGift, index: 1 }))].find(node => node.type === 'BadgeCard').props.onPress();
  const details = [...nodes(render())].find(node => node.type === 'BadgeDetails');
  assert.equal(details.props.badge.code, 'FIRST_GIFT'); details.props.onClose();
  assert.equal([...nodes(render())].some(node => node.type === 'BadgeDetails'), false);
  assert.deepEqual(list().props.sections[0].data.map(item => item.status), ['in_progress', 'earned', 'locked']);
  list().props.refreshControl.props.onRefresh(); assert.equal(state.refetched, 1);
});
test('Gather loading and retry do not invent awards or activity', () => {
  state.query.isPending = true;
  const header = { type: 'ProfileSummary' };
  const tabs = { type: 'ProfileTabs' };
  const props = { ListHeaderComponent: header, renderSectionHeader: () => tabs };
  const loading = list(props);
  assert.strictEqual(loading.props.ListHeaderComponent, header);
  assert.strictEqual(loading.props.renderSectionHeader(), tabs);
  assert.equal(loading.props.stickySectionHeadersEnabled, true);
  assert.equal(loading.props.ListFooterComponent.type, 'Loader');
  state.query.isPending = false; state.query.isError = true;
  assert.strictEqual(list(props).props.ListHeaderComponent, header);
  const retry = [...nodes(list(props).props.ListFooterComponent)].find(node => node.type === 'TouchableOpacity'); retry.props.onPress(); assert.equal(state.refetched, 2);
  state.query.isError = false;
  assert.strictEqual(list().props.sections[0].data, collection.badges);
});

const visibility = { isPending: false, isError: false, error: null, mutate: payload => calls.push(['visibility', payload]) };
const { default: Details } = loadTypeScript('components/gogo/tasks/badges/BadgeDetails.tsx', {
  'react-native': rn, twrnc: { default: () => ({}) }, 'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 24, bottom: 34 }) },
  '@/components/buttons/SheetCloseButton': { default: 'Close' }, '@/components/gogo/mascot/MascotMoment': { MascotMoment: 'Gogo' },
  '@/components/ui/AppLoader': { default: 'Loader' }, './BadgeProgress': { default: 'Progress' },
  '@/services/mutations': { useBadgeVisibility: () => visibility }, '@/utils/apiError': { getApiErrorMessage: (_error, fallback) => fallback },
  '@/utils/dateTimeHandler': { formatShortDate: () => '1 Jan 2026' }, './BadgeCard': { BadgeEmblem: 'Emblem' },
});
const detail = entry => Details({ badge: entry, onClose() {} });
test('badge details show the exact requirement, progress and Gogo guidance for a locked or progressing badge', () => {
  const view = detail(badge());
  assert.match(text(view), /Gather details/);
  assert.match(text(view), /What it takes/); assert.match(text(view), /Check in to 5 different events/); assert.match(text(view), /3 \/ 5 events/);
  assert.equal([...nodes(view)].find(node => node.type === 'Gogo').props.message, badge().gogo.message);
  assert.equal([...nodes(view)].some(node => node.type === 'Switch'), false);
});
test('earned donation details celebrate with Gogo and keep visibility tied to the saved server value', () => {
  const view = detail(firstGift);
  assert.equal([...nodes(view)].find(node => node.type === 'Gogo').props.variant, 'success');
  assert.match(text(view), /Giving achievements start private/);
  assert.match(text(view), /Earned/);
  const control = [...nodes(view)].find(node => node.type === 'Switch');
  assert.equal(control.props.value, false); control.props.onValueChange(true);
  assert.deepEqual(calls.at(-1), ['visibility', { code: 'FIRST_GIFT', isPublic: true }]);
  assert.equal([...nodes(detail(firstGift))].find(node => node.type === 'Switch').props.value, false);
  visibility.isPending = true;
  const saving = detail(firstGift); assert.equal([...nodes(saving)].find(node => node.type === 'Switch').props.disabled, true);
  assert.equal([...nodes(saving)].find(node => node.type === 'Close').props.disabled, true);
  visibility.isPending = false; visibility.isError = true;
  assert.match(text(detail(firstGift)), /Could not save visibility/);
  visibility.isError = false;
});
const { default: Progress } = loadTypeScript('components/gogo/tasks/badges/BadgeProgress.tsx', { 'react-native': rn, '@/components/ui/ProgressBar': { default: 'Bar' } });
test('progress bars expose exact units and values to screen readers', () => {
  const result = Progress({ badge: badge() });
  assert.equal(result.props.accessibilityRole, 'progressbar');
  assert.deepEqual(result.props.accessibilityValue, { min: 0, max: 5, now: 3, text: '3 / 5 events' });
});
