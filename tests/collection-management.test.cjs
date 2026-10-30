const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTypeScript } = require('./loadTypeScript.cjs');
let cursor = 0;
const states = [], requests = [], errors = [], warnings = [], successes = [];
let fail = false, notificationFailed = false, pending = false;
const { default: Controls } = loadTypeScript('components/foodBank/CollectionControls.tsx', {
  react: { useState: initial => { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = value; }]; } },
  'react-native': { Text: 'Text', TouchableOpacity: 'Link', View: 'View' },
  'react-native-modal-datetime-picker': { default: 'Picker' },
  '@/components/inputs/DatePicker': { default: 'DateButton' },
  '@/components/buttons/CustomBtn1': { default: 'Button' },
  '@/components/ui/InfoDisclosure': { default: 'Info' },
  '@/hooks/useFoodBank': { useManageFoodBankCollection: () => ({
    update: { isPending: pending, mutateAsync: async payload => { requests.push(['state', payload]); if (fail) throw new Error('Collection changed. Refresh before trying again.'); } },
    reschedule: { isPending: pending, mutateAsync: async payload => { requests.push(['schedule', payload]); if (fail) throw new Error('Could not reschedule'); return { data: { notificationFailed } }; } },
  }) },
  '@/utils/apiError': { getApiErrorMessage: error => error.message },
  '@/utils/globalErrorHandler': { showGlobalError: message => errors.push(message), showGlobalWarning: message => warnings.push(message), showGlobalSuccess: message => successes.push(message) },
  twrnc: { default: () => ({}) },
});
const base = {
  status: 'NOT_STARTED', availability: 'not_started', canOpen: true, canManage: true, canReserve: true,
  timeZone: 'Africa/Lagos', startDate: '2035-01-01T10:00:00Z', endDate: '2035-01-01T20:00:00Z', updatedAt: '2034-12-01T00:00:00Z',
};
function* nodes(node) { if (!node || typeof node !== 'object') return; yield node; for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child); }
const texts = tree => [...nodes(tree)].filter(node => node.type === 'Text').map(node => [node.props.children].flat(Infinity).join(''));
const button = (tree, title) => [...nodes(tree)].find(node => node.type === 'Button' && node.props.title === title);
const link = (tree, title) => [...nodes(tree)].find(node => node.type === 'Link' && texts(node).includes(title));
const render = (collection = base) => { cursor = 0; return Controls({ eventId: 'bank', collection }); };
const flush = () => new Promise(setImmediate);
function reset() { states.length = 0; requests.length = 0; errors.length = 0; warnings.length = 0; successes.length = 0; fail = false; pending = false; notificationFailed = false; }

test('only the organiser sees collection controls and a future day cannot be opened', () => {
  reset();
  assert.equal([...nodes(render({ ...base, canManage: false }))].some(node => node.type === 'Button' || node.type === 'Link'), false);
  assert.equal(button(render({ ...base, canOpen: false, availability: 'upcoming' }), 'Start collection').props.disabled, true);
});
test('start, pause, resume, close and reopen use the verified API state and revision', async () => {
  reset();
  for (const [status, title, target] of [
    ['NOT_STARTED', 'Start collection', 'OPEN'], ['OPEN', 'Pause collection', 'PAUSED'],
    ['PAUSED', 'Resume collection', 'OPEN'], ['OPEN', 'Close collection', 'CLOSED'], ['CLOSED', 'Reopen collection', 'OPEN'],
  ]) {
    button(render({ ...base, status }), title).props.onPress(); await flush();
    assert.deepEqual(requests.at(-1), ['state', { status: target, expectedUpdatedAt: base.updatedAt }]);
  }
});
test('failures show their actual error and pending mutations prevent another action', async () => {
  reset(); fail = true;
  button(render(), 'Start collection').props.onPress(); await flush();
  assert.deepEqual(errors, ['Collection changed. Refresh before trying again.']);
  pending = true;
  const action = button(render(), 'Start collection');
  assert.equal(action.props.disabled, true); action.props.onPress(); await flush();
  assert.equal(requests.length, 1);
});
async function chooseNewDate() {
  link(render(), 'Reschedule collection').props.onPress();
  [...nodes(render())].find(node => node.type === 'DateButton').props.onPress();
  const picker = [...nodes(render())].find(node => node.type === 'Picker');
  assert.equal(picker.props.timeZoneName, 'Africa/Lagos');
  picker.props.onConfirm(new Date('2035-01-02T10:00:00Z'));
}
test('rescheduling previews a real date then preserves passes through the server endpoint', async () => {
  reset(); await chooseNewDate();
  button(render(), 'Reschedule and notify holders').props.onPress(); await flush();
  assert.deepEqual(requests, [['schedule', { startDate: '2035-01-02T10:00:00.000Z', expectedUpdatedAt: base.updatedAt }]]);
  assert.equal(successes.length, 1); assert.equal(warnings.length, 0);
});
test('notification failure is visible without claiming that delivery succeeded', async () => {
  reset(); notificationFailed = true; await chooseNewDate();
  button(render(), 'Reschedule and notify holders').props.onPress(); await flush();
  assert.equal(successes.length, 0); assert.match(warnings[0], /notifications could not be sent/);
});
test('an open collection must be paused before changing its schedule; cancelling never submits', () => {
  reset();
  assert.equal(link(render({ ...base, status: 'OPEN' }), 'Reschedule collection').props.disabled, true);
  link(render(), 'Reschedule collection').props.onPress();
  link(render(), 'Cancel reschedule').props.onPress();
  assert.equal(button(render(), 'Reschedule and notify holders'), undefined);
  assert.deepEqual(requests, []);
});

