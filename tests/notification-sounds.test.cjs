/* global __dirname */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { loadTypeScript } = require('./loadTypeScript.cjs');
const { NOTIFICATION_SOUNDS } = loadTypeScript('constants/notificationSounds.ts');

let os = 'android';
let isDevice = true;
let permission = 'granted';
let requestedPermission = 'granted';
let failChannel = false;
const calls = [];
const notifications = {
  AndroidImportance: { HIGH: 6 },
  setNotificationChannelAsync: async (id, config) => {
    calls.push(['channel', id, config]);
    if (failChannel) throw new Error('Channel creation failed');
  },
  getPermissionsAsync: async () => { calls.push(['permission']); return { status: permission }; },
  requestPermissionsAsync: async () => { calls.push(['request']); return { status: requestedPermission }; },
  getExpoPushTokenAsync: async config => { calls.push(['token', config]); return { data: 'ExponentPushToken[test]' }; },
};
const { registerForPushNotifications } = loadTypeScript('utils/pushNotification.ts', {
  'expo-constants': { default: { expoConfig: { extra: { eas: { projectId: 'gathergo-project' } } } } },
  'expo-device': { get isDevice() { return isDevice; } },
  'expo-notifications': notifications,
  'react-native': { Platform: { get OS() { return os; } } },
});
function reset() {
  calls.length = 0;
  os = 'android'; isDevice = true; permission = 'granted'; requestedPermission = 'granted'; failChannel = false;
}

test('Android creates all four audible channels before asking for permission or fetching a token', async () => {
  reset(); permission = 'undetermined';
  assert.equal(await registerForPushNotifications(), 'ExponentPushToken[test]');
  assert.deepEqual(calls.slice(0, 4).map(call => call[1]), Object.values(NOTIFICATION_SOUNDS).map(sound => sound.channelId));
  for (const [index, sound] of Object.values(NOTIFICATION_SOUNDS).entries()) {
    assert.deepEqual(calls[index], ['channel', sound.channelId, {
      name: sound.name, sound: sound.sound, importance: 6, vibrationPattern: [0, 250, 250, 250],
    }]);
  }
  assert.deepEqual(calls.slice(4), [['permission'], ['request'], ['token', { projectId: 'gathergo-project' }]]);
});

test('iOS uses bundled push sounds without creating Android channels', async () => {
  reset(); os = 'ios';
  assert.equal(await registerForPushNotifications(), 'ExponentPushToken[test]');
  assert.deepEqual(calls, [['permission'], ['token', { projectId: 'gathergo-project' }]]);
});

test('denied notification permission does not request a push token', async () => {
  reset(); permission = 'denied'; requestedPermission = 'denied';
  assert.equal(await registerForPushNotifications(), null);
  assert.equal(calls.some(call => call[0] === 'token'), false);
});

test('a channel failure stops token registration rather than silently registering with missing sounds', async () => {
  reset(); failChannel = true;
  const originalError = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args);
  try { assert.equal(await registerForPushNotifications(), null); }
  finally { console.error = originalError; }
  assert.equal(calls.some(call => call[0] === 'token' || call[0] === 'permission'), false);
  assert.equal(errors.length, 1);
});

test('simulators keep the existing physical-device push registration guard', async () => {
  reset(); isDevice = false;
  assert.equal(await registerForPushNotifications(), null);
  assert.deepEqual(calls, []);
});

test('native config bundles every channel sound as a valid short PCM WAV and sets the matching default', () => {
  const root = path.resolve(__dirname, '..');
  const config = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  const plugins = config.expo.plugins.filter(plugin => Array.isArray(plugin) && plugin[0] === 'expo-notifications');
  assert.equal(plugins.length, 1);
  assert.equal(plugins[0][1].defaultChannel, NOTIFICATION_SOUNDS.general.channelId);
  const sounds = Object.values(NOTIFICATION_SOUNDS);
  assert.equal(new Set(sounds.map(sound => sound.channelId)).size, 4);
  assert.deepEqual(plugins[0][1].sounds, sounds.map(sound => `./assets/sounds/${sound.sound}`));
  for (const { sound } of sounds) {
    assert.match(sound, /^[a-z_]+\.wav$/);
    const buffer = fs.readFileSync(path.join(root, 'assets/sounds', sound));
    assert.equal(buffer.toString('ascii', 0, 4), 'RIFF');
    assert.equal(buffer.toString('ascii', 8, 12), 'WAVE');
    let format, byteRate, dataSize;
    for (let offset = 12; offset + 8 <= buffer.length;) {
      const kind = buffer.toString('ascii', offset, offset + 4);
      const size = buffer.readUInt32LE(offset + 4);
      if (kind === 'fmt ') { format = buffer.readUInt16LE(offset + 8); byteRate = buffer.readUInt32LE(offset + 16); }
      if (kind === 'data') dataSize = size;
      offset += 8 + size + size % 2;
    }
    assert.equal(format, 1, `${sound} uses linear PCM`);
    assert.ok(dataSize / byteRate > 0 && dataSize / byteRate < 30, `${sound} is below iOS's 30-second limit`);
  }
});
