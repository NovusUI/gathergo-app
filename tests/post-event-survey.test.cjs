const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTypeScript } = require('./loadTypeScript.cjs');
function* nodes(node) { if (!node || typeof node !== 'object') return; yield node; for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child); }
function text(node) { return [...nodes(node)].flatMap(child => [child.props?.children].flat(Infinity).filter(value => typeof value === 'string')).join(' '); }
const native = { View: 'View', Text: 'Text', TouchableOpacity: 'Button', ScrollView: 'ScrollView', Modal: 'Modal', ActivityIndicator: 'Loader' };
const event = { id: 'event-1', title: 'Community tree planting', endDate: '2026-10-23T12:00:00Z' };
const profile = { interests: ['Nature'], helpModes: ['attend'], city: 'Lagos', learningEnabled: false, weights: [{ id: 'Nature', label: 'Environment', accent: '#60D394', weight: 8, source: 'both' }] };
const envelope = { status: 'success', message: 'Request successful', data: { profile, rating: 'LOVED', moreLikeThis: true, changes: [{ ...profile.weights[0], previousWeight: 5 }] } };
const state = { values: [], cursor: 0, closed: 0, saved: [], deferred: [] };
const save = { isPending: false, isError: false, error: null, data: undefined, mutate: data => state.saved.push(data) };
const defer = { isPending: false, isError: false, error: null, mutate: (id, callbacks) => state.deferred.push([id, callbacks]) };
const useState = initial => { const index = state.cursor++; if (!(index in state.values)) state.values[index] = initial; return [state.values[index], next => { state.values[index] = typeof next === 'function' ? next(state.values[index]) : next; }]; };
const { PostEventSurvey } = loadTypeScript('components/gogo/tasks/interestMap/PostEventSurvey.tsx', {
  '@/components/gogo/mascot/GatherGoMascot': { GatherGoMascot: 'Gogo' },
  '@/components/ui/AppLoader': { default: 'Loader' },
  '@/services/mutations': { useSaveEventFeedback: () => save, useDeferEventFeedback: () => defer },
  '@/utils/apiError': { getApiErrorMessage: (error, fallback) => error.message || fallback },
  './SurveyMapChange': { SurveyMapChange: 'MapChange' },
  react: { useState }, 'react-native': native, 'react-native-safe-area-context': { SafeAreaView: 'SafeArea' }, twrnc: { default: () => ({}) },
});
const render = () => { state.cursor = 0; return PostEventSurvey({ event, onClose: () => state.closed++ }); };
const button = label => [...nodes(render())].find(node => node.props?.accessibilityLabel === label || (node.type === 'Button' && text(node).trim() === label));
function reset() { Object.assign(state, { values: [], cursor: 0, closed: 0, saved: [], deferred: [] }); Object.assign(save, { isPending: false, isError: false, error: null, data: undefined }); Object.assign(defer, { isPending: false, isError: false, error: null }); }
test('a survey names the actual attended event, offers three reactions and needs an answer', () => {
  reset(); assert.match(text(render()), /How was Community tree planting/);
  assert.equal([...nodes(render())].filter(node => node.props?.accessibilityRole === 'radio').length, 3);
  assert.equal(button('See my map').props.disabled, true);
  assert.ok([...nodes(render())].some(node => node.type === 'Gogo'));
  assert.equal([...nodes(render())].some(node => node.type === 'MapChange'), false);
});
test('the selected reaction and More like this save through the API before a map change is shown', () => {
  reset(); button('Loved it').props.onPress(); button('More like this').props.onPress();
  assert.equal(button('Loved it').props.accessibilityState.checked, true);
  button('See my map').props.onPress();
  assert.deepEqual(state.saved, [{ eventId: event.id, rating: 'LOVED', moreLikeThis: true }]);
  assert.equal(state.closed, 0); assert.equal([...nodes(render())].some(node => node.type === 'MapChange'), false);
  save.data = envelope;
  assert.strictEqual([...nodes(render())].find(node => node.type === 'MapChange').props.changes, envelope.data.changes);
  assert.equal(button('Loved it').props.disabled, true);
  button('Done').props.onPress(); assert.equal(state.closed, 1);
});
test('Not for me clears More like this and failed saves retain the answer for retry', () => {
  reset(); button('More like this').props.onPress(); button('Not for me').props.onPress();
  assert.equal(button('More like this').props.disabled, true); assert.equal(button('More like this').props.accessibilityState.checked, false);
  button('See my map').props.onPress(); assert.deepEqual(state.saved[0], { eventId: event.id, rating: 'NOT_FOR_ME', moreLikeThis: false });
  save.isError = true; save.error = new Error('Offline');
  assert.match(text(render()), /Offline/); assert.equal(state.closed, 0);
  assert.equal(button('Not for me').props.accessibilityState.checked, true);
  assert.equal([...nodes(render())].some(node => node.type === 'MapChange'), false);
  save.isPending = true; render().props.onRequestClose(); assert.equal(state.deferred.length, 0);
  assert.equal(button('Not now').props.disabled, true);
});
test('Not now closes only after a real deferral succeeds', () => {
  reset(); button('Not now').props.onPress(); assert.equal(state.closed, 0);
  assert.equal(state.deferred[0][0], event.id); state.deferred[0][1].onSuccess(); assert.equal(state.closed, 1);
});
const { SurveyMapChange } = loadTypeScript('components/gogo/tasks/interestMap/SurveyMapChange.tsx', { 'react-native': native, twrnc: { default: () => ({}) } });
test('map confirmation uses actual changed weights and handles no topic change truthfully', () => {
  const changed = SurveyMapChange({ changes: envelope.data.changes });
  assert.match(text(changed), /YOUR MAP JUST CHANGED/);
  assert.ok([...nodes(changed)].some(node => node.props?.accessibilityLabel === 'Environment: 5 before, 8 now'));
  const unchanged = SurveyMapChange({ changes: [] }); assert.match(text(unchanged), /YOUR ANSWER IS SAVED/); assert.doesNotMatch(text(unchanged), /JUST CHANGED/);
});
const promptEffects = [];
let focused = true, enabled, pending = { data: { data: event } }, account = { id: 'user-1', hasPreferences: true };
const { PostEventSurveyPrompt } = loadTypeScript('components/gogo/tasks/interestMap/PostEventSurveyPrompt.tsx', {
  '@/context/AuthContext': { useAuth: () => ({ user: account }) }, '@/services/queries': { usePendingEventFeedback: value => { enabled = value; return pending; } },
  '@react-navigation/native': { useIsFocused: () => focused }, './PostEventSurvey': { PostEventSurvey: 'Survey' }, react: { useState, useEffect: effect => promptEffects.push(effect) }, '@/services/queryKeys': { QUERY_KEYS: { pendingEventFeedback: ['pendingEventFeedback'] } }, '@tanstack/react-query': { useQueryClient: () => ({ setQueryData: (_key, data) => { pending = { data }; } }) },
});
const prompt = () => { state.cursor = 0; return PostEventSurveyPrompt(); };
test('only the focused feed offers one survey per visit and ignores an empty pending response', () => {
  state.values = []; assert.equal(prompt().type, 'Survey');
  prompt().props.onClose(); assert.equal(prompt(), null); assert.equal(enabled, false);
  focused = false; assert.equal(prompt(), null); assert.equal(enabled, false); promptEffects.forEach(effect => effect());
  focused = true; pending = { data: { data: { ...event, id: 'another-event' } } }; assert.equal(prompt().type, 'Survey');
  pending = { data: { data: null } }; assert.equal(prompt(), null);
  pending = { data: { data: event } }; account.hasPreferences = false; assert.equal(prompt(), null); account.hasPreferences = true;
});
const calls = []; const urls = loadTypeScript('services/urls.ts', { '@/constants/network': { API_BASE_URL: 'https://api.gathergo.test/api/v1' } });
const api = loadTypeScript('services/serviceFn.ts', {
  '@/api/client': { default: { get: async (...args) => { calls.push(['GET', ...args]); return { data: { ...envelope, data: event } }; }, post: async (...args) => { calls.push(['POST', ...args]); return { data: envelope }; } } },
  '@/api/uploadClient': { uploadClient: {} }, '@/utils/checkout': { checkoutDeadline() {} }, './urls': urls,
});
test('pending, answer and deferral calls match the inspected API contract', async () => {
  await api.getPendingEventFeedback(); assert.deepEqual(calls.at(-1), ['GET', '/preferences/event-feedback/pending']);
  assert.strictEqual(await api.saveEventFeedback({ eventId: event.id, rating: 'LOVED', moreLikeThis: true }), envelope);
  assert.deepEqual(calls.at(-1), ['POST', `/preferences/event-feedback/${event.id}`, { rating: 'LOVED', moreLikeThis: true }]);
  await api.deferEventFeedback(event.id); assert.deepEqual(calls.at(-1), ['POST', `/preferences/event-feedback/${event.id}/defer`]);
});
const queryKeys = loadTypeScript('services/queryKeys.ts'); let mutation; const cache = [];
const hooks = loadTypeScript('services/mutations.ts', {
  '@/context/AuthContext': { useAuth: () => ({ user: account }) }, '@/utils/globalErrorHandler': { showGlobalError() {} }, '@/utils/storage': { saveItem() {} }, './serviceFn': api, './queryKeys': queryKeys,
  '@tanstack/react-query': { useQueryClient: () => ({ setQueryData: (...args) => cache.push(['set', ...args]), invalidateQueries: async config => cache.push(['invalidate', config]) }), useMutation: config => { mutation = config; return config; } },
});
test('saving updates the account map and feed without unmounting the confirmation modal', async () => {
  hooks.useSaveEventFeedback(); await mutation.onSuccess(envelope);
  assert.deepEqual(cache[0], ['set', [...queryKeys.QUERY_KEYS.interestProfile, account.id], { ...envelope, data: profile }]);
  assert.ok(cache.some(item => item[0] === 'invalidate' && item[1].refetchType === 'none'));
  assert.ok(cache.some(item => item[0] === 'invalidate' && JSON.stringify(item[1].queryKey) === JSON.stringify([queryKeys.QUERY_KEYS.foryouEvents])));
  assert.equal(cache.some(item => item[0] === 'set' && item[2]?.data === null), false);
});
let query;
const queries = loadTypeScript('services/queries.ts', { '@/context/AuthContext': { useAuth: () => ({ user: account }) }, './serviceFn': api, './queryKeys': queryKeys, '@tanstack/react-query': { useQuery: config => { query = config; return config; }, useInfiniteQuery: config => config } });
test('the pending survey is account-scoped and waits for map onboarding', () => {
  queries.usePendingEventFeedback(true); assert.deepEqual(query.queryKey, [...queryKeys.QUERY_KEYS.pendingEventFeedback, account.id]); assert.equal(query.enabled, true);
  account.hasPreferences = false; queries.usePendingEventFeedback(true); assert.equal(query.enabled, false); account.hasPreferences = true;
});
