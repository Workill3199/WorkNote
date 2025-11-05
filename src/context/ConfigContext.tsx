// Contexto global de configuración de la app.
// - Persiste en AsyncStorage bajo la clave STORAGE_KEY.
// - Expone setters para cada opción y un método save() que además
//   sincroniza el nickname con el perfil de Firebase (displayName).
// - La bandera 'loaded' indica cuándo se terminó de cargar desde almacenamiento.
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase';

// Estructura de configuración soportada por la aplicación.
export type AppConfig = {
  nickname: string;
  lightMode: boolean;
  notifications: boolean;
  privacy: boolean;
  notificationFrequency: 'instant' | 'daily' | 'weekly';
  notificationChannels: {
    cursos: boolean;
    talleres: boolean;
    estudiantes: boolean;
    actividades: boolean;
    avisos: boolean;
  };
  quietHours: boolean;
  shareActivity: boolean;
  analytics: boolean;
  excludeFromSearch: boolean;
};

// Valores por defecto para configuración inicial y como fallback.
const DEFAULT_CONFIG: AppConfig = {
  nickname: 'Nuevo Apodo',
  lightMode: false,
  notifications: true,
  privacy: false,
  notificationFrequency: 'instant',
  notificationChannels: { cursos: true, talleres: true, estudiantes: true, actividades: true, avisos: true },
  quietHours: false,
  shareActivity: true,
  analytics: true,
  excludeFromSearch: false,
};

// Clave de almacenamiento local para persistir la configuración.
const STORAGE_KEY = 'worknote:config';

export type ConfigContextValue = {
  config: AppConfig;
  setNickname: (v: string) => void;
  setLightMode: (v: boolean) => void;
  setNotifications: (v: boolean) => void;
  setPrivacy: (v: boolean) => void;
  setNotificationFrequency: (v: 'instant' | 'daily' | 'weekly') => void;
  setNotificationChannel: (k: keyof AppConfig['notificationChannels'], v: boolean) => void;
  setQuietHours: (v: boolean) => void;
  setShareActivity: (v: boolean) => void;
  setAnalytics: (v: boolean) => void;
  setExcludeFromSearch: (v: boolean) => void;
  save: () => Promise<void>;
  loaded: boolean;
};

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

// Proveedor del contexto: carga configuración, expone setters y guardado.
export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);

  // Carga inicial desde AsyncStorage y marca loaded cuando termina.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setConfig({ ...DEFAULT_CONFIG, ...parsed });
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const setNickname = (v: string) => setConfig(prev => ({ ...prev, nickname: v }));
  const setLightMode = (v: boolean) => setConfig(prev => ({ ...prev, lightMode: v }));
  const setNotifications = (v: boolean) => setConfig(prev => ({ ...prev, notifications: v }));
  const setPrivacy = (v: boolean) => setConfig(prev => ({ ...prev, privacy: v }));
  const setNotificationFrequency = (v: 'instant' | 'daily' | 'weekly') => setConfig(prev => ({ ...prev, notificationFrequency: v }));
  const setNotificationChannel = (k: keyof AppConfig['notificationChannels'], v: boolean) => setConfig(prev => ({ ...prev, notificationChannels: { ...prev.notificationChannels, [k]: v } }));
  const setQuietHours = (v: boolean) => setConfig(prev => ({ ...prev, quietHours: v }));
  const setShareActivity = (v: boolean) => setConfig(prev => ({ ...prev, shareActivity: v }));
  const setAnalytics = (v: boolean) => setConfig(prev => ({ ...prev, analytics: v }));
  const setExcludeFromSearch = (v: boolean) => setConfig(prev => ({ ...prev, excludeFromSearch: v }));

  // Persiste la configuración y, si corresponde, actualiza el displayName en Firebase.
  const save = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      const user = auth?.currentUser;
      if (user && config.nickname && user.displayName !== config.nickname) {
        await updateProfile(user, { displayName: config.nickname });
      }
    } catch (e) {
      // Silencioso, la UI maneja feedback
    }
  };

  const value = useMemo(
    () => ({ config, setNickname, setLightMode, setNotifications, setPrivacy, setNotificationFrequency, setNotificationChannel, setQuietHours, setShareActivity, setAnalytics, setExcludeFromSearch, save, loaded }),
    [config, loaded]
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

// Hook de acceso al contexto; asegura uso dentro del proveedor.
export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}