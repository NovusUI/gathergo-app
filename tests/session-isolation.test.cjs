const assert = require('node:assert/strict');
const { test, beforeEach, afterEach } = require('node:test');
const { Buffer } = require('node:buffer');
const axios = require('axios');
const { dehydrate } = require('@tanstack/react-query');
const { persistQueryClientRestore, persistQueryClientSave } = require('@tanstack/react-query-persist-client');
const { loadTypeScript } = require('./loadTypeScript.cjs');
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const flush = () => new Promise(resolve => setImmediate(resolve));
const disk = new Map(), secure = new Map();
let readGate = null, writeGate = null;
const storage = {
  getItem: async key => readGate?.key === key ? readGate.promise : disk.get(key) ?? null,
  setItem: async (key, value) => { if (writeGate?.key === key) await writeGate.promise; disk.set(key, value); },
  removeItem: async key => { disk.delete(key); },
  multiRemove: async keys => keys.forEach(key => disk.delete(key)),
};
const secureStorage = {
  getItem: async key => secure.get(key) ?? null,
  saveItem: async (key, value) => { secure.set(key, value); },
  removeItem: async key => { secure.delete(key); },
};
const caches = loadTypeScript('services/sessionQueryCache.ts', {
  '@react-native-async-storage/async-storage': { default: storage },
});
const { useAuthStore: store } = loadTypeScript('store/auth.ts', {
  '@react-native-async-storage/async-storage': { default: storage },
  '@/services/sessionQueryCache': caches,
  '@/utils/storage': secureStorage,
});
const auth = { useAuthStore: store };
const network = { REFRESH_TOKEN_URL: 'https://example.test/auth/refresh', API_BASE_URL: 'https://example.test' };
const session = loadTypeScript('services/refreshSession.ts', { '@/store/auth': auth, '@/constants/network': network });
const { default: client } = loadTypeScript('api/client.ts', { '../store/auth': auth, '@/services/refreshSession': session });
const { uploadClient } = loadTypeScript('api/uploadClient.ts', { '../store/auth': auth, '@/constants/network': network, '@/services/refreshSession': session });
const originalPost = axios.post, originalFetch = global.fetch;
let owned = [], unregister = [];
const cache = id => { const value = caches.createSessionQueryCache(id); owned.push(value); return value; };
const activate = value => { unregister.push(caches.registerSessionQueryCache(value)); };
const jwt = id => 'header.' + Buffer.from(JSON.stringify({ sub: id })).toString('base64url') + '.signature';
const save = value => persistQueryClientSave({ queryClient: value.queryClient, persister: value.persister });
const restore = value => persistQueryClientRestore({ queryClient: value.queryClient, persister: value.persister });
const ok = (config, data) => ({ data, status: 200, statusText: 'OK', headers: {}, config });
const unauthorized = config => new axios.AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, { ...ok(config, {}), status: 401 });
beforeEach(async () => {
  disk.clear(); secure.clear(); readGate = writeGate = null;
  store.setState({ token: null, refreshToken: null, isAuthenticated: false, hasHydrated: true, sessionVersion: 0, googleAuthPhase: 'idle' });
});
afterEach(async () => {
  readGate?.resolve(null); writeGate?.resolve();
  unregister.forEach(stop => stop()); unregister = [];
  await Promise.all(owned.map(value => value.clear())); owned = [];
  axios.post = originalPost; global.fetch = originalFetch;
});

test('identical ticket and wallet query keys are isolated by account, including after restoring disk cache', async () => {
  const first = cache('a');
  for (const key of ['myTickets', 'myRegistrations', 'walletOverview', 'notifications']) first.queryClient.setQueryData([key], [{ id: key + '-a' }]);
  await save(first);
  const second = cache('b'); await restore(second);
  for (const key of ['myTickets', 'myRegistrations', 'walletOverview', 'notifications']) assert.equal(second.queryClient.getQueryData([key]), undefined);
  const sameAccount = cache('a'); await restore(sameAccount);
  assert.deepEqual(sameAccount.queryClient.getQueryData(['myTickets']), [{ id: 'myTickets-a' }]);
});

