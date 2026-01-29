import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './en.json';
import fr from './fr.json';
import de from './de.json';
import es from './es.json';
import it from './it.json';
import pt from './pt.json';
import nl from './nl.json';
import pl from './pl.json';
import ro from './ro.json';
import el from './el.json';
import cs from './cs.json';
import hu from './hu.json';
import sv from './sv.json';
import da from './da.json';
import fi from './fi.json';
import no from './no.json';
import sk from './sk.json';
import bg from './bg.json';
import hr from './hr.json';
import lt from './lt.json';
import sl from './sl.json';
import lv from './lv.json';
import et from './et.json';

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
      de: { translation: de },
      es: { translation: es },
      it: { translation: it },
      pt: { translation: pt },
      nl: { translation: nl },
      pl: { translation: pl },
      ro: { translation: ro },
      el: { translation: el },
      cs: { translation: cs },
      hu: { translation: hu },
      sv: { translation: sv },
      da: { translation: da },
      fi: { translation: fi },
      no: { translation: no },
      sk: { translation: sk },
      bg: { translation: bg },
      hr: { translation: hr },
      lt: { translation: lt },
      sl: { translation: sl },
      lv: { translation: lv },
      et: { translation: et },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    compatibilityJSON: 'v3', // Use i18next v3 format
  });

export default i18n;
