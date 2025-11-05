// Ítem de lista/tarjeta para estudiantes.
// - Dos variantes: 'row' (lista) y 'tile' (tarjeta para grid/web).
// - Muestra avatar con iniciales, nombre, email (si disponible), progreso y estado.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkColors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { Platform } from 'react-native';

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
        <View style={styles.tileCard}>
          <View style={styles.tileAvatarWrap}>
            <View style={styles.tileAvatar}>
              <Text style={styles.tileAvatarText}>{initials}</Text>
            </View>
          </View>
          <View style={styles.tileInfo}>
            <Text style={styles.tileName}>{name}</Text>
            <View style={styles.tileBadge}>
              <Text style={styles.tileBadgeText}>{`Class ${classLabel}`}</Text>
            </View>
            <View style={styles.progressBox}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progreso</Text>
                <Text style={styles.progressValue}>{progress}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
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
      <View style={styles.card}>
        <View style={styles.left}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{name}</Text>
            {!!email && <Text style={styles.email}>{email}</Text>}
            <View style={styles.progressBox}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progreso</Text>
                <Text style={styles.progressValue}>{progress}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
            </View>
          </View>
        </View>
        <View style={styles.right}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={darkColors.mutedText} />
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
    borderColor: darkColors.border,
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    backgroundColor: Platform.OS === 'web' ? 'rgba(20,25,35,0.5)' : darkColors.card,
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' } as any)
      : {}),
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
  avatarText: { color: darkColors.primary, fontFamily: fonts.medium, fontSize: 12 },
  info: { flex: 1 },
  name: { color: '#fff', fontFamily: fonts.medium, fontSize: 14 },
  email: { color: darkColors.mutedText, fontFamily: fonts.regular, fontSize: 12 },
  progressBox: { marginTop: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressLabel: { color: darkColors.mutedText, fontSize: 11 },
  progressValue: { color: darkColors.primary, fontFamily: fonts.bold, fontSize: 13 },
  progressBar: { height: 6, backgroundColor: '#2A2F3A', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: darkColors.primary, borderRadius: 6 },
  right: { alignItems: 'flex-end', gap: 8 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkColors.border,
    backgroundColor: 'rgba(110,120,255,0.08)',
  },
  statusText: { color: '#fff', fontSize: 10 },

  // Tile styles (web design)
  tileCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: darkColors.border,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    backgroundColor: Platform.OS === 'web' ? 'rgba(20,25,35,0.5)' : darkColors.card,
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' } as any)
      : {}),
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
  tileAvatarText: { color: darkColors.primary, fontFamily: fonts.medium, fontSize: 16 },
  tileInfo: { width: '100%', alignItems: 'center' },
  tileName: { color: '#fff', fontFamily: fonts.medium, fontSize: 14, textAlign: 'center' },
  tileBadge: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(110,120,255,0.3)',
    backgroundColor: 'rgba(110,120,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tileBadgeText: { color: darkColors.primary, fontSize: 10 },
});