const queries = [], mutations = [], cacheWrites = [], invalidated = [], apiCalls = [];
const cache = {
  setQueryData: (key, data) => cacheWrites.push([key, data]),
  invalidateQueries: ({ queryKey }) => { invalidated.push(queryKey); return Promise.resolve(); },
};
const hooks = loadTypeScript('hooks/useFoodBank.ts', {
  '@tanstack/react-query': {
    useQuery: config => { queries.push(config); return config; },
    useMutation: config => { mutations.push(config); return config; },
    useQueryClient: () => cache,
  },
  '@/context/AuthContext': { useAuth: () => ({ user: { id: 'user-1' } }) },
  '@/services/serviceFn': {
    getFoodBankCollection: async id => { apiCalls.push(['get', id]); return { data: base }; },
    updateFoodBankCollection: async (id, payload) => { apiCalls.push(['update', id, payload]); return { data: { ...base, status: payload.status } }; },
    rescheduleFoodBankCollection: async (id, payload) => { apiCalls.push(['reschedule', id, payload]); return { data: { ...base, startDate: payload.startDate, notificationFailed: false } }; },
  },
});
test('collection reads use the signed-in user cache and fetch the real endpoint', async () => {
  const query = hooks.useFoodBankCollection('bank');
  assert.deepEqual(query.queryKey, ['foodBankCollection', 'user-1', 'bank']);
  assert.equal(query.enabled, true);
  await query.queryFn();
  assert.deepEqual(apiCalls.at(-1), ['get', 'bank']);
  assert.equal(hooks.useFoodBankCollection('bank', false).enabled, false);
});
test('management mutations refresh actual event and pass data without inventing a local result', async () => {
  cacheWrites.length = 0; invalidated.length = 0;
  const manage = hooks.useManageFoodBankCollection('bank');
  const response = await manage.update.mutationFn({ status: 'OPEN', expectedUpdatedAt: base.updatedAt });
  await manage.update.onSuccess(response);
  assert.deepEqual(cacheWrites[0], [['foodBankCollection', 'user-1', 'bank'], response]);
  assert.ok(invalidated.some(key => JSON.stringify(key) === JSON.stringify(['eventDetails', 'bank'])));
  assert.ok(invalidated.some(key => key[0] === 'mealPass'));
  assert.ok(invalidated.some(key => key[0] === 'myMealPasses'));
  const moved = await manage.reschedule.mutationFn({ startDate: '2035-01-02T10:00:00Z', expectedUpdatedAt: base.updatedAt });
  await manage.reschedule.onSuccess(moved);
  assert.equal(cacheWrites.at(-1)[1], moved);
  await manage.update.onError();
  assert.deepEqual(invalidated.at(-1), ['foodBankCollection']);
});

test('suggested arrival times use the saved event timezone across a calendar boundary', () => {
  const { formatEventDateTime } = loadTypeScript('utils/dateTimeHandler.ts');
  const label = formatEventDateTime('2034-12-31T23:00:00Z', '2034-12-31T23:15:00Z', 'Africa/Lagos');
  assert.match(label, /Jan 1/); assert.match(label, /12:00/); assert.doesNotMatch(label, /Dec 31/);
});


test('a schedule editor keeps the reviewed revision if the collection changes while editing', async () => {
  reset(); await chooseNewDate();
  button(render({ ...base, updatedAt: '2035-01-01T11:00:00Z' }), 'Reschedule and notify holders').props.onPress();
  await flush();
  assert.equal(requests[0][1].expectedUpdatedAt, base.updatedAt);
});
