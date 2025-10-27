import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import es from './es.json';

const defaultLng = 'es';

void i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    lng: defaultLng,
    fallbackLng: 'es',
    resources: {
      es: { translation: es },
    },
    interpolation: { escapeValue: false },
  });

export default i18n;