const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTypeScript } = require('./loadTypeScript.cjs');
const { resolveScannedLink, buildEventShareLink, buildFoodBankShareLink, buildShortShareLink } = loadTypeScript('utils/shareLinks.ts');
const { eventSchema } = loadTypeScript('schemas/event.ts');
const { buildEventParticipationFormFields } = loadTypeScript('utils/eventForm.ts');

test('the two food bank QR codes have distinct routes and resolve without redeeming a pass', () => {
  assert.equal(buildEventShareLink('event-1'), 'https://gathergo.events/event/event-1');
  assert.equal(buildFoodBankShareLink('event-1'), 'https://gathergo.events/food-bank/event-1');
  assert.deepEqual(resolveScannedLink(buildFoodBankShareLink('event-1')), { kind: 'foodbank', id: 'event-1' });
  assert.deepEqual(resolveScannedLink(buildEventShareLink('event-1')), { kind: 'event', id: 'event-1' });
  for (const value of ['ggmeal:opaque-token', 'https://evil.example/event/event-1', 'https://gathergo.events.evil.example/event/event-1', 'javascript:alert(1)', 'https://gathergo.events/event/a%2Fb', 'https://gathergo.events/food-bank/', 'https://gathergo.events/event/event-1/extra']) {
    assert.equal(resolveScannedLink(value), null);
  }
});
const draft = {
  eventName: 'Community table', description: 'Meals for the neighbourhood', impactTitle: '', impactDescription: '',
  startDate: new Date('2035-01-01'), endDate: new Date('2035-01-01'), startTime: '10:00', endTime: '20:00',
  repeat: 'NONE', isRecurring: false, isPhysicalEvent: true, location: 'Community hall', links: [], tags: [],
  registrationType: 'foodbank', volunteerRoles: [], donationsEnabled: true,
  foodBankTotalMeals: 1000, foodBankSlotCapacity: 25, foodBankSlotMinutes: 15,
};
test('food bank publication requires real capacity and a physical venue', () => {
  assert.equal(eventSchema.safeParse(draft).success, true);
  for (const override of [{ foodBankTotalMeals: undefined }, { foodBankSlotCapacity: undefined }, { foodBankSlotMinutes: undefined }, { foodBankSlotCapacity: 1001 }, { foodBankSlotMinutes: 0 }, { foodBankSlotMinutes: 1.5 }, { foodBankTotalMeals: 0 }, { isPhysicalEvent: false }, { isRecurring: true }, { repeat: 'DAILY' }]) {
    assert.equal(eventSchema.safeParse({ ...draft, ...override }).success, false);
  }
});
test('collection hours must accommodate every meal before publishing', () => {
  const result = eventSchema.safeParse({ ...draft, endTime: '11:00' });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some(issue => issue.path[0] === 'foodBankSlotCapacity'));
  assert.equal(eventSchema.safeParse({ ...draft, foodBankTotalMeals: 50, endTime: '10:16' }).success, true, 'a partial final window still counts, matching the API');
});
test('food banks send collection settings, enable donations and never create priced meal tickets', () => {
  const fields = buildEventParticipationFormFields({ ...draft, donationsEnabled: false }, 'create');
  assert.deepEqual(fields, { foodBankTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, registrationType: 'foodbank', donationsEnabled: true, foodBankTotalMeals: 1000, foodBankSlotCapacity: 25, foodBankSlotMinutes: 15 });
  assert.equal(fields.tickets, undefined);
  assert.equal(fields.registrationFee, undefined);
});

