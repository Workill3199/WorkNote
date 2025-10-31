// Inicialización de Firebase para la app, resolviendo configuración desde diferentes fuentes.
// Prioridad: Expo manifest -> EXPO_PUBLIC_* -> FIREBASE_* (legado).
// Incluye normalización de bucket y persistencia en web.
import Constants from 'expo-constants';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeFirestore, Firestore, setLogLevel } from 'firebase/firestore';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { Platform } from 'react-native';

type FirebaseExtra = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
};

// Intentamos leer primero desde el manifest de Expo (dev y nativo),
// y como fallback leemos variables públicas EXPO_PUBLIC_* (web),
// y finalmente las FIREBASE_* tradicionales si existieran.
const expoExtra: FirebaseExtra | undefined = (Constants?.expoConfig as any)?.extra?.firebase;
const publicEnv: FirebaseExtra = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
const legacyEnv: FirebaseExtra = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Normaliza dominios de bucket hacia el formato aceptado por Firebase Storage.
const normalizeBucket = (b?: string) => {
  if (!b) return b;
  // Algunas variables vienen con dominio "firebasestorage.app"; el bucket válido es "<project>.appspot.com"
  return b.replace('.firebasestorage.app', '.appspot.com');
};

const firebaseExtra: FirebaseExtra = {
  apiKey: expoExtra?.apiKey || publicEnv.apiKey || legacyEnv.apiKey,
  authDomain: expoExtra?.authDomain || publicEnv.authDomain || legacyEnv.authDomain,
  projectId: expoExtra?.projectId || publicEnv.projectId || legacyEnv.projectId,
  storageBucket: normalizeBucket(expoExtra?.storageBucket || publicEnv.storageBucket || legacyEnv.storageBucket),
  messagingSenderId: expoExtra?.messagingSenderId || publicEnv.messagingSenderId || legacyEnv.messagingSenderId,
  appId: expoExtra?.appId || publicEnv.appId || legacyEnv.appId,
};

// Verifica si hay configuración mínima para inicializar Firebase.
const hasConfig = Boolean(firebaseExtra && firebaseExtra.apiKey);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

// Inicializa servicios si hay config; si no, advierte por consola.
if (!hasConfig) {
  console.warn('Firebase config no está definido. Completa las variables en .env.');
} else {
  app = getApps().length ? getApp() : initializeApp({
    apiKey: firebaseExtra.apiKey!,
    authDomain: firebaseExtra.authDomain,
    projectId: firebaseExtra.projectId,
    storageBucket: firebaseExtra.storageBucket,
    messagingSenderId: firebaseExtra.messagingSenderId,
    appId: firebaseExtra.appId,
  });

  try {
    auth = initializeAuth(app);
  } catch (e) {
    auth = getAuth(app);
  }

  // Firestore: fuerza long polling en entornos no-web para mejorar compatibilidad de red.
  db = initializeFirestore(app, {
    experimentalForceLongPolling: Platform.OS !== 'web',
    ...(Platform.OS === 'web' ? { experimentalAutoDetectLongPolling: true } : {}),
  });
  // En web: ajustar nivel de logs y habilitar persistencia
  if (typeof window !== 'undefined') {
    // Reducir ruido de logs en desarrollo para errores de transporte abortados
    setLogLevel(process.env.NODE_ENV === 'development' ? 'silent' : 'silent');
    (async () => {
      try {
        const { enableMultiTabIndexedDbPersistence } = await import('firebase/firestore');
        await enableMultiTabIndexedDbPersistence(db!);
      } catch (err: any) {
        console.warn('IndexedDB persistence no disponible o conflicto de pestañas:', err?.message || err);
      }
    })();
  }
  // Storage: usa el bucket normalizado si está definido.
  storage = getStorage(app, firebaseExtra.storageBucket ? `gs://${firebaseExtra.storageBucket}` : undefined as any);
}

export { app, auth, db, storage };