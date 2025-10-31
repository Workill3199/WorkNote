import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fonts } from '../../theme/typography';
import { darkColors, lightColors } from '../../theme/colors';
import NeonButton from '../../components/NeonButton';

type Props = NativeStackScreenProps<any>;

export default function RegisterScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const palette = colors.background === darkColors.background ? darkColors : lightColors;
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [secure, setSecure] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setError(null);
    if (!fullName || !email || !password || !confirm) {
      setError('Completa todos los campos');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!auth) {
      setError('Configurá Firebase en .env antes de registrarte');
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      navigation.replace('Main');
    } catch (e: any) {
      setError(e?.message ?? 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }] }>
      {/* Logo superior y marca (similar a Login) */}
      <View style={styles.logoWrap}>
        <Image source={require('../../../assets/logoN.png')} style={styles.logoImage} resizeMode="contain" />
      </View>
      <Text style={[styles.brand, { color: colors.text }]} accessibilityRole="header">WorkNote</Text>

      {/* Título y subtítulo */}
      <Text style={[styles.title, { color: colors.text }]}>Crear cuenta</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>Regístrate para empezar</Text>

      {!!error && <Text style={[styles.error, { color: palette.error }]}>{error}</Text>}

      {/* Nombre completo */}
      <Text style={[styles.label, { color: colors.text }]}>Nombre completo</Text>
      <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }] }>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Ingresa tu nombre completo"
          placeholderTextColor={colors.text}
          value={fullName}
          onChangeText={setFullName}
        />
      </View>

      {/* Correo electrónico */}
      <Text style={[styles.label, { color: colors.text }]}>Correo electrónico</Text>
      <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }] }>
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

      {/* Contraseña */}
      <Text style={[styles.label, { color: colors.text }]}>Contraseña</Text>
      <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }] }>
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

      {/* Confirmar contraseña */}
      <Text style={[styles.label, { color: colors.text }]}>Confirmar contraseña</Text>
      <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }] }>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Confirma tu contraseña"
          placeholderTextColor={colors.text}
          secureTextEntry={secureConfirm}
          value={confirm}
          onChangeText={setConfirm}
        />
        <TouchableOpacity onPress={() => setSecureConfirm(s => !s)} accessibilityLabel={secureConfirm ? 'Mostrar confirmación' : 'Ocultar confirmación'}>
          <MaterialCommunityIcons name={secureConfirm ? 'eye-off' : 'eye'} size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Botón */}
      <NeonButton title="Crear cuenta" onPress={handleRegister} colors={colors} loading={loading} style={styles.button} textStyle={styles.buttonText} />

      {/* Enlace login */}
      <View style={styles.loginRow}>
        <Text style={[styles.loginText, { color: colors.text }]}>¿Ya tienes cuenta?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.loginLink, { color: colors.text }]}> Iniciar sesión</Text>
        </TouchableOpacity>
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
  label: { fontSize: 13, fontFamily: fonts.medium, marginBottom: 8 },
  inputRow: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { flex: 1, fontSize: 16, fontFamily: fonts.regular, marginRight: 10 },
  button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 15, fontFamily: fonts.bold },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  loginText: { fontSize: 13, fontFamily: fonts.medium },
  loginLink: { fontSize: 13, fontFamily: fonts.bold },
  error: { marginBottom: 12, textAlign: 'center', fontFamily: fonts.medium },
});