test('logout removes memory, persisted queries, legacy tokens and profile while preserving device preferences', async () => {
  await store.getState().login(jwt('a'), 'refresh-a');
  const first = cache('a'); activate(first);
  first.queryClient.setQueryData(['myTickets'], [{ id: 'ticket-a' }]); await save(first);
  disk.set('REACT_QUERY_OFFLINE_CACHE', 'old-unscoped-cache'); disk.set('appearance', 'dark');
  secure.set('token', 'legacy-token'); secure.set('user', JSON.stringify({ id: 'a' }));
  await store.getState().logout();
  assert.equal(store.getState().isAuthenticated, false);
  assert.equal(store.getState().token, null);
  assert.equal(first.queryClient.getQueryCache().getAll().length, 0);
  for (const key of ['gathergo-query:a', 'REACT_QUERY_OFFLINE_CACHE', 'access_token', 'refresh_token']) assert.equal(disk.has(key), false);
  assert.equal(secure.has('token'), false); assert.equal(secure.has('user'), false);
  assert.equal(disk.get('appearance'), 'dark');
});

test('an old disk restore and an old request cannot populate the new account cache after logout', async () => {
  const first = cache('a'); first.queryClient.setQueryData(['myTickets'], [{ id: 'ticket-a' }]); await save(first);
  const serialized = disk.get('gathergo-query:a');
  const oldRestore = cache('a'); readGate = { key: 'gathergo-query:a', ...deferred() };
  const restoring = restore(oldRestore); await flush(); await oldRestore.clear();
  readGate.resolve(serialized); await restoring;
  assert.equal(oldRestore.queryClient.getQueryData(['myTickets']), undefined);
  const request = deferred();
  const inFlight = first.queryClient.fetchQuery({ queryKey: ['myTickets'], queryFn: () => request.promise, staleTime: 0 }).catch(error => error);
  await first.clear(); const second = cache('b');
  second.queryClient.setQueryData(['myTickets'], [{ id: 'ticket-b' }]);
  request.resolve([{ id: 'late-ticket-a' }]); await inFlight;
  first.queryClient.setQueryData(['notifications'], [{ id: 'late-socket-event-a' }]);
  assert.deepEqual(second.queryClient.getQueryData(['myTickets']), [{ id: 'ticket-b' }]);
  assert.equal(second.queryClient.getQueryData(['notifications']), undefined);
});

test('a queued persistence write cannot recreate a logged-out account cache', async () => {
  const first = cache('a'); first.queryClient.setQueryData(['myTickets'], [{ id: 'ticket-a' }]); await save(first);
  first.queryClient.setQueryData(['myTickets'], [{ id: 'another-ticket-a' }]);
  const trailing = save(first); await first.clear();
  await new Promise(resolve => setTimeout(resolve, 1100)); await trailing;
  assert.equal(disk.has('gathergo-query:a'), false);
});

test('logout waits for an already-started storage write before deleting that account cache', async () => {
  const first = cache('a'); first.queryClient.setQueryData(['myTickets'], [{ id: 'ticket-a' }]);
  writeGate = { key: 'gathergo-query:a', ...deferred() };
  const saving = save(first); await flush();
  const clearing = first.clear(); writeGate.resolve(); await Promise.all([saving, clearing]);
  assert.equal(disk.has('gathergo-query:a'), false);
});

test('fresh sign-ins, including re-login to the same account, get a new session lifetime', async () => {
  await store.getState().login(jwt('a'), 'refresh-a'); const firstVersion = store.getState().sessionVersion;
  const first = cache('a'); activate(first); first.queryClient.setQueryData(['myTickets'], [{ id: 'ticket-a' }]);
  await store.getState().login(jwt('a'), 'new-refresh-a');
  assert.ok(store.getState().sessionVersion > firstVersion);
  assert.equal(first.queryClient.getQueryCache().getAll().length, 0);
});