const routes = [], claims = [], errors = [];
let ownedPass = null, queryFailed = false, pending = false, claimFailed = false, canReserve = true;
const pass = { timeZone: 'Africa/Lagos', id: 'meal-1', eventId: 'event-1', qrCode: 'ggmeal:opaque', collectionStart: '2035-01-01T10:00:00Z', collectionEnd: '2035-01-01T10:15:00Z', isUsed: false };
const { default: Page } = loadTypeScript('app/(app)/food-bank/[id].tsx', {
  '@/components/foodBank/CollectionControls': { default: 'CollectionControls' },
  '@/components/ui/InfoDisclosure': { default: 'InfoDisclosure' },
  'expo-router': { useLocalSearchParams: () => ({ id: 'event-1' }) },
  'react-native': { ScrollView: 'Scroll', Text: 'Text', View: 'View' },
  'react-native-safe-area-context': { SafeAreaView: 'SafeArea' },
  '@expo/vector-icons': { Ionicons: 'Icon' },
  '@/components/CustomeTopBarNav': { default: 'TopBar' },
  '@/components/buttons/CustomBtn1': { default: 'Button' },
  '@/components/ui/ImpactPageLoader': { default: 'Loader' },
  '@/services/queries': { useEventDetails: () => ({ data: { data: { ...draft, id: 'event-1', title: draft.eventName, startDate: '2035-01-01T10:00:00Z', endDate: '2035-01-01T20:00:00Z' } } }) },
  '@/hooks/useFoodBank': {
    useFoodBankCollection: () => ({ data: { data: { canReserve } } }),
    useMealPass: () => ({ data: { data: ownedPass }, isError: queryFailed, isSuccess: !queryFailed, isPending: false }),
    useClaimMeal: () => ({ isPending: pending, mutateAsync: async () => { claims.push('claim'); if (claimFailed) throw new Error('Full'); return { data: pass }; } }),
  },
  '@/utils/navigation': { useLockedRouter: () => ({ push: path => routes.push(path), replace: path => routes.push(path) }), safeGoBack() {} },
  '@/utils/globalErrorHandler': { showGlobalError: message => errors.push(message) },
  '@/utils/apiError': { getApiErrorMessage: error => error.message },
  twrnc: { default: () => ({}) },
});
function* nodes(node) {
  if (!node || typeof node !== 'object') return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child);
}
const button = title => [...nodes(Page())].find(node => node.type === 'Button' && node.props.title === title);
function reset() { canReserve = true; ownedPass = null; queryFailed = false; pending = false; claimFailed = false; routes.length = 0; claims.length = 0; errors.length = 0; }
test('the primary meal route reserves through the server and opens collection in transactions', async () => {
  reset();
  const action = button('Continue without donating');
  assert.match(action.props.buttonClassName, /bg-accentFill/);
  await action.props.onPress();
  await new Promise(setImmediate);
  assert.deepEqual(claims, ['claim']);
  assert.deepEqual(routes, ['/transaction/meal-1?type=MEAL&eventId=event-1']);
});
test('an existing meal pass is reused even after collection', async () => {
  reset(); ownedPass = { ...pass, isUsed: true };
  await button('View meal pass').props.onPress();
  assert.deepEqual(claims, []);
  assert.deepEqual(routes, ['/transaction/meal-1?type=MEAL&eventId=event-1']);
});
test('donating from meal collection opens actual donation checkout with its source parameter', () => {
  reset(); button('Donate and collect').props.onPress();
  assert.deepEqual(routes, ['/event/event-1?donate=1&donationSource=FOOD_BANK']);
  assert.deepEqual(claims, []);
});
test('a failed allocation cannot produce a success receipt or locally fabricated pass', async () => {
  reset(); claimFailed = true;
  await button('Continue without donating').props.onPress();
  await new Promise(setImmediate);
  assert.deepEqual(routes, []);
  assert.deepEqual(errors, ['Full']);
});
test('ownership must load successfully before reserving, and pending claims cannot repeat', async () => {
  reset(); queryFailed = true;
  assert.equal(button('Continue without donating'), undefined);
  reset(); pending = true;
  const action = button('Reserving collection window…');
  assert.equal(action.props.disabled, true);
  await action.props.onPress();
  assert.deepEqual(claims, []);
});

