import { initializeAuth } from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';
import { getReactNativePersistence } from 'firebase/auth/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function initAuth(app: FirebaseApp) {
  return initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}