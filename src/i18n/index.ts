// Configuración de i18n: integra i18next con React y registra recursos de idioma.
// Nota: los archivos JSON (es.json, en.json) no aceptan comentarios; por eso
// documentamos aquí cómo se cargan, cómo se nombran las claves y cómo extender.
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import es from './es.json';

// Idioma por defecto de la app. Actualmente se fija a 'es'.
// Si se quisiera usar el idioma del dispositivo: Localization.locale
// (p. ej. extraer 'es' de 'es-ES'), pero sin cambiar la lógica actual.
const defaultLng = 'es';

void i18n
  .use(initReactI18next)
  .init({
    // Asegura compatibilidad con el formato de recursos JSON v3.
    compatibilityJSON: 'v3',
    // Idioma inicial; controla qué paquete de traducción se usa.
    lng: defaultLng,
    // Si falta una clave en el idioma actual, se recurre a este idioma.
    fallbackLng: 'es',
    // Recursos registrados: por ahora solo español.
    // Para habilitar inglés, importar en.json y añadir: en: { translation: en }
    // Convención de claves: Namespace.Sección.Clave (p. ej. "Common.save").
    resources: {
      es: { translation: es },
    },
    // React ya maneja el escape de valores; mantener en false evita doble escape.
    interpolation: { escapeValue: false },
  });

export default i18n;