import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import { useEffect } from 'react';

// Detecta si estamos ejecutando en Expo Go (store client), donde
// los push remotos en Android ya no están soportados desde SDK 53.
const isExpoGo = Constants?.executionEnvironment === 'storeClient';

export async function requestNotificationPermission() {
  if (Platform.OS === 'android' && isExpoGo) {
    // Evitar importar expo-notifications y cualquier auto registro en Expo Go Android.
    return false;
  }
  const Notifications = await import('expo-notifications');
  const settings = await Notifications.getPermissionsAsync();
  if (!settings.granted) {
    const result = await Notifications.requestPermissionsAsync();
    return result.granted || result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  }
  return true;
}

export async function scheduleTestNotification(title: string, body: string) {
  const permitted = await requestNotificationPermission();
  if (!permitted) {
    if (Platform.OS === 'android' && isExpoGo) {
      // En Expo Go Android, avisamos que se requiere development build para push.
      Alert.alert('Notificaciones', 'Para probar notificaciones usa un Development Build (EAS).');
      return;
    }
    throw new Error('Permiso de notificaciones denegado');
  }

  if (Platform.OS === 'web') {
    // expo-notifications no funciona en web; usamos Notification API si disponible
    if ('Notification' in window) {
      if (Notification.permission !== 'granted') await Notification.requestPermission();
      new Notification(title, { body });
      return;
    }
    throw new Error('Notificaciones no soportadas en web');
  }

  const Notifications = await import('expo-notifications');
  // Para evitar incompatibilidades de tipos entre SDKs (algunos requieren 'type'),
  // usamos disparo inmediato con trigger null.
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}

export function useNotificationHandler() {
  useEffect(() => {
    if (Platform.OS === 'android' && isExpoGo) {
      // No configurar handler para evitar efectos colaterales del módulo en Expo Go.
      return;
    }
    (async () => {
      const Notifications = await import('expo-notifications');
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          // En SDK recientes, banner y lista son requeridos
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
    })();
  }, []);
}