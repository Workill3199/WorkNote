import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fonts } from '../theme/typography';
import { darkColors, lightColors } from '../theme/colors';
import NeonButton from '../components/NeonButton';


type Props = NativeStackScreenProps<any>;

export default function LoginScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const palette = colors.background === darkColors.background ? darkColors : lightColors;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError('Completa email y contraseña');
      return;
    }
    if (!auth) {
      setError('Configurá Firebase en .env antes de iniciar sesión');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigation.replace('Main');
    } catch (e: any) {
      setError(e?.message ?? 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      {/* Logo superior */}
      <View style={styles.logoWrap}>
        <Image source={require('../../assets/logoN.png')} style={styles.logoImage} resizeMode="contain" />
      </View>

      {/* Marca */}
      <Text style={[styles.brand, { color: colors.text }]} accessibilityRole="header">WorkNote</Text>

      {/* Título y subtítulo */}
      <Text style={[styles.title, { color: colors.text }]}>Bienvenido de nuevo</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>Inicia sesión en tu espacio de trabajo</Text>

      {!!error && <Text style={[styles.error, { color: palette.error }]}>{error}</Text>}

      {/* Email */}
      <Text style={[styles.label, { color: colors.text }]}>Correo electrónico</Text>
      <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Ingresa tu correo electrónico"
          placeholderTextColor={colors.text}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Password */}
      <Text style={[styles.label, { color: colors.text }]}>Contraseña</Text>
      <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Ingresa tu contraseña"
          placeholderTextColor={colors.text}
          secureTextEntry={secure}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setSecure(s => !s)} accessibilityLabel={secure ? 'Mostrar contraseña' : 'Ocultar contraseña'}>
          <MaterialCommunityIcons name={secure ? 'eye-off' : 'eye'} size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.forgotRow} onPress={() => { /* TODO: screen de recuperación */ }}>
        <Text style={[styles.forgotText, { color: colors.text }]}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      {/* Botón principal */}
      <NeonButton title="Iniciar sesión" onPress={handleLogin} colors={colors} loading={loading} style={styles.button} textStyle={styles.buttonText} />

      {/* Registro */}
      <View style={styles.signupRow}>
        <Text style={[styles.signupText, { color: colors.text }]}>¿No tienes cuenta?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={[styles.signupLink, { color: colors.text }]}> Regístrate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoWrap: { alignItems: 'center', marginBottom: 12 },
  logoImage: { width: 72, height: 72 },
  brand: { fontSize: 24, fontFamily: fonts.brand, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontFamily: fonts.brand, textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: fonts.medium, textAlign: 'center', marginTop: 6, marginBottom: 18 },
  label: { fontSize: 13, fontFamily: fonts.medium, marginBottom: 8 },
  inputRow: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { flex: 1, fontSize: 16, fontFamily: fonts.regular, marginRight: 10 },
  forgotRow: { alignSelf: 'flex-end', marginBottom: 18 },
  forgotText: { fontSize: 14, fontFamily: fonts.medium },
  button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { fontSize: 16, fontFamily: fonts.bold },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupText: { fontSize: 14, fontFamily: fonts.medium },
  signupLink: { fontSize: 14, fontFamily: fonts.bold },
  error: { marginBottom: 12, textAlign: 'center', fontFamily: fonts.medium },
});