import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fonts } from '../theme/typography';
import { darkColors, lightColors } from '../theme/colors';
import NeonButton from '../components/NeonButton';
import { setLastSelectedRole } from '../utils/roles';

type Props = NativeStackScreenProps<any>;

export default function RegisterRoleScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const palette = colors.background === darkColors.background ? darkColors : lightColors;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }] }>
      {/* Logo superior */}
      <View style={styles.logoWrap}>
        <Image source={require('../../assets/logoA.png')} style={styles.logoImage} resizeMode="contain" />
      </View>
      <Text style={[styles.brand, { color: colors.text }]} accessibilityRole="header">WorkNote</Text>

      {/* Título y subtítulo */}
      <Text style={[styles.title, { color: colors.text }]}>Crear cuenta</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>Elige tu rol para continuar</Text>

      <View style={{ gap: 12, marginTop: 8 }}>
        <NeonButton
          title="Registrarse como Profesor"
          onPress={async () => { await setLastSelectedRole('profesor'); navigation.navigate('Register', { role: 'profesor' }); }}
          colors={{ ...colors, primary: palette.primary } as any}
          style={styles.button}
          textStyle={styles.buttonText}
        />
        <NeonButton
          title="Registrarse como Alumno"
          onPress={async () => { await setLastSelectedRole('alumno'); navigation.navigate('Register', { role: 'alumno' }); }}
          colors={{ ...colors, primary: palette.accent } as any}
          style={[styles.button]}
          textStyle={styles.buttonText}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 12 },
  logoImage: { width: 72, height: 72 },
  brand: { fontSize: 24, fontFamily: fonts.brand, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontFamily: fonts.brand, textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: fonts.medium, textAlign: 'center', marginTop: 6, marginBottom: 18 },
  button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 15, fontFamily: fonts.bold },
});