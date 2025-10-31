import React from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { darkColors } from '../theme/colors';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkColors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: darkColors.text, marginBottom: 12 }}>
          Política de Privacidad
        </Text>
        <View style={{ gap: 10 }}>
          <Text style={{ color: darkColors.mutedText }}>
            Esta política describe cómo se recopilan y usan los datos.
            Placeholder a reemplazar por el texto legal de tu organización.
          </Text>
          <Text style={{ color: darkColors.mutedText }}>
            - Datos de usuario: nombre, correo y foto de perfil.
          </Text>
          <Text style={{ color: darkColors.mutedText }}>
            - Telemetría opcional: diagnósticos si habilitas "Enviar datos de diagnóstico".
          </Text>
          <Text style={{ color: darkColors.mutedText }}>
            - Control de visibilidad: puedes excluir tu cuenta de búsquedas.
          </Text>
          <Text style={{ color: darkColors.mutedText }}>
            Para ejercer derechos de acceso/rectificación, contacta soporte desde Perfil.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}