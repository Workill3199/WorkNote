import React from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { darkColors } from '../theme/colors';

export default function TermsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkColors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: darkColors.text, marginBottom: 12 }}>
          Términos y Condiciones
        </Text>
        <View style={{ gap: 10 }}>
          <Text style={{ color: darkColors.mutedText }}>
            Al usar esta aplicación aceptas las condiciones de uso. Este texto es
            un placeholder y debería ser reemplazado por los términos legales
            reales de tu organización.
          </Text>
          <Text style={{ color: darkColors.mutedText }}>
            - Uso permitido: administración de cursos, talleres, estudiantes y actividades.
          </Text>
          <Text style={{ color: darkColors.mutedText }}>
            - Protección de datos: la app utiliza Firebase; tus datos se almacenan de forma segura.
          </Text>
          <Text style={{ color: darkColors.mutedText }}>
            - Responsabilidades: el usuario es responsable del contenido que registra.
          </Text>
          <Text style={{ color: darkColors.mutedText }}>
            Para más información, contacta soporte desde la pantalla de Perfil.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}