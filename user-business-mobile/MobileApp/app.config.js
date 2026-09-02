const fs = require("fs");
const path = require("path");

/**
 * Dynamic Expo config so EAS preview builds succeed without Firebase config
 * files in git. When google-services.json / GoogleService-Info.plist exist
 * (local or via EAS file env vars copied into the project), Firebase plugins
 * stay enabled. Otherwise they are omitted and GA4 no-ops at runtime.
 */
module.exports = ({ config }) => {
  // Prefer static app.json fields when present; Expo merges config.
  const root = __dirname;
  const androidGs = path.join(root, "google-services.json");
  const iosGs = path.join(root, "GoogleService-Info.plist");
  const hasAndroidGs = fs.existsSync(androidGs);
  const hasIosGs = fs.existsSync(iosGs);
  const enableFirebase = hasAndroidGs || hasIosGs;

  const plugins = [
    "expo-router",
    "expo-dev-client",
    "expo-video",
    "expo-font",
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#000000",
      },
    ],
    [
      "@stripe/stripe-react-native",
      {
        merchantIdentifier: "merchant.com.galyvant.aux",
        enableGooglePay: true,
      },
    ],
    "@react-native-community/datetimepicker",
  ];

  if (enableFirebase) {
    plugins.push("@react-native-firebase/app");
    plugins.push([
      "@react-native-firebase/analytics",
      { ios: { withoutAdIdSupport: true } },
    ]);
    plugins.push([
      "expo-build-properties",
      { ios: { useFrameworks: "static" } },
    ]);
  }

  const ios = {
    appleTeamId: "VNG3LN323R",
    bundleIdentifier: "com.galyvant.aux",
    buildNumber: "1",
    supportsTablet: true,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  };
  if (hasIosGs) {
    ios.googleServicesFile = "./GoogleService-Info.plist";
  }

  const android = {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#000000",
    },
    package: "com.ng4.RNAuth",
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: "aux" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
    softwareKeyboardLayoutMode: "resize",
    navigationBar: { backgroundColor: "#000000" },
    statusBar: { backgroundColor: "#000000", barStyle: "light-content" },
  };
  if (hasAndroidGs) {
    android.googleServicesFile = "./google-services.json";
  }

  return {
    ...config,
    name: "Aux",
    slug: "Aux",
    scheme: "aux",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    ios,
    android,
    androidStatusBar: {
      backgroundColor: "#000000",
      barStyle: "light-content",
    },
    web: { favicon: "./assets/favicon.png", bundler: "metro" },
    plugins,
    extra: {
      router: {},
      eas: { projectId: "83c8e834-27c8-4681-961c-a40b215cf9a2" },
      firebaseNativeEnabled: enableFirebase,
    },
  };
};
