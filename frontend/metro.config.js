// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withSentryConfig } = require('@sentry/react-native/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// TODO: Re-enable Sentry Metro plugin once compatibility issue is fixed
// Currently disabled for production builds due to this error during bundling:
// "TypeError: Cannot read properties of undefined (reading 'match')"
// at determineDebugIdFromBundleSource in @sentry/react-native@7.9.0
//
// Impact: Sentry still works at runtime (initialized in App.tsx), but without:
// - Enhanced source maps (stack traces show minified code)
// - Automatic bundle analysis
//
// To fix: Once Sentry releases a patch, update @sentry/react-native and
// change line below to: module.exports = withSentryConfig(config);
const isProduction = process.env.NODE_ENV === 'production' || process.env.EAS_BUILD === 'true';

module.exports = isProduction ? config : withSentryConfig(config);

