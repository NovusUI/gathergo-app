const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { QueryClient } = require('@tanstack/react-query');
const freshLoader = () => {
  delete require.cache[require.resolve('./loadTypeScript.cjs')];
  return require('./loadTypeScript.cjs').loadTypeScript;
};
const notification = (id, overrides = {}) => ({ id, type: 'event_reminder', title: 'Event update', message: 'Your event starts soon.', createdAt: new Date().toISOString(), read: false, recipientId: 'user-1', ...overrides });
function* nodes(node) {
  if (!node || typeof node !== 'object') return;
  yield node;
  for (const child of [node.props?.children].flat(Infinity)) yield* nodes(child);
}
function fixture(connected = true) {
  const load = freshLoader(), cache = new QueryClient(), listeners = new Map(), requests = [], effects = [];
  let focus;
  const socket = { connected, on: (event, fn) => listeners.set(event, fn), off: (event, fn) => { if (listeners.get(event) === fn) listeners.delete(event); }, emit: (...args) => requests.push(args) };
  const tw = () => ({});
  const hooks = { ...React, useState: initial => [initial, () => {}], useCallback: fn => fn, useMemo: fn => fn(), useEffect: fn => effects.push(fn) };
  const socketHook = { useSocket: () => ({ socket, isConnected: socket.connected }) };
  const { NotificationProvider } = load('context/NotificationContext.tsx', {
    '@/context/SocketContext': socketHook, '@tanstack/react-query': { useQueryClient: () => cache }, react: hooks,
  });
  cache.setQueryData(['notifications', 'list'], { pages: [[notification('first')], [notification('older')]], pageParams: [{ before: null, beforeId: null }, { before: 'older-date', beforeId: 'older' }] });
  cache.setQueryData(['notifications', 'unreadCount'], 2);
  const api = NotificationProvider({ children: null }).props.value;
  const cleanup = effects[0]();
  const tabs = load('hooks/useNotificationTabs.ts', { react: hooks });
  const { default: Screen } = load('app/(app)/(tabs)/notifications.tsx', {
    '@/hooks/useAppTheme': { useAppTheme: () => ({ tw, color: value => value }) },
    '@/components/ui/AppLoader': { default: 'Loader' },
    '@/components/ui/GogoRefreshScrollView': { default: 'Refresh', RefreshIndicator: 'RefreshIndicator' },
    '@/components/CustomeTopBarNav': { default: 'Header' },
    '@/components/ui/ImpactPageLoader': { default: 'PageLoader' },
    '@/components/ui/NotificationItem': { NotificationItem: 'NotificationItem' },
    '@/context/NotificationContext': { useNotification: () => api }, '@/context/SocketContext': socketHook,
    '@/hooks/useNotifications': { useNotifications: () => ({ notifications: cache.getQueryData(['notifications', 'list']).pages.flat(), unreadCount: cache.getQueryData(['notifications', 'unreadCount']), loadMore() {}, refresh() {}, hasMore: false, loadingInitial: false, isLoadingMore: false }) },
    '@/hooks/useNotificationTabs': tabs,
    '@/utils/notificationLinks': { normalizeNotificationLink: value => value },
    '@/utils/navigation': { useLockedRouter: () => ({ push() {}, replace() {} }) },
    'expo-router': { useFocusEffect: fn => { focus = fn; } }, react: hooks,
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Button', SectionList: 'List', StyleSheet: { create: value => value } },
  });
  return { cache, socket, requests, render: () => Screen(), focus: () => focus(), emit: (event, data) => listeners.get(event)(data), cleanup: () => { cleanup(); cache.clear(); } };
}
test('opening Notifications clears the shared count after server confirmation and keeps read history visible', () => {
  const f = fixture();
  try {
    f.render(); f.focus();
    assert.deepEqual(f.requests, [['markAllAsRead']]);
    assert.equal(f.cache.getQueryData(['notifications', 'unreadCount']), 2, 'a request alone does not claim success');
    f.emit('allNotificationsRead');
    assert.equal(f.cache.getQueryData(['notifications', 'unreadCount']), 0);
    assert.equal(f.cache.getQueryData(['notifications', 'list']).pages.flat().every(item => item.read), true);
    const list = [...nodes(f.render())].find(node => node.type === 'List');
    assert.equal(list.props.sections.flatMap(section => section.data).length, 2);
    const tabs = [...nodes(f.render())].filter(node => node.type === 'Button');
    assert.deepEqual(tabs.map(tab => tab.props.children.props.children), ['All', 'Events', 'Carpool']);
    assert.deepEqual(f.cache.getQueryData(['notifications', 'list']).pageParams, [{ before: null, beforeId: null }, { before: 'older-date', beforeId: 'older' }]);
  } finally { f.cleanup(); }
});
test('new arrivals after opening still increase the count and a later focus clears them', () => {
  const f = fixture();
  try {
    f.render(); f.focus(); f.emit('allNotificationsRead');
    const data = notification('new');
    f.emit('newNotification', { data, notificationType: data.type });
    f.render();
    assert.equal(f.cache.getQueryData(['notifications', 'unreadCount']), 1);
    assert.equal(f.cache.getQueryData(['notifications', 'list']).pages[0][0].read, false);
    assert.equal(f.requests.length, 1, 'arrivals do not automatically mark themselves read');
    f.focus(); assert.equal(f.requests.length, 2);
    f.emit('allNotificationsRead');
    assert.equal(f.cache.getQueryData(['notifications', 'unreadCount']), 0);
  } finally { f.cleanup(); }
});
test('opening offline keeps the count until a connected focus can clear it', () => {
  const f = fixture(false);
  try {
    f.render(); f.focus(); assert.deepEqual(f.requests, []);
    assert.equal(f.cache.getQueryData(['notifications', 'unreadCount']), 2);
    f.socket.connected = true; f.render(); f.focus();
    assert.deepEqual(f.requests, [['markAllAsRead']]);
    f.emit('allNotificationsRead');
    assert.equal(f.cache.getQueryData(['notifications', 'unreadCount']), 0);
  } finally { f.cleanup(); }
});
test('a tray response updates read flags even when IDs, titles and timestamps are unchanged', () => {
  const f = fixture();
  try {
    const item = notification('same');
    f.cache.setQueryData(['notifications', 'list'], { pages: [[item]], pageParams: [{ before: null, beforeId: null }] });
    f.emit('notificationTray', { notifications: [{ ...item, read: true }], totalUnread: 0, hasMore: false });
    assert.equal(f.cache.getQueryData(['notifications', 'list']).pages[0][0].read, true);
    assert.equal(f.cache.getQueryData(['notifications', 'unreadCount']), 0);
  } finally { f.cleanup(); }
});
test('All is the default while Events and Carpool retain their filters', () => {
  const load = freshLoader(); let active;
  const { useNotificationTabs: tabsFor } = load('hooks/useNotificationTabs.ts', { react: { useMemo: fn => fn(), useState: initial => [active ?? initial, next => { active = next; }] } });
  const items = [notification('read-event', { read: true }), notification('unread-event'), notification('ride', { type: 'carpool_request' })];
  const initial = tabsFor(items);
  assert.equal(initial.activeTab, 'all'); assert.equal(initial.filteredNotifications.length, 3);
  for (const [tab, expected] of [['events', ['read-event', 'unread-event']], ['carpool', ['ride']], ['all', ['read-event', 'unread-event', 'ride']]]) {
    initial.setActiveTab(tab);
    assert.deepEqual(tabsFor(items).filteredNotifications.map(item => item.id), expected);
  }
});
