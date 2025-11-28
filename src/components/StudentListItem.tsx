// Ítem de lista/tarjeta para estudiantes.
// - Dos variantes: 'row' (lista) y 'tile' (tarjeta para grid/web).
// - Muestra avatar con iniciales, nombre, email (si disponible), progreso y estado.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkColors, lightColors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useConfig } from '../context/ConfigContext';

// Props del componente: datos del estudiante y callbacks.
type Props = {
  name: string;
  email?: string;
  progress?: number; // 0-100
  status?: string; // Activo/Inactivo
  classLabel?: string; // e.g. "A", "B"
  variant?: 'row' | 'tile';
  onPress?: () => void;
};

export default function StudentListItem({ name, email, progress = 0, status = 'Activo', classLabel = 'A', variant = 'row', onPress }: Props) {
  const { colors } = useTheme() as any;
  const { config } = useConfig();
  const palette = config.lightMode ? lightColors : darkColors;
  const isWeb = Platform.OS === 'web';
  const cardBg = isWeb
    ? (config.lightMode ? 'rgba(255,255,255,0.55)' : 'rgba(20,25,35,0.5)')
    : palette.card;
  const blurFx = isWeb ? ({ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' } as any) : {};
  // Genera iniciales a partir del nombre para el avatar.
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Variante 'tile': tarjeta con avatar, clase y barra de progreso.
  if (variant === 'tile') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.touch}>
        <View style={[styles.tileCard, { borderColor: palette.border, backgroundColor: cardBg, ...blurFx }] }>
          <View style={styles.tileAvatarWrap}>
            <View style={styles.tileAvatar}>
              <Text style={[styles.tileAvatarText, { color: palette.primary }]}>{initials}</Text>
            </View>
          </View>
          <View style={styles.tileInfo}>
            <Text style={[styles.tileName, { color: palette.text }]}>{name}</Text>
            <View style={styles.tileBadge}>
              <Text style={[styles.tileBadgeText, { color: palette.primary }]}>{`Class ${classLabel}`}</Text>
            </View>
            <View style={styles.progressBox}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: palette.mutedText }]}>Progreso</Text>
                <Text style={[styles.progressValue, { color: palette.primary }]}>{progress}%</Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: config.lightMode ? 'rgba(0,0,0,0.08)' : '#2A2F3A' }]}>
                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: palette.primary }]} />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Variante 'row': ítem de lista con email (opcional), progreso y estado.
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.touch}>
      <View style={[styles.card, { borderColor: palette.border, backgroundColor: cardBg, ...blurFx }] }>
        <View style={styles.left}>
          <View style={styles.avatar}>
            <Text style={[styles.avatarText, { color: palette.primary }]}>{initials}</Text>
          </View>
          <View style={styles.info}>
            <Text style={[styles.name, { color: palette.text }]}>{name}</Text>
            {!!email && <Text style={[styles.email, { color: palette.mutedText }]}>{email}</Text>}
            <View style={styles.progressBox}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: palette.mutedText }]}>Progreso</Text>
                <Text style={[styles.progressValue, { color: palette.primary }]}>{progress}%</Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: config.lightMode ? 'rgba(0,0,0,0.08)' : '#2A2F3A' }]}>
                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: palette.primary }]} />
              </View>
            </View>
          </View>
        </View>
        <View style={styles.right}>
          <View style={styles.statusBadge}>
            <Text style={[styles.statusText, { color: palette.text }]}>{status}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={palette.mutedText} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touch: { marginHorizontal: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(110,120,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontFamily: fonts.medium, fontSize: 12 },
  info: { flex: 1 },
  name: { fontFamily: fonts.medium, fontSize: 14 },
  email: { fontFamily: fonts.regular, fontSize: 12 },
  progressBox: { marginTop: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressLabel: { fontSize: 11 },
  progressValue: { fontFamily: fonts.bold, fontSize: 13 },
  progressBar: { height: 6, borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6 },
  right: { alignItems: 'flex-end', gap: 8 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(110,120,255,0.08)',
  },
  statusText: { fontSize: 10 },

  // Tile styles (web design)
  tileCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
  },
  tileAvatarWrap: { alignItems: 'center', justifyContent: 'center' },
  tileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(110,120,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tileAvatarText: { fontFamily: fonts.medium, fontSize: 16 },
  tileInfo: { width: '100%', alignItems: 'center' },
  tileName: { fontFamily: fonts.medium, fontSize: 14, textAlign: 'center' },
  tileBadge: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(110,120,255,0.3)',
    backgroundColor: 'rgba(110,120,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tileBadgeText: { fontSize: 10 },
});