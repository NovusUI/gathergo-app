const { AndroidConfig, withAndroidManifest } = require("expo/config-plugins");

module.exports = function withFoldableActivity(config) {
  return withAndroidManifest(config, config => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
    const changes = new Set(activity.$["android:configChanges"].split("|"));
    changes.add("smallestScreenSize");
    activity.$["android:configChanges"] = [...changes].join("|");
    return config;
  });
};
