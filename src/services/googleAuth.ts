import { Platform } from 'react-native';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Autenticación de usuario con Google en web (Firebase Auth).
 * Nota: Esto autentica al usuario en la app, no sustituye el flujo GIS para obtener tokens de Calendar.
 */
export async function signInWithGoogleWeb() {
  if (Platform.OS !== 'web') {
    throw new Error('signInWithGoogleWeb solo está soportado en web.');
  }
  const provider = new GoogleAuthProvider();
  // Opcional: añadir scope de calendario
  provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
  const result = await signInWithPopup(auth!, provider);
  return result;
}