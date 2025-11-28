import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserRole } from '../services/users';
import { fonts } from '../theme/typography';

type Props = NativeStackScreenProps<any>;

// Pantalla de arranque: decide a dónde ir según sesión y rol cacheados
export default function BootstrapScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [ready, setReady] = React.useState(false);
  const readyRef = React.useRef(false);

  React.useEffect(() => {
    // Si no hay auth (Firebase sin configurar), ir a Portada y evitar crash
    if (!auth) {
      navigation.replace('Portada');
      setReady(true);
      readyRef.current = true;
      return;
    }
    // Fallback: si onAuthStateChanged no dispara (p.ej., restricciones del webview),
    // navegar a Portada tras un breve tiempo para evitar bloqueo del loader.
    const fallback = setTimeout(() => {
      if (!readyRef.current) {
        navigation.replace('Portada');
        setReady(true);
        readyRef.current = true;
      }
    }, 2500);

    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const role = await getUserRole();
          if (role === 'alumno') {
            navigation.replace('StudentMain');
          } else {
            navigation.replace('Main');
          }
        } else {
          navigation.replace('Portada');
        }
      } finally {
        setReady(true);
        readyRef.current = true;
        try { clearTimeout(fallback); } catch {}
      }
    });
    return () => {
      try { unsub(); } catch {}
      try { clearTimeout(fallback); } catch {}
    };
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.text, { color: colors.text }]}>Cargando tu sesión...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  text: {
    marginTop: 12,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
});