const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTypeScript } = require('./loadTypeScript.cjs');
const { normalizeNotificationLink } = loadTypeScript('utils/notificationLinks.ts');

test('request, rejection and removal notifications keep their explicit carpool destination', () => {
  for (const type of ['carpool_request', 'carpool_rejected_request', 'carpool_removed']) {
    assert.equal(normalizeNotificationLink('/carpool/ride-1', { carpoolId: 'ride-1', eventId: 'event-1', type }), '/carpool/ride-1');
  }
});
test('chat messages and ride acceptances retain chat destinations', () => {
  assert.equal(normalizeNotificationLink('/chat/ride-1', { carpoolId: 'ride-1' }), '/chat/ride-1');
  assert.equal(normalizeNotificationLink(undefined, { carpoolId: 'ride-1' }), '/chat/ride-1');
});
test('event notification links keep their existing normalization and fallback', () => {
  assert.equal(normalizeNotificationLink('/events/event-1/feed', { eventId: 'event-1' }), '/event/event-1?openFeed=1');
  assert.equal(normalizeNotificationLink('/events/event-1'), '/event/event-1');
  assert.equal(normalizeNotificationLink('/event/event-1', { carpoolId: 'ride-1' }), '/event/event-1');
  assert.equal(normalizeNotificationLink(undefined, { eventId: 'event-1' }), '/event/event-1?openFeed=1');
});