test('a late successful response and a late 401 from A are both rejected without changing B', async () => {
  let refreshCalls = 0; axios.post = async () => { refreshCalls++; throw new Error('No refresh expected'); };
  for (const status of [200, 401]) {
    await store.getState().login(jwt('a'), 'refresh-a');
    const gate = deferred(); client.defaults.adapter = async config => { await gate.promise; if (status === 401) throw unauthorized(config); return ok(config, [{ id: 'ticket-a' }]); };
    const pending = client.get('/tickets/my-tickets').catch(error => error);
    await flush(); await store.getState().logout(); await store.getState().login(jwt('b'), 'refresh-b');
    gate.resolve(); assert.ok(axios.isCancel(await pending));
    assert.equal(store.getState().token, jwt('b')); assert.equal(store.getState().isAuthenticated, true);
  }
  assert.equal(refreshCalls, 0);
});

test('concurrent 401s refresh once and keep the current account cache intact', async () => {
  await store.getState().login(jwt('a'), 'refresh-a'); const version = store.getState().sessionVersion;
  const first = cache('a'); activate(first); first.queryClient.setQueryData(['myTickets'], [{ id: 'ticket-a' }]);
  const gate = deferred(); let calls = 0; const renewed = jwt('a') + '-renewed';
  axios.post = async () => { calls++; return gate.promise; };
  client.defaults.adapter = async config => { if (config.headers.Authorization !== `Bearer ${renewed}`) throw unauthorized(config); return ok(config, [{ id: 'ticket-a' }]); };
  const requests = [client.get('/tickets/my-tickets'), client.get('/tickets/my-tickets')]; await flush();
  assert.equal(calls, 1); gate.resolve({ data: { data: { accessToken: renewed } } }); await Promise.all(requests);
  assert.equal(store.getState().sessionVersion, version);
  assert.deepEqual(first.queryClient.getQueryData(['myTickets']), [{ id: 'ticket-a' }]);
});

for (const outcome of ['success', 'failure']) test(`A's late refresh ${outcome} cannot revive A or log B out`, async () => {
  await store.getState().login(jwt('a'), 'refresh-a'); const oldVersion = store.getState().sessionVersion;
  const old = deferred(), current = deferred(); let calls = 0;
  axios.post = async () => { calls++; return calls === 1 ? old.promise : current.promise; };
  const oldRequest = session.refreshSession(oldVersion).catch(error => error);
  await store.getState().logout(); await store.getState().login(jwt('b'), 'refresh-b'); const version = store.getState().sessionVersion;
  const currentRequest = session.refreshSession(version);
  if (outcome === 'success') old.resolve({ data: { data: { accessToken: jwt('a') } } }); else old.reject(new Error('Expired old refresh token'));
  await oldRequest; assert.equal(store.getState().token, jwt('b')); assert.equal(store.getState().isAuthenticated, true);
  assert.equal(session.refreshSession(version), currentRequest); assert.equal(calls, 2);
  current.resolve({ data: { data: { accessToken: jwt('b') } } }); await currentRequest;
});

test('a failed refresh for the current account performs the full logout cleanup', async () => {
  await store.getState().login(jwt('a'), 'refresh-a'); const first = cache('a'); activate(first);
  first.queryClient.setQueryData(['myTickets'], [{ id: 'ticket-a' }]); await save(first); secure.set('user', JSON.stringify({ id: 'a' }));
  axios.post = async () => { throw new Error('Expired refresh token'); };
  await assert.rejects(session.refreshSession(store.getState().sessionVersion), /Expired refresh token/);
  assert.equal(store.getState().isAuthenticated, false); assert.equal(first.queryClient.getQueryCache().getAll().length, 0);
  assert.equal(disk.has('gathergo-query:a'), false); assert.equal(secure.has('user'), false);
});

