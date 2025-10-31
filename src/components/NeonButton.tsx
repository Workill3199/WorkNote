import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';

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