const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { AxiosError } = require('axios');
function loader() {
  delete require.cache[require.resolve('./loadTypeScript.cjs')];
  return require('./loadTypeScript.cjs').loadTypeScript;
}
const { getCarpoolRequestState } = loader()('utils/carpoolRequests.ts');
const request = (id, status, requestedAt, userId = 'rider') => ({
  id, userId, carpoolId: 'ride', status, requestedAt, origin: 'Library gate',
  note: null, estimatedDistance: null,
  isFollowingRequester: true, isFollowedByRequester: false,
  user: { id: userId, username: 'ada', profilePicUrlTN: null },
});
const declined = request('old', 'DECLINED', '2026-10-24T10:00:00Z');
const removed = request('removed', 'REMOVED', '2026-10-25T09:00:00Z');
const pending = request('new', 'PENDING', '2026-10-25T10:00:00Z');

test('the latest request controls current status while an earlier decline stays visible', () => {
  const requests = [pending, declined];
  const state = getCarpoolRequestState(requests, 'rider');
  assert.equal(state.currentRequest, pending);
  assert.equal(state.previousDecision, declined);
  assert.equal(state.hasBeenRemoved, false);
  assert.deepEqual(requests, [pending, declined], 'reading history does not reorder server data');
  const accepted = { ...pending, status: 'ACCEPTED' };
  assert.equal(getCarpoolRequestState([declined, accepted], 'rider').currentRequest, accepted);
});
test('removal is remembered and another rider’s history does not affect this rider', () => {
  assert.equal(getCarpoolRequestState([declined, removed], 'rider').hasBeenRemoved, true);
  assert.equal(getCarpoolRequestState([removed], 'someone-else').previousDecision, null);
  assert.equal(getCarpoolRequestState([], 'rider').currentRequest, null);
});

function* nodes(node) {
  if (!node || typeof node !== 'object') return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child);
}
const texts = tree => [...nodes(tree)].filter(n => n.type === 'Text').map(n => n.props.children);
const tw = () => ({});
const hooks = { ...React, useMemo: fn => fn(), useRef: value => ({ current: value }), useImperativeHandle() {}, useEffect() {}, useState: value => [value, () => {}] };
const common = {
  react: hooks, '@/hooks/useAppTheme': { useAppTheme: () => ({ tw, color: value => value }) },
  '@/hooks/useResponsiveLayout': { useResponsiveLayout: () => ({ availableWidth: 390, insets: { top: 24 } }) },
  'react-native': { Text: 'Text', View: 'View', TouchableOpacity: 'TouchableOpacity', Share: { share() {} } },
};
const { default: RequestSheet } = loader()('app/(app)/carpool/bottomSheets/ViewRequestBS.tsx', {
  ...common, '@/components/carpool/RequestCard': { default: 'RequestCard' },
  '@/hooks/useCarpoolShare': { useCarpoolShare: () => ({ isPending: false, isError: false, share() {} }) },
  '@gorhom/bottom-sheet': { default: 'Sheet', BottomSheetBackdrop: 'Backdrop', BottomSheetScrollView: 'ScrollView' },
  'lucide-react-native': { CheckCircle2: 'Icon', Clock3: 'Icon', Share2: 'Icon' },
});

test('the pooler sees previous outcomes beside a new pending request and in read-only history', () => {
  const tree = RequestSheet.render({ carpool: { id: 'ride', passengers: [declined, pending, { ...removed, userId: 'another', user: { ...removed.user, id: 'another', username: 'motun' } }] } }, null);
  const active = [...nodes(tree)].filter(n => n.type === 'RequestCard');
  assert.equal(active.length, 1);
  assert.equal(active[0].props.requestId, 'new');
  assert.equal(active[0].props.previousDecision, 'DECLINED');
  assert.equal(active[0].props.isFollowingRequester, true);
  assert.equal(active[0].props.isFollowedByRequester, false);
  assert.ok(texts(tree).includes('Previously declined'));
  assert.ok(texts(tree).includes('Previously removed'));
  assert.ok(texts(tree).includes('@motun'));
});
test('approved request cards receive the requester relationship as well', () => {
  const approved = { ...pending, status: 'ACCEPTED', isFollowingRequester: false, isFollowedByRequester: true };
  const tree = RequestSheet.render({ carpool: { id: 'ride', passengers: [approved] } }, null);
  const card = [...nodes(tree)].find(n => n.type === 'RequestCard');
  assert.equal(card.props.isFollowingRequester, false);
  assert.equal(card.props.isFollowedByRequester, true);
});

