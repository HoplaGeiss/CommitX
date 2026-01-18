// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withSentryConfig } = require('@sentry/react-native/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// TODO: Re-enable Sentry Metro plugin once compatibility issue is fixed
// 
// TEMPORARY WORKAROUND #1 of 3 (Sentry debugging restoration)
// Currently disabled for production builds due to this error during bundling:
// "TypeError: Cannot read properties of undefined (reading 'match')"
// at determineDebugIdFromBundleSource in @sentry/react-native@7.9.0
//
// Impact: Sentry runtime still works (initialized in App.tsx), but without:
// - Enhanced source maps (stack traces show minified code instead of source files)
// - Automatic bundle analysis
//
// Related workarounds:
// - Workaround #2: Sentry Expo plugin removed from app.json (prevents Xcode upload script)
// - Workaround #3: SENTRY_DISABLE_AUTO_UPLOAD in eas.json (additional safeguard)
//
// To fix: Once Sentry releases a patch:
// 1. Update @sentry/react-native to fixed version
// 2. Test: NODE_ENV=production pnpm expo export --platform ios
// 3. If successful, change line below to: module.exports = withSentryConfig(config);
// See README.md "TODO / Known Issues" section for full timeline
const isProduction = process.env.NODE_ENV === 'production' || process.env.EAS_BUILD === 'true';

module.exports = isProduction ? config : withSentryConfig(config);

