// Configuración de Expo en tiempo de build.
// - Fusiona variables de entorno para Firebase en config.extra.firebase.
// - Normaliza el storageBucket para compatibilidad con Firebase Storage.
// - Registra plugins necesarios (localización y fuentes).
import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  const prevExtra = config.extra ?? {};
  const prevFirebase = (prevExtra as any)?.firebase ?? {};

  const normalizeBucket = (b?: string) => (b ? b.replace('.firebasestorage.app', '.appspot.com') : b);

  const mergedFirebase = {
    apiKey: process.env.FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY || prevFirebase.apiKey,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || prevFirebase.authDomain,
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || prevFirebase.projectId,
    storageBucket: normalizeBucket(process.env.FIREBASE_STORAGE_BUCKET || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || prevFirebase.storageBucket),
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || prevFirebase.messagingSenderId,
    appId: process.env.FIREBASE_APP_ID || process.env.EXPO_PUBLIC_FIREBASE_APP_ID || prevFirebase.appId,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || prevFirebase.measurementId,
  };

  const basePlugins = Array.isArray(config.plugins) ? config.plugins : [];
  const extraPlugins = ['expo-localization', 'expo-font'];
  const mergedPlugins = Array.from(new Set([...basePlugins, ...extraPlugins]));

  return {
    ...config,
    plugins: mergedPlugins,
    extra: {
      ...prevExtra,
      firebase: mergedFirebase,
    },
  };
};
