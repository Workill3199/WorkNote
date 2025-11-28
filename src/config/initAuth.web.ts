import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
} from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';

export function initAuth(app: FirebaseApp) {
  const a = getAuth(app);
  // En entornos embebidos (iframes/webviews) algunas persistencias pueden fallar.
  // Probamos en orden: IndexedDB, LocalStorage, SessionStorage y por último memoria.
  (async () => {
    const options = [
      indexedDBLocalPersistence,
      browserLocalPersistence,
      browserSessionPersistence,
      inMemoryPersistence,
    ];
    for (const p of options) {
      try {
        await setPersistence(a, p);
        break; // primera persistencia que funcione
      } catch (err) {
        // Continúa con el siguiente tipo si este no está disponible
        console.warn('Auth persistence no disponible, probando siguiente:', (err as any)?.message || err);
      }
    }
  })().catch(() => {});
  return a;
}