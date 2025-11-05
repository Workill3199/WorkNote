// Botón con estilo "neón" reutilizable.
// - Muestra sombra y borde con el color principal del tema.
// - Soporta estados de carga (spinner) y disabled.
// - Permite personalizar radio de sombra y elevación.
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';

// Props del botón: texto, acción, colores y opciones visuales.
type Props = {
  title: string;
  onPress: () => void;
  colors: any;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  shadowRadius?: number;
  elevation?: number;
};

export default function NeonButton({ title, onPress, colors, loading = false, disabled = false, style, textStyle, shadowRadius, elevation }: Props) {
  // Controla la intensidad de la sombra y la elevación; con valores por defecto.
  const radius = shadowRadius ?? 14;
  const elev = elevation ?? 8;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          backgroundColor: colors.primary,
          borderWidth: 2,
          borderColor: colors.primary,
          shadowColor: colors.primary,
          shadowOpacity: 0.9,
          shadowRadius: radius,
          shadowOffset: { width: 0, height: 0 },
          elevation: elev,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 10,
          alignItems: 'center',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text || '#fff'} />
      ) : (
        <Text style={[{ color: colors.text || '#fff', fontWeight: '600' }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}