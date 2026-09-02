const fs = require("fs");
const path = require("path");

/**
 * Resolve Firebase config: EAS file env vars are absolute paths outside the
 * project. Copy into MobileApp root so prebuild / googleServicesFile paths work.
 * Local/dev already has gitignored files in place.
 */
function resolveGoogleServicesFile(envVarName, localFileName) {
  const root = __dirname;
  const localPath = path.join(root, localFileName);
  const fromEnv = process.env[envVarName];

  if (fromEnv && fs.existsSync(fromEnv)) {
    if (path.resolve(fromEnv) !== path.resolve(localPath)) {
      fs.copyFileSync(fromEnv, localPath);
    }
    return `./${localFileName}`;
  }

  if (fs.existsSync(localPath)) {
    return `./${localFileName}`;
  }

  return null;
}

/**
 * Dynamic Expo config so EAS preview builds succeed without Firebase config
 * files in git. When google-services.json / GoogleService-Info.plist exist
 * (local or via EAS file env vars), Firebase plugins stay enabled. Otherwise
 * they are omitted and GA4 no-ops at runtime.
 */
module.exports = ({ config }) => {
  const androidGs = resolveGoogleServicesFile(
    "GOOGLE_SERVICES_JSON",
    "google-services.json"
  );
  const iosGs = resolveGoogleServicesFile(
    "GOOGLE_SERVICES_PLIST",
    "GoogleService-Info.plist"
  );
  const enableFirebase = Boolean(androidGs || iosGs);

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
  if (iosGs) {
    ios.googleServicesFile = iosGs;
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
  if (androidGs) {
    android.googleServicesFile = androidGs;
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
