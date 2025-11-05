import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Silencia el error/overlay específico de Expo Go en Android
// que muestra: "expo-notifications: Android Push notifications..."
// No afecta otros errores, solo filtra ese mensaje concreto.
export function silenceExpoGoNotificationsWarning() {
  const isExpoGo = Constants?.executionEnvironment === 'storeClient';
  if (Platform.OS === 'android' && isExpoGo) {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      try {
        const first = args?.[0];
        const msg = typeof first === 'string' ? first : String(first);
        if (msg?.includes('expo-notifications: Android Push notifications')) {
          // Ignora solo el aviso de expo-notifications en Expo Go Android
          return;
        }
      } catch {}
      originalError(...args);
    };
  }
}