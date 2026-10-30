const assert = require('node:assert/strict');
const { test } = require('node:test');
const { AndroidConfig } = require('expo/config-plugins');
const withFoldableActivity = require('../plugins/withFoldableActivity');
const app = require('../app.json').expo;

test('folding changes the existing Android activity configuration without changing linking or keyboard behavior', async () => {
  const flags = 'keyboard|keyboardHidden|orientation|screenSize|screenLayout|uiMode';
  const attributes = { 'android:name': '.MainActivity', 'android:configChanges': flags, 'android:launchMode': 'singleTask', 'android:windowSoftInputMode': 'adjustResize' };
  const manifest = { manifest: { application: [{ activity: [{ $: { ...attributes } }] }] } };
  const configured = withFoldableActivity({ name: 'GatherGo', slug: 'gathergoapp' });
  const result = await configured.mods.android.manifest({ ...configured, modResults: manifest, modRequest: { platform: 'android', modName: 'manifest', introspect: true } });
  const activity = AndroidConfig.Manifest.getMainActivityOrThrow(result.modResults);
  assert.deepEqual(activity.$, { ...attributes, 'android:configChanges': `${flags}|smallestScreenSize` });
  const repeated = await configured.mods.android.manifest(result);
  assert.equal(AndroidConfig.Manifest.getMainActivityOrThrow(repeated.modResults).$['android:configChanges'], `${flags}|smallestScreenSize`);
  assert.ok(app.plugins.includes('./plugins/withFoldableActivity'), 'clean prebuilds must retain fold support');
});
