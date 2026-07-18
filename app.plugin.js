const path = require('path');

function hostResolve(modulePath) {
  return require.resolve(modulePath, { paths: [process.cwd()] });
}

const {
  withPlugins,
  withAndroidManifest,
  withInfoPlist,
  withProjectBuildGradle,
  AndroidConfig,
} = require(hostResolve('expo/config-plugins'));

const SOUNDS_DIR = path.join(__dirname, 'sounds');

const SOUND_FILES = [
  'notification_default.wav',
  'order_new.wav',
  'order_status.wav',
  'order_alert.wav',
  'order_complete.wav',
  'order_cancelled.wav',
  'rider_pickup.wav',
  'rider_opportunity.wav',
  'timer_alert.wav',
];

function withNotifeeMavenRepo(config) {
  return withProjectBuildGradle(config, (cfg) => {
    const allProjects = cfg.modResults.contents;
    const repoLine = `maven { url("$rootDir/../node_modules/@notifee/react-native/android/libs") }`;
    if (allProjects.includes(repoLine)) return cfg;
    const search = /allprojects\s*\{([^}]*repositories[^}]*)\}/s;
    const updated = allProjects.replace(search, (_match, block) => {
      const repoBlock = block.trim();
      const indented = repoLine.replace(/^/gm, '      ');
      return _match.replace(repoBlock, `${repoBlock}\n      ${indented}`);
    });
    cfg.modResults.contents = updated;
    return cfg;
  });
}

function withFirebaseManifestReplacements(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const app = manifest?.manifest?.application?.[0];
    if (!app) return cfg;
    const metaData = app['meta-data'] || [];
    const colorEntry = metaData.find(
      (m) => m.$?.['android:name'] === 'com.google.firebase.messaging.default_notification_color',
    );
    const iconEntry = metaData.find(
      (m) => m.$?.['android:name'] === 'com.google.firebase.messaging.default_notification_icon',
    );
    if (colorEntry) colorEntry.$['tools:replace'] = 'android:resource';
    if (iconEntry) iconEntry.$['tools:replace'] = 'android:resource';
    return cfg;
  });
}

module.exports = function withTeincfoodNotifications(config, _props) {
  config = withPlugins(config, [
    [
      'expo-notifications',
      { sounds: SOUND_FILES.map((f) => path.join(SOUNDS_DIR, f)) },
    ],
    ['@react-native-firebase/app', { ios: { useFrameworks: 'static' } }],
    ['@react-native-firebase/messaging', { ios: { useFrameworks: 'static' } }],
    ['expo-live-activity', { enablePushNotifications: true }],
  ]);

  config = withNotifeeMavenRepo(config);
  config = withFirebaseManifestReplacements(config);

  config = withInfoPlist(config, (cfg) => {
    if (!cfg.modResults.UIBackgroundModes) {
      cfg.modResults.UIBackgroundModes = [];
    }
    if (!cfg.modResults.UIBackgroundModes.includes('remote-notification')) {
      cfg.modResults.UIBackgroundModes.push('remote-notification');
    }
    return cfg;
  });

  config = AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.POST_NOTIFICATIONS',
    'android.permission.WAKE_LOCK',
    'android.permission.RECEIVE_BOOT_COMPLETED',
  ]);

  return config;
};