test('uploads from a previous sign-in cannot refresh or publish a successful result under the new account', async () => {
  for (const status of [200, 401]) {
    await store.getState().login(jwt('a'), 'refresh-a'); const gate = deferred(); global.fetch = async () => gate.promise;
    const pending = uploadClient.upload('/upload', new FormData()).catch(error => error);
    await store.getState().logout(); await store.getState().login(jwt('b'), 'refresh-b');
    gate.resolve(new Response(JSON.stringify({ id: 'upload-a' }), { status, headers: { 'content-type': 'application/json' } }));
    assert.ok(axios.isCancel(await pending)); assert.equal(store.getState().token, jwt('b'));
  }
});

test('the signed-out query client does not persist private data', async () => {
  const signedOut = cache(null); signedOut.queryClient.setQueryData(['myTickets'], [{ id: 'ticket-a' }]); await save(signedOut);
  assert.equal(disk.has('gathergo-query:null'), false);
});

test('an unowned legacy global cache is never restored into an authenticated account', async () => {
  const old = cache('old'); old.queryClient.setQueryData(['myTickets'], [{ id: 'another-account-ticket' }]);
  disk.set('REACT_QUERY_OFFLINE_CACHE', JSON.stringify({ timestamp: Date.now(), buster: '', clientState: dehydrate(old.queryClient) }));
  const current = cache('current'); await restore(current);
  assert.equal(current.queryClient.getQueryData(['myTickets']), undefined);
});

const React = require('react');
let profileStates, profileIndex, profileEffects, profileRead;
const { AuthProvider } = loadTypeScript('context/AuthContext.tsx', {
  '@/store/auth': { useAuthStore: Object.assign(() => store.getState(), { getState: store.getState }) },
  '../utils/storage': { ...secureStorage, getItem: () => profileRead.promise },
  react: {
    ...React,
    useState: initial => { const index = profileIndex++; if (!(index in profileStates)) profileStates[index] = initial; return [profileStates[index], value => { profileStates[index] = typeof value === 'function' ? value(profileStates[index]) : value; }]; },
    useEffect: effect => { profileEffects.push(effect); },
  },
});
const renderProfile = () => { profileIndex = 0; profileEffects = []; return AuthProvider({ children: 'screen' }); };
test('cached profile A stays hidden under B, and a delayed read cannot overwrite the fresh B profile', async () => {
  await store.getState().login(jwt('b'), 'refresh-b');
  const a = { id: 'a', email: 'a@example.test', hasPreferences: true };
  const b = { id: 'b', email: 'b@example.test', hasPreferences: true };
  profileStates = [a, false]; profileRead = deferred();
  const view = renderProfile(); assert.equal(view.props.value.user, null);
  const stop = profileEffects[0](); profileEffects[1]();
  view.props.value.setUser(b); profileRead.resolve(JSON.stringify(a)); await flush();
  assert.equal(renderProfile().props.value.user.id, 'b'); stop();
});
test('a profile read started before logout cannot repopulate the signed-out context', async () => {
  await store.getState().login(jwt('a'), 'refresh-a');
  const a = { id: 'a', email: 'a@example.test', hasPreferences: true };
  profileStates = [null, false]; profileRead = deferred(); renderProfile(); const stop = profileEffects[0]();
  await store.getState().logout(); stop(); renderProfile(); profileEffects[0]();
  profileRead.resolve(JSON.stringify(a)); await flush();
  assert.equal(renderProfile().props.value.user, null);
});

