import { Platform } from 'react-native';
import { apiClient } from './apiClient';

declare global {
  interface Window {
    google?: any;
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';
const CALENDAR_READONLY_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

export async function loadGsiClient(): Promise<void> {
  if (Platform.OS !== 'web') return; // Solo web
  if (window.google?.accounts?.oauth2) return; // ya cargado
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services'));
    document.head.appendChild(script);
  });
}

/**
 * Solicita consentimiento de calendario y obtiene un code OAuth (offline) via popup.
 * Envía el code al backend para intercambio de tokens.
 */
export async function requestGoogleCalendarCode(options?: {
  userId?: string;
  onCode?: (code: string) => Promise<void> | void;
}): Promise<void> {
  if (Platform.OS !== 'web') {
    console.warn('Google Calendar consent solo está soportado en web en este flujo.');
    return;
  }
  await loadGsiClient();
  const clientId =
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('Falta EXPO_PUBLIC_GOOGLE_CLIENT_ID en entorno.');

  const codeClient = window.google!.accounts.oauth2.initCodeClient({
    client_id: clientId,
    scope: CALENDAR_READONLY_SCOPE,
    access_type: 'offline',
    ux_mode: 'popup',
    callback: async (response: any) => {
      const code = response?.code as string;
      if (!code) {
        console.warn('No se recibió code de GIS.');
        return;
      }
      // Si el consumidor provee un handler, usarlo
      if (options?.onCode) {
        await options.onCode(code);
        return;
      }
      // Por defecto, enviar al backend para intercambio de tokens
      try {
        await apiClient.post('/google/exchange', {
          code,
          userId: options?.userId,
        });
      } catch (e: any) {
        console.error('Error enviando code al backend:', e?.message || e);
      }
    },
  });
  codeClient.requestCode();
}