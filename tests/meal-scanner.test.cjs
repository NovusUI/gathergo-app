const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTypeScript } = require('./loadTypeScript.cjs');
const { formatEventDateTime } = loadTypeScript('utils/dateTimeHandler.ts');
const { default: ScanResult } = loadTypeScript('app/(app)/scanner/scan-result.tsx', {
  'react-native': Object.fromEntries(['Modal', 'ScrollView', 'Text', 'TouchableOpacity', 'View'].map(name => [name, name])),
  'lucide-react-native': Object.fromEntries(['Calendar', 'CheckCircle', 'Clock', 'Shield', 'Ticket', 'User', 'XCircle'].map(name => [name, name])),
  '@/components/ui/AppLoader': { default: 'Loader' },
  twrnc: { default: () => ({}) },
});
const start = '2035-01-01T10:00:00Z';
const end = '2035-01-01T10:15:00Z';
const base = {
  isValid: false, canMarkUsed: true, type: 'meal', qrCode: 'ggmeal:opaque',
  eventName: 'Community table', userName: 'Ada', eventDate: start,
  message: 'The organiser has not opened collection yet.',
  mealCollection: { status: 'not_started', collectionStart: start, collectionEnd: end, arrival: 'early', timeZone: 'Africa/Lagos' },
};
function* nodes(node) {
  if (!node || typeof node !== 'object') return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child);
}
const labels = tree => [...nodes(tree)].filter(node => node.type === 'Text').map(node => [node.props.children].flat(Infinity).join(''));
const action = (tree, title) => [...nodes(tree)].find(node => node.type === 'TouchableOpacity' && labels(node).includes(title));
const props = { visible: true, onClose() {}, onMarkAsUsed() {}, isProcessing: false };
const render = (result = base, extra = {}) => ScanResult({ ...props, result, ...extra });

test('a not-yet-open meal scan shows the actual collection window without an invalid or permission warning', () => {
  const tree = render();
  const text = labels(tree);
  assert.ok(text.includes('Not yet open'));
  assert.ok(text.includes('Suggested arrival window'));
  assert.ok(text.includes(formatEventDateTime(start, end, 'Africa/Lagos')));
  assert.equal(text.filter(label => label === base.message).length, 1);
  assert.doesNotMatch(text.join(' '), /invalid|view only|permission/i);
  assert.equal(action(tree, 'Confirm collection'), undefined);
});

test('late and previously collected passes have distinct states and cannot be confirmed', () => {
  for (const [status, title, message] of [
    ['ended', 'Collection day ended', 'The collection day has ended. Please speak with the organiser.'],
    ['paused', 'Collection paused', 'Collection is paused.'],
    ['closed', 'Collection closed', 'Collection is closed.'],
    ['collected', 'Already collected', 'This meal has already been collected.'],
  ]) {
    const tree = render({ ...base, message, mealCollection: { ...base.mealCollection, status } });
    assert.ok(labels(tree).includes(title));
    assert.doesNotMatch(labels(tree).join(' '), /invalid|view only|permission/i);
    assert.equal(action(tree, 'Confirm collection'), undefined);
  }
});

test('only an authorised scan of a ready meal can confirm collection', () => {
  let confirmed = 0;
  const ready = { ...base, isValid: true, message: 'Ready for collection', mealCollection: { ...base.mealCollection, status: 'ready' } };
  const tree = render(ready, { onMarkAsUsed: () => confirmed++ });
  action(tree, 'Confirm collection').props.onPress();
  assert.equal(confirmed, 1);
  assert.doesNotMatch(labels(tree).join(' '), /permission|view only|invalid/i);
  const viewOnly = render({ ...ready, canMarkUsed: false });
  assert.equal(action(viewOnly, 'Confirm collection'), undefined);
  assert.ok(labels(viewOnly).includes('View only'));
  assert.match(labels(viewOnly).join(' '), /Ask the event organiser for scanning permission/);
});

test('a processing collection cannot be submitted again and a result can be closed or scanned again', () => {
  const ready = { ...base, isValid: true, mealCollection: { ...base.mealCollection, status: 'ready' } };
  const pending = render(ready, { isProcessing: true });
  assert.equal([...nodes(pending)].find(node => node.type === 'Loader') !== undefined, true);
  assert.equal([...nodes(pending)].find(node => node.type === 'TouchableOpacity' && node.props.accessibilityState?.busy).props.disabled, true);
  let closed = 0;
  const tree = render(base, { onClose: () => closed++ });
  action(tree, 'Scan Another').props.onPress();
  [...nodes(tree)].find(node => node.props.accessibilityLabel === 'Close scan result').props.onPress();
  assert.equal(closed, 2);
});

test('unknown QR codes stay invalid and ordinary ticket confirmation still works', () => {
  const unknown = render({ isValid: false, canMarkUsed: false, qrCode: 'unknown', message: 'QR code not found' });
  assert.ok(labels(unknown).includes('Invalid'));
  assert.ok(labels(unknown).includes('QR code not found'));
  assert.doesNotMatch(labels(unknown).join(' '), /permission/);
  const ticket = render({ isValid: true, canMarkUsed: true, qrCode: 'ticket', type: 'ticket', message: 'Valid', eventDate: start });
  assert.ok(action(ticket, 'Mark as Used'));
  assert.equal(action(ticket, 'Confirm collection'), undefined);
  assert.equal(render(null), null);
});


test('early and late arrivals keep the confirm action while collection is open', () => {
  for (const [arrival, label] of [['early', 'Arrived early'], ['late', 'Arrived after suggested window']]) {
    const tree = render({ ...base, isValid: true, mealCollection: { ...base.mealCollection, status: 'ready', arrival } });
    assert.ok(action(tree, 'Confirm collection'));
    assert.match(labels(tree).join(' '), new RegExp(label));
    assert.doesNotMatch(labels(tree).join(' '), /invalid|permission/i);
  }
});
