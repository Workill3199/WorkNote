import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkColors } from '../theme/colors';
import { fonts } from '../theme/typography';

type Props = {
  title: string;
  classroom?: string;
  schedule?: string;
  semester?: string;
  studentsCount?: number;
  variant?: 'row' | 'tile';
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShareCode?: () => void;
};

export default function CourseListItem({ title, classroom, schedule, semester, studentsCount = 0, variant = 'row', onPress, onEdit, onDelete, onShareCode }: Props) {
  const initials = title
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const badgeText = semester ? `Semestre ${semester}` : classroom ? `Aula ${classroom}` : undefined;

  if (variant === 'tile') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.touch}>
        <View style={styles.tileCard}>
          {(onEdit || onDelete || onShareCode) && (
            <View style={styles.tileActions}>
              {onEdit && (
                <TouchableOpacity onPress={onEdit} style={styles.actionIconBtn}>
                  <MaterialCommunityIcons name="pencil" size={14} color={darkColors.accent} />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity onPress={onDelete} style={styles.actionIconBtn}>
                  <MaterialCommunityIcons name="trash-can-outline" size={14} color="#d32f2f" />
                </TouchableOpacity>
              )}
              {onShareCode && (
                <TouchableOpacity onPress={onShareCode} style={styles.actionIconBtn}>
                  <MaterialCommunityIcons name="key" size={14} color={darkColors.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}
          <View style={styles.tileAvatarWrap}>
            <View style={styles.tileAvatar}>
              <MaterialCommunityIcons name="book-open-variant" size={28} color={darkColors.primary} />
            </View>
          </View>
          <View style={styles.tileInfo}>
            <Text style={styles.tileName}>{title}</Text>
            {!!badgeText && (
              <View style={styles.tileBadge}>
                <Text style={styles.tileBadgeText}>{badgeText}</Text>
              </View>
            )}
            <View style={styles.tileMeta}>
              {!!schedule && (
                <View style={styles.metaRow}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={darkColors.mutedText} />
                  <Text style={styles.metaText}>{schedule}</Text>
                </View>
              )}
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="account-group" size={14} color={darkColors.mutedText} />
                <Text style={styles.metaText}>{studentsCount} estudiantes</Text>
              </View>
            </View>

            {!!onShareCode && (
              <View style={styles.tileBottomRow}>
                <TouchableOpacity onPress={onShareCode}>
                  <View style={styles.tileBottomPill}>
                    <MaterialCommunityIcons name="key" size={14} color={darkColors.primary} />
                    <Text style={styles.tileBottomText}>Código</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.touch}>
      <View style={styles.card}>
        <View style={styles.left}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{title}</Text>
            <View style={styles.metaRow}>
              {!!badgeText && <Text style={styles.metaText}>{badgeText}</Text>}
            </View>
            {!!schedule && (
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={darkColors.mutedText} />
                <Text style={styles.metaText}>{schedule}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.right}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{studentsCount} alumnos</Text>
          </View>
          {(onEdit || onDelete) && (
            <View style={styles.rowActions}>
              {onEdit && (
                <TouchableOpacity onPress={onEdit}>
                  <MaterialCommunityIcons name="pencil" size={16} color={darkColors.accent} />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity onPress={onDelete}>
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color="#d32f2f" />
                </TouchableOpacity>
              )}
            </View>
          )}
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
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 as any, marginTop: 4 },
  metaText: { color: darkColors.mutedText, fontFamily: fonts.regular, fontSize: 12 },
  right: { alignItems: 'flex-end', gap: 8 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 as any },
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
    position: 'relative',
  },
  tileActions: { position: 'absolute', right: 8, top: 8, flexDirection: 'row', alignItems: 'center', gap: 8 as any },
  actionIconBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(110,120,255,0.12)' },
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
  tileMeta: { marginTop: 8, width: '100%', gap: 6 as any },
  tileBottomRow: { marginTop: 10, width: '100%', alignItems: 'center' },
  tileBottomPill: { flexDirection: 'row', alignItems: 'center', gap: 6 as any, borderWidth: 1, borderColor: 'rgba(110,120,255,0.3)', backgroundColor: 'rgba(110,120,255,0.12)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  tileBottomText: { color: darkColors.primary, fontFamily: fonts.medium, fontSize: 12 },
});