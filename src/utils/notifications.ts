import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

export async function requestNotificationPermission() {
  const settings = await Notifications.getPermissionsAsync();
  if (!settings.granted) {
    const result = await Notifications.requestPermissionsAsync();
    return result.granted || result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  }
  return true;
}

export async function scheduleTestNotification(title: string, body: string) {
  const permitted = await requestNotificationPermission();
  if (!permitted) throw new Error('Permiso de notificaciones denegado');

  if (Platform.OS === 'web') {
    // expo-notifications no funciona en web; usamos Notification API si disponible
    if ('Notification' in window) {
      if (Notification.permission !== 'granted') await Notification.requestPermission();
      new Notification(title, { body });
      return;
    }
    throw new Error('Notificaciones no soportadas en web');
  }

  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { seconds: 3 },
  });
}

export function useNotificationHandler() {
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }, []);
}