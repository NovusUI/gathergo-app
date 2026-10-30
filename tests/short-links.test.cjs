const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTypeScript } = require('./loadTypeScript.cjs');
const { buildShortShareLink, buildShareTargetRoute, resolveScannedLink } = loadTypeScript('utils/shareLinks.ts');

test('short links use a branded eight-character path and route each destination correctly', () => {
  assert.equal(buildShortShareLink('8nQ4xK2p'), 'https://gathergo.events/s/8nQ4xK2p');
  assert.deepEqual(resolveScannedLink(buildShortShareLink('8nQ4xK2p')), { kind: 'short', code: '8nQ4xK2p' });
  for (const [kind, path] of [['event', '/event/'], ['foodbank', '/food-bank/'], ['carpool', '/carpool/']]) {
    assert.equal(buildShareTargetRoute(kind, 'id-1'), `${path}id-1`);
    assert.deepEqual(resolveScannedLink(`https://gathergo.events${path}id-1`), { kind, id: 'id-1' });
  }
});
test('short QR parsing rejects other hosts, invalid codes, encoded separators and extra path segments', () => {
  for (const value of ['https://evil.example/s/8nQ4xK2p', 'https://gathergo.events/s/short', 'https://gathergo.events/s/123456789', 'https://gathergo.events/s/8nQ4xK2p/elsewhere', 'https://gathergo.events/s/%2F8nQ4xK', 'https://gathergo.events/s/8nQ!xK2p']) assert.equal(resolveScannedLink(value), null);
});

let query = { isPending: true }, navigated = [], retried = 0;
const { default: Page } = loadTypeScript('app/s/[code].tsx', {
  'expo-router': { useLocalSearchParams: () => ({ code: '8nQ4xK2p' }), Redirect: 'Redirect' },
  'react-native-safe-area-context': { SafeAreaView: 'SafeArea' },
  'react-native': { Text: 'Text', View: 'View' },
  '@/services/queries': { useResolvedShortLink: () => query },
  '@/utils/navigation': { useLockedRouter: () => ({ replace: route => navigated.push(route) }) },
  '@/components/buttons/CustomBtn1': { default: 'Button' },
  '@/components/ui/ImpactPageLoader': { default: 'Loader' },
  twrnc: { default: () => ({}) },
});
function* nodes(node) {
  if (!node || typeof node !== 'object') return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child);
}
test('opening a short link waits for resolution and then uses the real target ID', () => {
  query = { isPending: true };
  assert.equal([...nodes(Page())].find(node => node.type === 'Redirect'), undefined);
  assert.ok([...nodes(Page())].find(node => node.type === 'Loader'));
  query = { data: { data: { code: '8nQ4xK2p', kind: 'foodbank', targetId: 'food-event' } } };
  assert.equal(Page().props.href, '/food-bank/food-event');
});
test('a failed resolver has a retry and never fabricates a destination', async () => {
  query = { isPending: false, isError: true, refetch: async () => { retried++; } };
  assert.equal([...nodes(Page())].find(node => node.type === 'Redirect'), undefined);
  const buttons = [...nodes(Page())].filter(node => node.type === 'Button');
  await buttons.find(node => node.props.title === 'Try again').props.onPress();
  assert.equal(retried, 1);
  buttons.find(node => node.props.title === 'Go home').props.onPress();
  assert.deepEqual(navigated, ['/']);
});

const shared = [], errors = [];
let carpoolQuery;
const { useCarpoolShare } = loadTypeScript('hooks/useCarpoolShare.ts', {
  'react-native': { Share: { share: async data => shared.push(data) } },
  '@/services/queries': { useShortShareLink: (kind, id, enabled) => { assert.equal(kind, 'carpool'); assert.equal(id, 'ride-1'); assert.equal(enabled, true); return carpoolQuery; } },
  '@/utils/globalErrorHandler': { showGlobalError: error => errors.push(error) },
});
test('both carpool share surfaces use the resolved short link', async () => {
  carpoolQuery = { data: buildShortShareLink('Ride1234'), isPending: false, isError: false };
  await useCarpoolShare('ride-1', true).share();
  assert.equal(shared.at(-1).message, '🚗 Join my carpool 👉 https://gathergo.events/s/Ride1234');
});
test('carpool sharing waits for a lookup and retries errors without sharing an absent link', async () => {
  shared.length = 0;
  carpoolQuery = { isPending: true, isError: false };
  await useCarpoolShare('ride-1', true).share();
  assert.deepEqual(shared, []);
  let retries = 0;
  carpoolQuery = { isPending: false, isError: true, refetch: async () => { retries++; } };
  await useCarpoolShare('ride-1', true).share();
  assert.equal(retries, 1);
  assert.deepEqual(shared, []);
});
