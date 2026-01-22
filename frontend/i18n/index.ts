import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './en.json';
import fr from './fr.json';

// Determine the language to use:
// 1. First, check for environment variable override (for testing)
// 2. Then, use device locale
// 3. Finally, fallback to English
const getInitialLanguage = (): string => {
  // Check for environment variable override (for testing)
  const envOverride = process.env.EXPO_PUBLIC_LANGUAGE_OVERRIDE;
  if (envOverride) {
    console.log(`🌐 Language override detected: ${envOverride}`);
    return envOverride;
  }

  // Get device locale (e.g., "en-US", "fr-FR")
  const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
  console.log(`🌐 Device locale detected: ${deviceLocale}`);
  
  return deviceLocale;
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    compatibilityJSON: 'v3', // Use i18next v3 format
  });

export default i18n;