const { default: FollowBadge } = loader()('components/carpool/CarpoolFollowBadge.tsx', {
  ...common,
  'lucide-react-native': { UserRoundCheck: 'FollowingIcon', UserRoundPlus: 'FollowerIcon', UsersRound: 'MutualIcon' },
});
const { default: RiderRequestCard } = loader()('components/carpool/RequestCard.tsx', {
  ...common,
  './CarpoolFollowBadge': { default: FollowBadge },
  'expo-image': { Image: 'Image' },
  '@expo/vector-icons': { Feather: 'Icon', Ionicons: 'Icon' },
  '@tanstack/react-query': { useQueryClient: () => ({ invalidateQueries() {} }) },
  '@/utils/globalErrorHandler': { showGlobalError() {}, showGlobalSuccess() {} },
  '@/services/mutations': {
    useCarpoolRequestRes: () => ({ mutateAsync() {}, isPending: false }),
    useRemovePassenger: () => ({ mutateAsync() {}, isPending: false }),
  },
});
for (const [isFollowingRequester, isFollowedByRequester, label, icon] of [
  [true, false, 'Following', 'FollowingIcon'],
  [false, true, 'Follower', 'FollowerIcon'],
  [true, true, 'Mutual follow', 'MutualIcon'],
  [false, false, null, null],
]) {
  test(`request cards show ${label || 'no tag'} beneath the requester photo`, () => {
    const card = RiderRequestCard({ status: 'PENDING', imageUrl: 'avatar.jpg', name: 'Ada', message: 'Library gate', requestId: 'request', carpoolId: 'ride', isFollowingRequester, isFollowedByRequester });
    const badgeNode = [...nodes(card)].find(n => n.type === FollowBadge);
    const photoColumn = [...nodes(card)].find(n => [n.props?.children].flat().includes(badgeNode));
    const children = [photoColumn.props.children].flat();
    assert.ok([...nodes(children[0])].some(n => n.type === 'Image'));
    assert.equal(children[1], badgeNode);
    const badge = FollowBadge(badgeNode.props);
    if (label === null) {
      assert.equal(badge, null);
    } else {
      assert.ok(texts(badge).includes(label));
      assert.ok([...nodes(badge)].some(n => n.type === icon));
      assert.match(badge.props.accessibilityLabel, /person/);
    }
  });
}
test('previous requests remain visible when no pending or approved riders remain', () => {
  const tree = RequestSheet.render({ carpool: { id: 'ride', passengers: [removed] } }, null);
  assert.ok(texts(tree).includes('Previous requests'));
  assert.equal(texts(tree).includes('No requests yet'), false);
  assert.equal([...nodes(tree)].some(n => n.type === 'RequestCard'), false);
});

function sendFixture(failure) {
  let options, stateIndex = 0;
  const changes = [], submitted = [], successes = [], errors = [], invalidations = [];
  const load = loader();
  const { default: SendSheet } = load('app/(app)/carpool/bottomSheets/SendRequestBS.tsx', {
    ...common,
    react: { ...hooks, useState: initial => { const index = stateIndex++; return [index === 1 ? 'Library gate' : initial, value => changes.push([index, value])]; } },
    'react-native': { Text: 'Text', View: 'View', Modal: 'Modal', Switch: 'Switch', ScrollView: 'ScrollView', KeyboardAvoidingView: 'KeyboardAvoidingView', Platform: { OS: 'ios' } },
    'react-native-safe-area-context': { SafeAreaView: 'SafeArea' },
    '@/components/buttons/SheetCloseButton': { default: 'Close' }, '@/components/View': { default: 'View' },
    '@/components/buttons/CustomBtn1': { default: 'Button' }, '@/components/inputs/CustomInput1': { default: 'Input' }, '@/components/inputs/CustomTextArea': { default: 'TextArea' },
    '@/hooks/useLocationManager': { useLocationManager: () => ({ coords: null, requestLocation() {}, error: null, openSettings() {} }) },
    '@/services/mutations': { useRequestCarpool: (id, callbacks) => {
      options = callbacks;
      return { isPending: false, mutate: data => { submitted.push(data); if (failure) options.onError(failure); } };
    } },
    '@tanstack/react-query': { useQueryClient: () => ({ invalidateQueries: data => invalidations.push(data) }) },
    '@/utils/globalErrorHandler': { showGlobalError: value => errors.push(value), showGlobalSuccess: value => successes.push(value), showGlobalWarning() {} },
  });
  const tree = SendSheet.render({ carpoolId: 'ride' }, null);
  return { tree, changes, submitted, successes, errors, invalidations, get options() { return options; } };
}
test('a removed rider gets the API error without a success toast, closing the sheet, or an unhandled async send', () => {
  const message = 'You were removed from this ride and cannot request it again';
  const f = sendFixture(new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, { status: 403, data: { message } }));
  const button = [...nodes(f.tree)].find(n => n.type === 'Button');
  assert.doesNotThrow(() => button.props.onPress());
  assert.deepEqual(f.submitted, [{ origin: 'Library gate' }]);
  assert.deepEqual(f.successes, []);
  assert.deepEqual(f.errors, [message]);
  assert.equal(f.changes.some(([index, value]) => index === 3 && value === false), false);
  assert.equal(f.invalidations.length, 1);
});
test('a confirmed new request still reports success and closes the request sheet', () => {
  const f = sendFixture();
  f.options.onSuccess({ status: 'success', message: 'Request successful', data: pending });
  assert.deepEqual(f.successes, ['Request sent successfully']);
  assert.ok(f.changes.some(([index, value]) => index === 3 && value === false));
});
