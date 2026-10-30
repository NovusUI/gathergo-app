/* global __dirname */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

// Exercise the screen's real message renderer without mounting native chat hooks.
const filename = path.resolve(__dirname, '../app/(app)/chat/[id].tsx');
const source = ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let renderer;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'renderMessage') renderer = node.initializer;
  ts.forEachChild(node, visit);
}
visit(source);
assert.ok(renderer);
const compiled = new Module(filename, module);
compiled.filename = filename;
compiled.paths = Module._nodeModulePaths(path.dirname(filename));
compiled._compile(ts.transpileModule(`export default function(dependencies) {
  const { user, getVibeCheckMessageDetails, carpoolDetails, vibeCheckHandshake, vibeCheckRole, rideIconName, retryMessage, vibeCheckPrompt, getSenderAvatar, ChatView1, UserChatView, VibeCheckMessageCard } = dependencies;
  return (${ts.createPrinter().printNode(ts.EmitHint.Unspecified, renderer, source)});
}`, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText, filename);

const message = (senderId, username, content = 'Meet at the gate') => ({
  id: 'message-1', tempId: null, carpoolId: 'ride', senderId,
  sender: { id: senderId, username }, content,
  createdAt: '2026-10-25T10:30:00.000Z', readBy: [],
});
const render = compiled.exports.default({
  user: { id: 'self' }, carpoolDetails: { driverId: 'self' },
  getVibeCheckMessageDetails: content => content === 'ride check'
    ? { passengerId: 'rider', actorLabel: 'Rider', signalAction: 'ready to go', signalTitle: 'Ready check' }
    : null,
  vibeCheckHandshake: { getPassengerHandshake: () => ({ poolerConfirmed: false, riderConfirmed: true, isComplete: false }) },
  vibeCheckRole: 'pooler', rideIconName: 'car-outline', retryMessage() {},
  vibeCheckPrompt: { open() {} }, getSenderAvatar: id => `https://example.com/${id}.jpg`,
  ChatView1: 'Incoming', UserChatView: 'Outgoing', VibeCheckMessageCard: 'RideCheck',
});

test('incoming messages carry each actual sender’s username with their content and avatar', () => {
  for (const username of ['ada', 'motun']) {
    const bubble = render({ item: message(username, username) });
    assert.equal(bubble.type, 'Incoming');
    assert.equal(bubble.props.senderLabel, `@${username}`);
    assert.equal(bubble.props.message, 'Meet at the gate');
    assert.equal(bubble.props.imageUrl, `https://example.com/${username}.jpg`);
    assert.ok(bubble.props.time);
  }
  const own = render({ item: message('self', 'myname') });
  assert.equal(own.type, 'Outgoing');
  assert.equal(own.props.message, 'Meet at the gate');
});

test('ride check messages identify the sender without changing role or confirmation actions', () => {
  const incoming = render({ item: message('rider', 'ada', 'ride check') });
  assert.equal(incoming.type, 'RideCheck');
  assert.equal(incoming.props.actorLabel, '@ada · Rider');
  assert.equal(incoming.props.needsConfirmation, true);
  assert.equal(incoming.props.signalAction, 'ready to go');
  const own = render({ item: message('self', 'myname', 'ride check') });
  assert.equal(own.props.actorLabel, 'You · Rider');
  assert.equal(own.props.needsConfirmation, false);
});

test('the nullable username is displayed as Ride member in bubbles and ride checks', () => {
  assert.equal(render({ item: message('rider', null) }).props.senderLabel, 'Ride member');
  assert.equal(render({ item: message('rider', null, 'ride check') }).props.actorLabel, 'Ride member · Rider');
});