test('a new login waits for the previous account logout to finish clearing durable cache', async () => {
  await store.getState().login(jwt('a'), 'refresh-a');
  const first = cache('a'); activate(first); first.queryClient.setQueryData(['myTickets'], [{ id: 'ticket-a' }]);
  writeGate = { key: 'gathergo-query:a', ...deferred() };
  const saving = save(first); await flush();
  const signingOut = store.getState().logout(); activate(cache(null));
  const signingIn = store.getState().login(jwt('b'), 'refresh-b'); await flush();
  assert.equal(store.getState().isAuthenticated, false);
  writeGate.resolve(); await Promise.all([saving, signingOut, signingIn]);
  assert.equal(store.getState().token, jwt('b'));
  assert.equal(disk.has('gathergo-query:a'), false);
});

test('a logout callback captured by the previous account cannot log out the current account', async () => {
  await store.getState().login(jwt('a'), 'refresh-a');
  profileStates = [{ id: 'a', email: 'a@example.test', hasPreferences: true }, false];
  profileRead = deferred(); const oldLogout = renderProfile().props.value.logout;
  await store.getState().logout(); await store.getState().login(jwt('b'), 'refresh-b');
  await oldLogout();
  assert.equal(store.getState().token, jwt('b'));
  assert.equal(store.getState().isAuthenticated, true);
});

test('an old retried request is rejected before it can be dispatched with the new token', async () => {
  await store.getState().login(jwt('a'), 'refresh-a'); const version = store.getState().sessionVersion;
  await store.getState().logout(); await store.getState().login(jwt('b'), 'refresh-b');
  let calls = 0; client.defaults.adapter = async config => { calls++; return ok(config, []); };
  await assert.rejects(client.get('/tickets/my-tickets', { _retry: true, _authSessionVersion: version }), axios.isCancel);
  assert.equal(calls, 0);
});

test('a signed-out profile stays hidden even if an old token remains in cached state', async () => {
  store.setState({ token: jwt('a'), isAuthenticated: false });
  profileStates = [{ id: 'a', email: 'a@example.test', hasPreferences: true }, false];
  profileRead = deferred();
  assert.equal(renderProfile().props.value.user, null);
});

const { renderToString } = require('react-dom/server');
const { useQueryClient } = require('@tanstack/react-query');
const portalReads = [], screenReads = [];
const PassThrough = ({ children }) => React.createElement(React.Fragment, null, children);
const PortalReader = () => { const client = useQueryClient(); portalReads.push(client); return null; };
const { default: SessionProvider } = loadTypeScript('context/SessionProvider.tsx', {
  '@/components/ui/AppToast': { default: () => null },
  '@/services/sessionQueryCache': { ...caches, createSessionQueryCache: id => { const value = cache(id); value.queryClient.setQueryData(['myTickets'], [{ owner: id }]); return value; } },
  '@/store/auth': { useAuthStore: () => store.getState() },
  '@gorhom/bottom-sheet': { BottomSheetModalProvider: ({ children }) => React.createElement(React.Fragment, null, children, React.createElement(PortalReader)) },
  'react-native-paystack-webview': { PaystackProvider: PassThrough },
  './ConversationContext': { ConversationProvider: PassThrough },
  './NotificationContext': { NotificationProvider: PassThrough },
  './PushNotificationContext': { PushNotificationProvider: PassThrough },
  './SocketContext': { SocketProvider: PassThrough },
});
const ScreenReader = () => { screenReads.push(useQueryClient()); return React.createElement('span', null, 'screen'); };
test('screens and bottom-sheet portals receive the same account client, with separate clients for different accounts', async () => {
  portalReads.length = screenReads.length = 0;
  for (const id of ['a', 'b']) {
    await store.getState().login(jwt(id), `refresh-${id}`);
    renderToString(React.createElement(SessionProvider, null, React.createElement(ScreenReader)));
  }
  assert.equal(portalReads.length, 2);
  assert.equal(screenReads.length, 2);
  assert.equal(portalReads[0], screenReads[0]);
  assert.equal(portalReads[1], screenReads[1]);
  assert.notEqual(portalReads[0], portalReads[1]);
  assert.deepEqual(portalReads[1].getQueryData(['myTickets']), [{ owner: 'b' }]);
});
