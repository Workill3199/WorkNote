import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { darkColors, lightColors } from '../theme/colors';
import { fonts } from '../theme/typography';
import NeonButton from '../components/NeonButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';

type Props = NativeStackScreenProps<any>;

export default function PortadaScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const palette = colors.background === darkColors.background ? darkColors : lightColors;
  const { config, setLightMode, save } = useConfig();
  const isWeb = (typeof window !== 'undefined');
  const onToggleTheme = async () => {
    setLightMode(!config.lightMode);
    await save();
    if (isWeb) {
      try { (document.documentElement as any).style.colorScheme = !config.lightMode ? 'light' : 'dark'; } catch {}
    }
  };

  const heroSource = config.lightMode ? require('../../assets/logoL.png') : require('../../assets/principal.png');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <View style={{ position: 'absolute', right: 16, top: 16 }}>
        <TouchableOpacity
          onPress={onToggleTheme}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 8 as any,
            paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
            borderWidth: 1, borderColor: colors.border,
            backgroundColor: (isWeb ? (config.lightMode ? 'rgba(255,255,255,0.7)' : 'rgba(42,42,58,0.7)') : colors.card),
            ...(isWeb ? ({ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } as any) : {}),
          }}
          accessibilityLabel={config.lightMode ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
        >
          <MaterialCommunityIcons name={config.lightMode ? 'moon-waxing-crescent' : 'white-balance-sunny'} size={18} color={colors.text} />
          <Text style={{ color: colors.text, fontFamily: fonts.medium, fontSize: 12 }}>{config.lightMode ? 'Oscuro' : 'Claro'}</Text>
        </TouchableOpacity>
      </View>
      {/* Logo y marca (igual al login) */}
      <View style={styles.logoWrap}>
        <Image source={heroSource} style={styles.heroImage} resizeMode="contain" />
      </View>
      <Text style={[styles.brand, { color: colors.text }]} accessibilityRole="header">WorkNote</Text>

      {/* Título y subtítulo con la misma tipografía */}
      <Text style={[styles.title, { color: colors.text }]}>Bienvenido a WorkNote</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>Elige cómo quieres empezar</Text>

      {/* Botón principal: mismo NeonButton que en Login */}
      <NeonButton
        title="Iniciar sesión"
        onPress={() => navigation.navigate('Login')}
        colors={{ ...colors, text: '#fff' }}
        style={styles.button}
        textStyle={[styles.buttonText, { color: '#fff' }]}
      />

      {/* Botón secundario con efecto neón usando success */}
      <NeonButton
        title="Crear cuenta"
        onPress={() => navigation.navigate('RegisterRole')}
        colors={{ ...colors, primary: palette.success }}
        style={styles.button}
        textStyle={styles.buttonText}
        shadowRadius={16}
        elevation={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 12 },
  heroImage: { width: 280, height: 280 },
  brand: { fontSize: 24, fontFamily: fonts.brand, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontFamily: fonts.brand, textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: fonts.medium, textAlign: 'center', marginTop: 6, marginBottom: 18 },
  button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 16, fontFamily: fonts.bold },
});