const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { default: create } = require('twrnc/create');
const { loadTypeScript } = require('./loadTypeScript.cjs');
const { contrast, composite } = require('./colorContrast.cjs');
const { getAppTheme } = loadTypeScript('utils/theme/index.ts', { twrnc: { create: config => create(config, 'ios') } });
let mode = 'light';
const themeHook = { useAppTheme: () => getAppTheme(mode) };
const hooks = { ...React, useEffect() {}, useState: initial => [typeof initial === 'function' ? initial() : initial, () => {}], useRef: initial => ({ current: initial }), useMemo: fn => fn(), useCallback: fn => fn };
const native = Object.fromEntries(['Text', 'View', 'TouchableOpacity', 'Pressable', 'TextInput', 'Modal', 'ScrollView'].map(type => [type, type]));
native.StyleSheet = { create: value => value, absoluteFillObject: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 } };
const common = {
  '@/hooks/useAppTheme': themeHook, react: hooks, 'react-native': native,
  '@expo/vector-icons': { Ionicons: 'Icon', Feather: 'Icon' },
  '@/components/gogo/mascot/GatherGoMascot': { GatherGoMascot: 'Gogo' },
  'lucide-react-native': Object.fromEntries(['UserRound', 'Eye', 'EyeOff', 'Phone', 'Calendar', 'Mail', 'Power', 'Shield', 'Clock', 'Send'].map(icon => [icon, 'Icon'])),
};
const flatten = style => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
function render(node) {
  if (node?.type?.type) return render(React.createElement(node.type.type, node.props));
  if (node?.type?.render) return render(node.type.render(node.props, null));
  if (typeof node?.type === 'function') return render(node.type(node.props));
  if (!node || typeof node !== 'object') return node;
  return { ...node, props: { ...node.props, children: [node.props.children].flat(Infinity).map(render) } };
}
function* nodes(node) {
  if (!node || typeof node !== 'object') return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child);
}
const text = node => [node.props?.children].flat(Infinity).filter(child => typeof child === 'string').join(' ');
function assertLegible(node, background = getAppTheme(mode).colors.background, foreground = getAppTheme(mode).colors.foreground) {
  if (!node || typeof node !== 'object') return;
  const style = flatten(node.props.style);
  const bg = style.backgroundColor ? composite(style.backgroundColor, background) : background;
  const fg = style.color ? composite(style.color, bg) : foreground;
  if ((node.type === 'Text' && text(node).trim()) || node.type === 'TextInput') {
    assert.ok(contrast(fg, bg) >= 4.5, `${text(node) || node.props.value || 'Input'}: ${fg} on ${bg} (${contrast(fg, bg).toFixed(2)})`);
  }
  if (node.type === 'TextInput' && node.props.placeholderTextColor) {
    assert.ok(contrast(node.props.placeholderTextColor, bg) >= 4.5, `Placeholder on ${bg}`);
  }
  for (const child of [node.props.children].flat(Infinity)) assertLegible(child, bg, fg);
}
const { CARPOOL_VEHICLE_OPTIONS, getCarpoolVibeMascotStyle, getCarpoolVibeSafetySignal } = loadTypeScript('constants/carpool.ts');
const { default: RideCard } = loadTypeScript('components/carpool/RideVibeChatCard.tsx', common);
const { default: VibeModal } = loadTypeScript('components/carpool/VibeCheckModal.tsx', common);
test('every ride style keeps Gogo text and highlighted safety signals readable in light mode', () => {
  mode = 'light';
  for (const vehicle of CARPOOL_VEHICLE_OPTIONS) {
    const props = { dialogKey: vehicle.key, dialogMessages: [[{text: 'Meet the rider at '}, {text: 'the pickup point', highlight: true}]], iconName: vehicle.icon, label: vehicle.label, roleLabel: 'Pooler', mascotStyle: getCarpoolVibeMascotStyle(vehicle.key), safetySignal: getCarpoolVibeSafetySignal(vehicle.key), onToggle() {}, onOpenVibeCheck() {} };
    for (const expanded of [false, true]) assertLegible(render(React.createElement(RideCard, {...props, expanded})));
    assertLegible(render(React.createElement(VibeModal, {...props, rideLabel: vehicle.label, visible: true, onClose() {}})));
  }
});
const requests = [];
const { default: RequestCard } = loadTypeScript('components/carpool/RequestCard.tsx', {
  ...common, 'expo-image': { Image: 'Image' },
  '@tanstack/react-query': { useQueryClient: () => ({ invalidateQueries() {} }) },
  '@/utils/globalErrorHandler': { showGlobalError() {}, showGlobalSuccess() {} },
  '@/services/mutations': {
    useCarpoolRequestRes: () => ({ mutateAsync: status => requests.push(status), isPending: false }),
    useRemovePassenger: () => ({ mutateAsync: () => requests.push('remove'), isPending: false }),
  },
});
test('pending and approved carpool requests have readable cards and retain their response actions', () => {
  mode = 'light'; requests.length = 0;
  for (const status of ['PENDING', 'ACCEPTED']) {
    const card = render(React.createElement(RequestCard, { status, name: 'Ada Example', message: 'Library gate', note: 'I will be near the entrance.', requestId: 'request-1', carpoolId: 'carpool-1' }));
    assertLegible(card);
    for (const button of [...nodes(card)].filter(node => node.type === 'TouchableOpacity')) button.props.onPress();
  }
  assert.deepEqual(requests, ['ACCEPTED', 'DECLINED', 'remove']);
});
const { default: PermissionCard } = loadTypeScript('components/scanner/PermissionCard.tsx', common);
const { default: PermissionBadge } = loadTypeScript('components/scanner/PermissionBadge.tsx', common);
test('permission names and every permission status have readable light-mode colors without changing owner actions', () => {
  mode = 'light'; let toggles = 0, revokes = 0;
  for (const [isActive, days] of [[true, null], [false, null], [true, 3], [true, -1]]) {
    const expiresAt = days === null ? undefined : new Date(Date.now() + days * 86400000).toISOString();
    const permission = { id: 'permission-1', scannerName: 'Ada Example', scannerEmail: 'ada@example.com', eventName: 'Tree planting', createdAt: new Date().toISOString(), isActive, expiresAt };
    const card = render(React.createElement(PermissionCard, {permission, isEventOwner: true, onToggleActive: () => toggles++, onRevoke: () => revokes++}));
    assertLegible(card);
    for (const button of [...nodes(card)].filter(node => node.type === 'TouchableOpacity')) button.props.onPress();
    assertLegible(render(React.createElement(PermissionBadge, {eventName: permission.eventName, expiresAt})));
  }
  assert.equal(toggles, 4); assert.equal(revokes, 4);
});
const { default: Incoming } = loadTypeScript('components/ui/ChatView1.tsx', common);
const { default: DeliveryStatus } = loadTypeScript('components/ui/MessageDeliveryStatus.tsx', common);
const { default: Outgoing } = loadTypeScript('components/ui/UserChatView.tsx', { ...common, './MessageDeliveryStatus': { default: DeliveryStatus } });
test('chat uses distinct incoming and outgoing bubbles with readable messages and timestamps', () => {
  mode = 'light'; const theme = getAppTheme(mode);
  for (const Component of [Incoming, Outgoing]) assertLegible(render(React.createElement(Component, {message: 'Meet at the gate', time: '10:30'})), theme.colors.chatBackground);
  assert.notEqual(theme.colors.chatIncoming, theme.colors.chatOutgoing);
  assert.notEqual(theme.colors.chatBackground, theme.colors.background);
  mode = 'dark';
  assert.equal(flatten(render(React.createElement(Outgoing, {message: 'Ready', time: '10:30'})).props.style).backgroundColor, '#350342');
  const received = [...nodes(render(React.createElement(Incoming, {message: 'Ready', time: '10:30'})))].find(node => flatten(node.props.style).backgroundColor === '#07143B');
  assert.ok(received);
  mode = 'light';
});
const inputs = {
  '@/components/ui/AppLoader': { default: 'Loader' },
  '@/context/SocketContext': { useSocket: () => ({socket: null}) },
  '@gorhom/bottom-sheet': { BottomSheetTextInput: 'TextInput' },
  '@react-native-picker/picker': { Picker: 'Picker' },
  'react-native-dropdown-picker': { default: 'Dropdown' },
};
const fields = ['CustomInput1', 'CustomTextArea', 'PhoneNumberInput', 'FourDigitInput', 'DatePicker', 'CustomDropDown', 'ChatInput'].map(name => [name, loadTypeScript(`components/inputs/${name}.tsx`, {...common, ...inputs}).default]);
test('shared inputs expose a visible boundary plus readable values and placeholders in light mode', () => {
  mode = 'light';
  for (const [name, Component] of fields) {
    const field = render(React.createElement(Component, { value: 'Ada', placeholder: 'Your name', onChange() {}, onChangeText() {}, options: [{label: 'Nigeria', value: 'NG'}], selectedValue: 'NG', onValueChange() {}, setValue() {}, onSend() {}, carpoolId: 'carpool-1', sending: false, disabled: false }));
    assertLegible(field);
    const border = [...nodes(field)].find(node => flatten(node.props.style).borderWidth >= 1);
    assert.ok(border, `${name} has a border`);
    const style = flatten(border.props.style);
    assert.ok(contrast(style.borderColor, style.backgroundColor || getAppTheme(mode).colors.surface) >= 3, `${name} boundary is visible`);
    if (name === 'CustomDropDown') {
      assert.equal([...nodes(field)].find(node => node.type === 'Dropdown').props.dropDownContainerStyle.backgroundColor, '#FFFFFF');
    }
  }
});
const { default: Backdrop } = loadTypeScript('components/ui/ChatBackdrop.tsx', {
  ...common, 'react-native-svg': { default: 'Svg', Defs: 'Defs', G: 'G', Path: 'Path', Pattern: 'Pattern', Rect: 'Rect' },
});
test('the tiled chat pattern follows the app theme and cannot intercept touches or screen-reader focus', () => {
  for (const selectedMode of ['light', 'dark']) {
    mode = selectedMode; const backdrop = render(React.createElement(Backdrop));
    assert.equal(backdrop.props.pointerEvents, 'none');
    assert.equal(backdrop.props.accessibilityElementsHidden, true);
    assert.equal(flatten(backdrop.props.style).backgroundColor, getAppTheme(mode).colors.chatBackground);
    assert.equal([...nodes(backdrop)].find(node => node.type === 'Pattern').props.patternUnits, 'userSpaceOnUse');
    assert.ok([...nodes(backdrop)].some(node => node.type === 'Path'));
  }
  mode = 'light';
});
