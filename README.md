# WorkNote — Guía de uso y despliegue

Este documento explica, de forma práctica y detallada, cómo instalar, configurar, ejecutar y construir la app WorkNote. Está pensado para que cualquier persona que vea el código pueda entender cómo utilizarla y cómo funciona su arquitectura.

## Descripción general

WorkNote es una aplicación móvil y web (Expo/React Native + Web) para gestión académica: cursos, actividades, entregas, asistencia y perfiles de usuario. Utiliza Firebase como backend (Auth, Firestore y Storage), internacionalización (i18n) en español/inglés y un tema visual personalizable.

- Framework: `Expo` (React Native + Web)
- Backend: `Firebase` (Auth/Firestore/Storage)
- Build: `EAS Build` para APK/AAB
- i18n: `src/i18n` con `es` y `en`
- Tema: `src/theme` (colores, tipografía, navegación)

## Requisitos

- Node.js 18+ (recomendado LTS)
- Git
- Expo CLI y EAS CLI
  - Instalar Expo CLI: `npm i -g expo-cli` (o usar `npx expo`)
  - Instalar EAS CLI: `npm i -g eas-cli`
- Cuenta de Expo (para builds remotos)
- Proyecto de Firebase con las credenciales necesarias

## Estructura del proyecto

Raíz `WorkNote`:
- `App.tsx`: punto de entrada de la app.
- `app.config.ts`: configuración de Expo; lee variables de entorno públicas de Firebase.
- `eas.json`: perfiles de build (por ejemplo, `preview` para APK).
- `src/`: código fuente principal.
  - `components/`: componentes UI reutilizables.
  - `config/firebase.ts`: inicialización y acceso a Firebase.
  - `context/ConfigContext.tsx`: configuración compartida de la app.
  - `i18n/`: archivos de traducción `es.json`, `en.json` y setup.
  - `screens/`: pantallas por rol y flujo.
  - `services/`: acceso a datos (actividades, cursos, alumnos, etc.).
  - `theme/`: colores, tipografías y helpers de navegación.
  - `utils/`: utilidades como notificaciones y silenciar warnings.
- `viewperfil/`: proyecto Next.js independiente para vista de perfil público (opcional).

## Configuración de entorno (Firebase)

La app lee variables públicas de entorno (prefijo `EXPO_PUBLIC_`) desde `app.config.ts` para configurar Firebase. Crea un archivo `.env` en la raíz del proyecto con estos valores:

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

Notas:
- `app.config.ts` normaliza `storageBucket` si es necesario.
- Asegúrate de que el proyecto de Firebase tenga Firestore y Authentication habilitados.

## Puesta en marcha (desarrollo)

- Instalar dependencias:
  - `npm install`
- Ejecutar en web:
  - `npx expo start --web`
- Ejecutar en Android/iOS (Expo Go o emulador):
  - `npx expo start`
  - Escanea el QR en Expo Go o abre el emulador.

Sugerencias:
- Si usas puertos específicos en web: `npx expo start --web --port 8088`.
- Limpia caches si ves comportamientos extraños: `npx expo start --clear`.

## Uso de la app (paso a paso)

1. Inicio y autenticación
   - Abre la app y accede con tu cuenta (Firebase Auth).
   - Si es tu primera vez, completa tu perfil básico.

2. Selección de rol
   - Pantalla `RegisterRoleScreen`: elige rol (Alumno o Profesor).
   - La app ajusta el menú y las pantallas según el rol.

3. Navegación principal
   - Menú de cursos: lista de cursos disponibles (`CourseListItem`).
   - Actividades: visualiza tareas, anexos y fechas (`ActivitiesListScreen`).
   - Entregas: sube archivos, revisa estados, recibe notificaciones.
   - Asistencia y alumnos: gestión de listas y estados.
   - Perfil de usuario: `UserProfileScreen` para editar tu información.

4. Descarga y manejo de archivos
   - En "Actividades", abre un archivo adjunto y la app intentará descargarlo.
   - La descarga usa preferentemente `FileSystem.cacheDirectory` (más seguro y tipado) y recurre a `documentDirectory` como respaldo según la plataforma.
   - En web, la descarga se gestiona mediante el navegador. En móviles, se guarda en el caché de la app.

5. Idioma y tema
   - i18n: la app detecta el idioma y usa `src/i18n/es.json` o `en.json`.
   - Tema: colores y tipografías en `src/theme`.

## Notificaciones (expo-notifications)

- La app define un `NotificationHandler` en `src/utils/notifications.ts` que cumple con los tipos del SDK:
  - `handleNotification` retorna `Promise<NotificationBehavior>` con `shouldShowBanner: true` y `shouldShowList: true`.
- En `scheduleNotificationAsync`, el `trigger` se establece en `null` para compatibilidad de tipos y notificación inmediata.
- En Expo Go (Android), hay un warning conocido por la inicialización de `expo-notifications`. Para evitar el overlay de error sin afectar builds reales:
  - Se añadió `src/utils/silenceExpoGoNotifications.ts` que filtra específicamente ese mensaje cuando se ejecuta en Expo Go Android.
  - `App.tsx` importa y ejecuta esta utilidad al inicio.

## Construcción y distribución

Perfiles definidos en `eas.json`:
- `preview` (Android): genera un `APK` instalable.

Pasos para construir APK con EAS:
1. Inicia sesión en Expo: `eas whoami` (debería mostrar tu usuario).
2. Lanza el build:
   - `eas build -p android --profile preview`
3. Sigue el enlace que te devolverá la consola para ver el progreso y descargar el artefacto (`.apk`).
4. En Android, habilita “Instalar apps de orígenes desconocidos” para poder instalar el `.apk` manualmente.

Para Play Store (AAB):
- Crea/usa un perfil de producción en `eas.json` que genere `aab` y configura firmas y `package` en `app.config.ts`.

## Solución de problemas (FAQ)

- No se muestran notificaciones en Expo Go:
  - Expo Go limita algunos comportamientos; prueba en un build `preview` o en emulador.
- Error/overlay de `expo-notifications` en Expo Go Android:
  - La utilidad `silenceExpoGoNotifications.ts` evita el overlay en desarrollo.
- Descargas no guardan en el dispositivo:
  - En Android/iOS se usa `cacheDirectory`; revisa permisos y espacio.
  - En web, el navegador gestiona la descarga; desactiva bloqueadores.
- Variables Firebase no cargan:
  - Verifica `.env` y que `app.config.ts` esté leyendo `EXPO_PUBLIC_*`.

## Contribución

- Estándar de código: TypeScript, componentes funcionales, hooks.
- Mantén estilos y patrones existentes; evita cambios no relacionados.
- Crea PRs pequeños, con descripción clara y pruebas manuales.

## Licencia

Este proyecto no especifica licencia en el repositorio. Consulta con el autor antes de redistribuir.