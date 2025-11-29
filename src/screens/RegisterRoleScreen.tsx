// Pantalla de selección de rol (raíz).
// Permite elegir entre Profesor o Alumno y navega al registro.
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fonts } from '../theme/typography';
import { darkColors, lightColors } from '../theme/colors';
import NeonButton from '../components/NeonButton';
import ScreenContainer from '../components/ScreenContainer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';

type Props = NativeStackScreenProps<any>;

export default function RegisterRoleScreen({ navigation }: Props) {
  const { colors } = useTheme(); // colores del tema
  const palette = colors.background === darkColors.background ? darkColors : lightColors;
  const { config, setLightMode, save } = useConfig();
  const isWeb = (typeof window !== 'undefined');
  const onToggleTheme = async () => {
    setLightMode(!config.lightMode);
    await save();
    if (isWeb) {
      try {
        if (typeof document !== 'undefined') {
          (document.documentElement as any).style.colorScheme = !config.lightMode ? 'light' : 'dark';
        }
      } catch {}
    }
  };

  return (
    <ScreenContainer center contentPadding={24}>
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
      <View style={styles.logoWrap}>
        <Image source={require('../../assets/logoA.png')} style={styles.logoImage} resizeMode="contain" />
      </View>
      <Text style={[styles.brand, { color: colors.text }]} accessibilityRole="header">WorkNote</Text>

      {/* Título y subtítulo */}
      <Text style={[styles.title, { color: colors.text }]}>Crear cuenta</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>Elige tu rol para continuar</Text>

      <View style={{ gap: 12, marginTop: 8 }}>
        {/* Acción: ir a registro como profesor */}
        <NeonButton
          title="Registrarse como Profesor"
          onPress={async () => { navigation.navigate('Register', { role: 'profesor' }); }}
          colors={{ ...colors, primary: palette.primary } as any}
          style={styles.button}
          textStyle={styles.buttonText}
        />
        {/* Acción: ir a registro como alumno */}
        <NeonButton
          title="Registrarse como Alumno"
          onPress={async () => { navigation.navigate('Register', { role: 'alumno' }); }}
          colors={{ ...colors, primary: palette.accent } as any}
          style={[styles.button]}
          textStyle={styles.buttonText}
        />
      </View>
    </ScreenContainer>
  );
}

// Estilos base consistentes con el tema
const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16 },
  logoWrap: { alignItems: 'center', marginBottom: 12 },
  logoImage: { width: 72, height: 72 },
  brand: { fontSize: 24, fontFamily: fonts.brand, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontFamily: fonts.brand, textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: fonts.medium, textAlign: 'center', marginTop: 6, marginBottom: 12 },
  button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 15, fontFamily: fonts.bold },
});
