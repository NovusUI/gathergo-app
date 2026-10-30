/* global __dirname */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

// Exercise the screen's real handlers without starting its native chat UI.
const filename = path.resolve(__dirname, '../app/(app)/chat/[id].tsx');
const source = ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const handlers = [];
function visit(node) {
  if (ts.isVariableDeclaration(node) && ['sendMessage', 'retryMessage'].includes(node.name.getText(source))) {
    handlers.push(`const ${ts.createPrinter().printNode(ts.EmitHint.Unspecified, node, source)};`);
  }
  ts.forEachChild(node, visit);
}
visit(source);
assert.equal(handlers.length, 2);
const compiled = new Module(filename, module);
compiled.filename = filename;
compiled.paths = Module._nodeModulePaths(path.dirname(filename));
compiled._compile(ts.transpileModule(`export default function(dependencies) {
  const { carpoolDetails, Alert, user, sendInProgress, setSending, setSendError, uuidv4, carpoolId, addMessage, setValue, AsyncStorage, getDraftKey, updateConversationAfterSend, pendingMessage, socket, requestAnimationFrame, flatListRef, useMessageQueueStore, console } = dependencies;
  ${handlers.join('\n')}
  return { sendMessage, retryMessage };
}`, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const flush = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  const state = { value: 'On my way', error: null, sending: false, sent: [], alerts: [], requests: [], drafts: [] };
  const dependencies = {
    carpoolDetails: { canChat: true }, user: { id: 'ada', username: 'Ada' }, carpoolId: 'ride',
    Alert: { alert: (...args) => state.alerts.push(args) },
    sendInProgress: { current: false }, setSending: value => { state.sending = value; },
    setSendError: error => { state.error = error; }, setValue: value => { state.value = value; },
    uuidv4: () => 'message-key', addMessage: async message => { state.sent.push(message); },
    AsyncStorage: { removeItem: async key => { state.drafts.push(key); } }, getDraftKey: id => `draft:${id}`,
    updateConversationAfterSend() {}, pendingMessage: message => message,
    socket: { emit: (...args) => state.requests.push(args) },
    requestAnimationFrame: fn => fn(), flatListRef: { current: { scrollToOffset() {} } },
    useMessageQueueStore: { getState: () => ({ retryMessage: async () => {} }) }, console: { log() {} },
  };
  // Keep callback substitution inside these closures so tests can inject failures.
  const api = compiled.exports.default({ ...dependencies,
    addMessage: (...args) => dependencies.addMessage(...args),
    updateConversationAfterSend: (...args) => dependencies.updateConversationAfterSend(...args),
  });
  return { state, dependencies, ...api };
}
test('a message saved for delivery clears its draft and never reports failure when the preview throws', async () => {
  const f = fixture();
  f.dependencies.updateConversationAfterSend = () => { throw TypeError('Incomplete conversation row'); };
  await f.sendMessage(f.state.value);
  assert.equal(f.state.sent.length, 1);
  assert.equal(f.state.value, '');
  assert.equal(f.state.error, null);
  assert.deepEqual(f.state.alerts, []);
  assert.deepEqual(f.state.drafts, ['draft:ride']);
  assert.deepEqual(f.state.requests, [['getConversationTray', {}]]);
  assert.equal(f.state.sending, false);
});
test('a local save failure retains the text and draft with inline feedback and no blocking alert', async () => {
  const f = fixture();
  f.dependencies.addMessage = async () => { throw Error('disk full'); };
  await f.sendMessage(f.state.value);
  assert.equal(f.state.sent.length, 0);
  assert.equal(f.state.value, 'On my way');
  assert.match(f.state.error, /Couldn't send/);
  assert.doesNotMatch(f.state.error, /disk|queue|storage/i);
  assert.deepEqual(f.state.alerts, []);
  assert.deepEqual(f.state.drafts, []);
  assert.equal(f.dependencies.sendInProgress.current, false);
  f.dependencies.addMessage = async message => { f.state.sent.push(message); };
  await f.sendMessage(f.state.value);
  assert.equal(f.state.sent.length, 1);
  assert.equal(f.state.value, '');
  assert.equal(f.state.error, null);
});
test('repeated taps while saving create one outgoing message, and vibe checks retain the composer', async () => {
  const f = fixture(); let finish;
  f.dependencies.addMessage = message => new Promise(resolve => { f.state.sent.push(message); finish = resolve; });
  const first = f.sendMessage('Vibe check', { clearComposer: false });
  await f.sendMessage('Vibe check', { clearComposer: false });
  assert.equal(f.state.sent.length, 1);
  finish(); await first;
  assert.equal(f.state.value, 'On my way');
  assert.deepEqual(f.state.drafts, []);
});
test('a retry storage failure uses inline feedback', async () => {
  const f = fixture();
  f.dependencies.useMessageQueueStore.getState = () => ({ retryMessage: async () => { throw Error('disk full'); } });
  f.retryMessage('message-key'); await flush();
  assert.equal(f.state.error, "Couldn't retry. Please try again.");
  assert.deepEqual(f.state.alerts, []);
});

function conversationFixture() {
  delete require.cache[require.resolve('./loadTypeScript.cjs')];
  const load = require('./loadTypeScript.cjs').loadTypeScript;
  const { QueryClient } = require('@tanstack/react-query');
  const cache = new QueryClient();
  const listeners = new Map(), requests = [], effects = [];
  const socket = { connected: true, emit: (...args) => requests.push(args),
    on: (name, fn) => listeners.set(name, fn), off: (name, fn) => { if (listeners.get(name) === fn) listeners.delete(name); } };
  const { ConversationProvider } = load('context/ConversationContext.tsx', {
    '@/hooks/useSocketReactHook': { useConversations: () => ({ data: cache.getQueryData(['conversations']), isPending: false }) },
    '@/types/chat': {}, '@tanstack/react-query': { useQueryClient: () => cache },
    './SocketContext': { useSocket: () => ({ socket }) },
    react: { ...require('react'), useCallback: fn => fn, useEffect: fn => effects.push(fn), useState: value => [value, () => {}] },
  });
  const screen = ConversationProvider({ children: null });
  const cleanup = effects[0]();
  return { cache, requests, listeners, cleanup, preview: screen.props.value.updateConversationAfterSend,
    receive: data => listeners.get('conversationTrayUpdate')(data) };
}
const conversation = (id = 'ride') => ({ carpool: { id, createdAt: '2026-01-01T10:00:00Z' }, event: { title: 'Community day' }, lastMessage: null, lastMessageAt: null, sender: null, unreadCount: 0 });
test('partial updates for unknown conversations request full data without creating an incomplete row', () => {
  const f = conversationFixture();
  try {
    f.cache.setQueryData(['conversations'], []);
    f.receive({ carpoolId: 'ride', lastMessage: { content: 'Hello', createdAt: '2026-10-24T12:00:00Z' }, unreadCount: 1 });
    assert.deepEqual(f.cache.getQueryData(['conversations']), []);
    assert.equal(f.requests.length, 2);
    f.receive([conversation()]);
    f.preview('ride', { content: 'On my way', createdAt: '2026-10-24T12:01:00Z' });
    assert.equal(f.cache.getQueryData(['conversations'])[0].lastMessage, 'On my way');
    f.receive({ carpoolId: 'ride', unreadCount: 0 });
    assert.equal(f.cache.getQueryData(['conversations'])[0].lastMessage, 'On my way');
  } finally { f.cleanup(); f.cache.clear(); }
  assert.equal(f.listeners.size, 0);
});
test('previews recover incomplete persisted rows by requesting the server tray', () => {
  const f = conversationFixture();
  try {
    f.cache.setQueryData(['conversations'], [{ lastMessage: 'Old partial update' }]);
    assert.doesNotThrow(() => f.preview('ride', { content: 'Hello', createdAt: '2026-10-24T12:00:00Z' }));
    assert.deepEqual(f.requests.at(-1), ['getConversationTray', {}]);
    f.receive([conversation()]);
    f.receive({ carpoolId: 'ride', lastMessage: { content: 'Reply', createdAt: '2026-10-24T12:01:00Z' }, unreadCount: 2 });
    const row = f.cache.getQueryData(['conversations'])[0];
    assert.equal(row.carpool.id, 'ride'); assert.equal(row.lastMessage, 'Reply'); assert.equal(row.unreadCount, 2);
    f.listeners.get('connect')(); f.listeners.get('conversationTrayRefresh')();
    assert.equal(f.requests.length, 4);
  } finally { f.cleanup(); f.cache.clear(); }
});
