const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTypeScript } = require('./loadTypeScript.cjs');

const downloads = [], reads = [], shared = [], deleted = [];
let downloadResult, downloadError, sharingError, shareResult;
const { shareEventImage } = loadTypeScript('utils/shareEventImage.ts', {
  'react-native-get-random-values': {},
  uuid: { v4: () => 'share-id' },
  'expo-file-system': {
    cacheDirectory: 'file:///cache/',
    EncodingType: { Base64: 'base64' },
    downloadAsync: async (...args) => {
      downloads.push(args);
      if (downloadError) throw downloadError;
      return downloadResult;
    },
    readAsStringAsync: async (...args) => { reads.push(args); return 'image-bytes'; },
    deleteAsync: async (...args) => deleted.push(args),
  },
  'react-native-share': {
    default: { open: async options => {
      shared.push(options);
      if (sharingError) throw sharingError;
      return shareResult;
    } },
  },
});
const event = { imageUrl: 'https://firebasestorage.googleapis.com/event-cover', title: 'Community day', link: 'https://gathergo.events/event/event-1' };
function reset() {
  downloads.length = 0; reads.length = 0; shared.length = 0; deleted.length = 0;
  downloadError = undefined; sharingError = undefined; shareResult = { success: true };
  downloadResult = { uri: 'file:///cache/gathergo-event-share-id', status: 200, mimeType: 'image/png' };
}
test('event image sharing attaches the cover and includes the clickable event link in its message', async () => {
  reset();
  await shareEventImage(event);
  assert.deepEqual(downloads, [[event.imageUrl, 'file:///cache/gathergo-event-share-id']]);
  assert.deepEqual(reads, [['file:///cache/gathergo-event-share-id', { encoding: 'base64' }]]);
  assert.deepEqual(shared, [{
    title: event.title, subject: event.title,
    message: 'Community day\nhttps://gathergo.events/event/event-1',
    url: 'data:image/png;base64,image-bytes', type: 'image/png',
    filename: 'gathergo-event-share-id', useInternalStorage: true, failOnCancel: false,
  }]);
  assert.deepEqual(deleted, [['file:///cache/gathergo-event-share-id', { idempotent: true }]]);
});
test('the image attachment preserves the actual content type returned by storage', async () => {
  reset(); downloadResult.mimeType = 'image/jpeg';
  await shareEventImage(event);
  assert.equal(shared[0].type, 'image/jpeg');
  assert.equal(shared[0].url, 'data:image/jpeg;base64,image-bytes');
});
test('a failed or non-image download cannot open sharing with an invalid attachment', async () => {
  for (const response of [{ status: 404, mimeType: 'image/png' }, { status: 200, mimeType: 'text/html' }, { status: 200, mimeType: null }]) {
    reset(); downloadResult = { ...downloadResult, ...response };
    await assert.rejects(shareEventImage(event), /Could not download the event cover/);
    assert.deepEqual(reads, []);
    assert.deepEqual(shared, []);
    assert.equal(deleted.length, 1);
  }
});
test('network failures remove a partial download and do not trigger image sharing', async () => {
  reset(); downloadError = new Error('Network unavailable');
  await assert.rejects(shareEventImage(event), /Network unavailable/);
  assert.deepEqual(shared, []);
  assert.equal(deleted.length, 1);
});
test('a dismissed share completes quietly and removes the temporary download', async () => {
  reset(); shareResult = { success: false, dismissedAction: true };
  await shareEventImage(event);
  assert.equal(shared[0].failOnCancel, false);
  assert.equal(deleted.length, 1);
});
test('native sharing errors are propagated and temporary downloads are still removed', async () => {
  reset(); sharingError = new Error('No sharing app available');
  await assert.rejects(shareEventImage(event), /No sharing app available/);
  assert.equal(deleted.length, 1);
});