const shared = [], copied = [], exported = [], deleted = [], coverShares = [];
let finishCoverShare;
let shortLinkState = "ready";
const shareStates = [];
let shareCursor = 0;
const { default: ShareSheet } = loadTypeScript('components/eventInfo/EventShareSheet.tsx', {
  react: {
    useState: initial => {
      const index = shareCursor++;
      if (!(index in shareStates)) shareStates[index] = initial;
      return [shareStates[index], value => { shareStates[index] = value; }];
    },
    useRef: () => ({ current: { toDataURL: callback => callback('png-base64') } }),
  },
  'react-native': { Modal: 'Modal', Platform: { OS: 'android' }, ScrollView: 'Scroll', Share: { share: async data => shared.push(data) }, Text: 'Text', TouchableOpacity: 'Tab', View: 'View' },
  'react-native-safe-area-context': { SafeAreaView: 'SafeArea' },
  '@expo/vector-icons': { Ionicons: 'Icon' },
  'expo-clipboard': { setStringAsync: async value => { copied.push(value); return true; }, setImageAsync: async value => copied.push(value) },
  'expo-file-system': { cacheDirectory: 'file:///test-cache/', EncodingType: { Base64: 'base64' }, writeAsStringAsync: async (...args) => exported.push(args), deleteAsync: async path => deleted.push(path) },
  'expo-sharing': { isAvailableAsync: async () => true, shareAsync: async (...args) => shared.push(args) },
  'react-native-qrcode-svg': { default: 'QR' },
  '@/components/buttons/CustomBtn1': { default: 'Button' },
  '@/components/EventImageWithProcessing': { EventImageWithProcessing: 'EventCover' },
  '@/components/ui/AppLoader': { default: 'LinkLoader' },
  '@/services/queries': { useShortShareLink: kind => ({ data: shortLinkState === 'ready' ? buildShortShareLink(kind === 'foodbank' ? 'Meal1234' : 'Event123') : undefined, isPending: shortLinkState === 'pending', isError: shortLinkState === 'error', refetch: async () => { shortLinkState = 'ready'; } }) },
  '@/utils/shareEventImage': { shareEventImage: async options => { coverShares.push(options); if (finishCoverShare) await new Promise(resolve => { finishCoverShare = resolve; }); } },
  '@/utils/globalErrorHandler': { showGlobalError: message => errors.push(message), showGlobalSuccess() {} },
  twrnc: { default: Object.assign(() => ({}), { style: () => ({}) }) },
});
function shareSheet(props = {}) { shareCursor = 0; return ShareSheet({ visible: true, onClose() {}, eventId: 'event-1', title: 'Community table', foodBank: true, ...props }); }
test('event and food collection QR images remain visibly distinct when forwarded', () => {
  shareStates.length = 0;
  const tree = shareSheet();
  const eventQr = [...nodes(tree)].find(node => node.type === 'QR');
  assert.equal(eventQr.props.value, buildShortShareLink('Event123'));
  assert.match(eventQr.props.logoSVG, />EVENT</);
  [...nodes(tree)].find(node => node.type === 'Tab' && node.props.accessibilityRole === 'tab' && !node.props.accessibilityState.selected).props.onPress();
  const mealQr = [...nodes(shareSheet())].find(node => node.type === 'QR');
  assert.equal(mealQr.props.value, buildShortShareLink('Meal1234'));
  assert.match(mealQr.props.logoSVG, />MEALS</);
});
test('native QR sharing writes a PNG, shares it as an image, then removes the temporary file', async () => {
  shared.length = 0; exported.length = 0; deleted.length = 0;
  const action = [...nodes(shareSheet())].find(node => node.type === 'Button' && node.props.title === 'Share QR image');
  action.props.onPress();
  await new Promise(setImmediate);
  assert.deepEqual(exported, [['file:///test-cache/gathergo-event-1-meals.png', 'png-base64', { encoding: 'base64' }]]);
  assert.deepEqual(shared, [['file:///test-cache/gathergo-event-1-meals.png', { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Community table · Meal collection' }]]);
  assert.deepEqual(deleted, ['file:///test-cache/gathergo-event-1-meals.png']);
});
const { default: MealCard } = loadTypeScript('components/foodBank/MealPassCard.tsx', {
  'react-native': { Text: 'Text', View: 'View' },
  'react-native-qrcode-svg': { default: 'QR' },
  '@expo/vector-icons': { Ionicons: 'Icon' },
  twrnc: { default: () => ({}) },
});
test('meal collection passes contain the assigned window and no payment or donation label', () => {
  const tree = MealCard({ pass, title: 'Community table', location: 'Hall' });
  const content = [...nodes(tree)].filter(node => node.type === 'Text').map(node => node.props.children).join(' ');
  assert.match(content, /Suggested arrival window/);
  assert.doesNotMatch(content, /free|paid|donat|₦/i);
  assert.equal([...nodes(tree)].find(node => node.type === 'QR').props.value, pass.qrCode);
});

test('regular event sharing shows the cover and offers a combined image and event link action', async () => {
  shareStates.length = 0; coverShares.length = 0;
  const props = { foodBank: false, imageUrl: 'https://images.example.test/cover.png' };
  const tree = shareSheet(props);
  assert.equal([...nodes(tree)].find(node => node.type === 'EventCover').props.imageUrl, props.imageUrl);
  [...nodes(tree)].find(node => node.type === 'Button' && node.props.title === 'Share image + link').props.onPress();
  await new Promise(setImmediate);
  assert.deepEqual(coverShares, [{ imageUrl: props.imageUrl, title: 'Community table · Event page', link: buildShortShareLink('Event123') }]);
});
test('an event without a cover keeps link and QR sharing without an image attachment action', () => {
  shareStates.length = 0;
  const tree = shareSheet({ foodBank: false, imageUrl: null });
  assert.equal([...nodes(tree)].find(node => node.type === 'Button' && node.props.title === 'Share image + link'), undefined);
  assert.ok([...nodes(tree)].find(node => node.type === 'Button' && node.props.title === 'Share link'));
  assert.ok([...nodes(tree)].find(node => node.type === 'Button' && node.props.title === 'Share QR image'));
});
test('preparing an event image prevents opening another native share at the same time', async () => {
  shareStates.length = 0; finishCoverShare = true;
  const props = { foodBank: false, imageUrl: 'https://images.example.test/cover.png' };
  [...nodes(shareSheet(props))].find(node => node.type === 'Button' && node.props.title === 'Share image + link').props.onPress();
  const pending = [...nodes(shareSheet(props))].filter(node => node.type === 'Button');
  assert.equal(pending.find(node => node.props.title === 'Preparing image…').props.disabled, true);
  assert.equal(pending.find(node => node.props.title === 'Share QR image').props.disabled, true);
  finishCoverShare(); finishCoverShare = undefined;
  await new Promise(setImmediate);
  assert.equal([...nodes(shareSheet(props))].find(node => node.type === 'Button' && node.props.title === 'Share image + link').props.disabled, false);
});

test('sharing waits for the actual short code and retries a failed request without presenting a fabricated QR', async () => {
  shareStates.length = 0; shortLinkState = 'pending';
  let tree = shareSheet({ foodBank: false });
  assert.equal([...nodes(tree)].some(node => node.type === 'QR'), false);
  assert.equal([...nodes(tree)].find(node => node.type === 'Button' && node.props.title === 'Share link').props.disabled, true);
  shortLinkState = 'error'; tree = shareSheet({ foodBank: false });
  assert.equal([...nodes(tree)].some(node => node.type === 'QR'), false);
  [...nodes(tree)].find(node => node.type === 'Button' && node.props.title === 'Retry link').props.onPress();
  await new Promise(setImmediate);
  tree = shareSheet({ foodBank: false });
  assert.equal([...nodes(tree)].find(node => node.type === 'QR').props.value, buildShortShareLink('Event123'));
});


test('closing reservations preserves existing pass access and optional support donations', async () => {
  reset(); canReserve = false;
  assert.equal(button('Reservations closed').props.disabled, true);
  button('Support with a donation').props.onPress();
  assert.deepEqual(routes, ['/event/event-1?donate=1&donationSource=FOOD_BANK']);
  assert.deepEqual(claims, []);
  ownedPass = pass;
  await button('View meal pass').props.onPress();
  assert.equal(routes.at(-1), '/transaction/meal-1?type=MEAL&eventId=event-1');
});
