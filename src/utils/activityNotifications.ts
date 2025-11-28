import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { requestNotificationPermission } from './notifications';
import { Activity } from '../services/activities';

type Priority = 'alta' | 'media' | 'baja' | 'ninguna';

const STORAGE_KEY = 'worknote:notifiedActivities';

function daysUntil(due?: string): number | undefined {
  if (!due) return undefined;
  try {
    const now = new Date();
    const d = new Date(due);
    now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return undefined;
  }
}

export function getPriorityByDueDate(due?: string): Priority {
  const diffDays = daysUntil(due);
  if (diffDays === undefined) return 'ninguna';
  if (diffDays < 0) return 'ninguna'; // vencida: no se notifica como próxima
  if (diffDays <= 7) return 'alta'; // dentro de esta semana
  if (diffDays <= 21) return 'media'; // 1 a 3 semanas
  if (diffDays <= 30) return 'baja'; // hasta 1 mes
  return 'ninguna';
}

async function getNotifiedMap(): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

async function setNotified(id: string) {
  try {
    const map = await getNotifiedMap();
    map[id] = Date.now();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

async function notifyNow(title: string, body: string) {
  const permitted = await requestNotificationPermission();
  if (!permitted) return;

  if (Platform.OS === 'web') {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted') await Notification.requestPermission();
      new Notification(title, { body });
      return;
    }
    return;
  }

  const Notifications = await import('expo-notifications');
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}

export async function scheduleHighPriorityNotifications(activities: Activity[], options?: { channel?: string }) {
  const map = await getNotifiedMap();
  const toNotify = activities.filter((a) => {
    if (!a?.id) return false;
    if (a.completed) return false;
    const prio = getPriorityByDueDate(a.dueDate);
    if (prio !== 'alta') return false;
    // Evitar duplicar notificaciones si ya se emitió por esta actividad
    return !map[a.id];
  });

  for (const a of toNotify) {
    const title = 'Actividad próxima a vencer';
    const body = `${a.title ?? 'Actividad'} vence pronto. ¡No olvides entregarla!`;
    try {
      await notifyNow(title, body);
      await setNotified(a.id!);
    } catch {}
  }
}