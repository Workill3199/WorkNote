import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type DetailRow = { icon: string; text: string };

type Props = {
  title: string;
  details?: DetailRow[];
  onEdit?: () => void;
  onDelete?: () => void;
  onViewStudents?: () => void;
  onViewActivities?: () => void;
  onViewShareCode?: () => void;
  variant?: 'course' | 'workshop' | 'activity' | 'student';
};

export default function ManagementCard({ title, details = [], onEdit, onDelete, onViewStudents, onViewActivities, onViewShareCode, variant = 'course' }: Props) {
  const { colors } = useTheme();
  const accentColor = variant === 'course'
    ? colors.primary
    : variant === 'workshop'
      ? colors.secondary
      : variant === 'activity'
        ? (colors as any).purple || colors.primary
        : (colors as any).pink || colors.secondary;
  const initial = (title?.[0] || '•').toUpperCase();
  const studentsDetail = details.find(d => d.text?.toLowerCase().includes('estudiantes:'));
  const studentsCountMatch = studentsDetail?.text?.match(/(\d+)/);
  const studentsCount = studentsCountMatch ? parseInt(studentsCountMatch[1], 10) : undefined;
  return (
    <Pressable style={({ pressed }) => [
      styles.card,
      { backgroundColor: colors.card, borderColor: colors.border, transform: [{ scale: pressed ? 0.99 : 1 }] },
    ]}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatarBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>
        <View style={styles.actionsRight}>
          {!!onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
              <MaterialCommunityIcons name="pencil" size={18} color={accentColor} />
            </TouchableOpacity>
          )}
          {!!onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.iconBtn}>
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.detailsWrap}>
        {details.map((d, idx) => {
          const text = d.text || '';
          const chip = /^(Categoría|Vence|Semestre|Horario|Aula|Lugar)/i.test(text);
          return (
            <View key={idx} style={[styles.detailRow, chip ? [styles.detailChip, { borderColor: colors.border, backgroundColor: colors.background }] : null]}>
              <MaterialCommunityIcons name={d.icon as any} size={16} color={chip ? accentColor : colors.mutedText} />
              <Text style={[styles.detailText, { color: colors.text }]}>{text}</Text>
            </View>
          );
        })}
      </View>

      {!!studentsCount && (
        <View style={[styles.counterBadge, { borderColor: colors.border, backgroundColor: colors.background }] }>
          <MaterialCommunityIcons name="account-group" size={14} color={accentColor} />
          <Text style={[styles.counterText, { color: colors.text }]}>{studentsCount} estudiantes</Text>
        </View>
      )}

      {(onViewStudents || onViewActivities || onViewShareCode) && (
        <View style={styles.bottomRow}>
          {!!onViewStudents && (
            <TouchableOpacity onPress={onViewStudents}>
              <View style={[styles.bottomItem, styles.bottomPill, { borderColor: colors.border, backgroundColor: colors.background }]}> 
                <MaterialCommunityIcons name="account-group" size={16} color={accentColor} />
                <Text style={[styles.bottomText, { color: accentColor }]}>Ver Estudiantes</Text>
              </View>
            </TouchableOpacity>
          )}
          {!!onViewActivities && (
            <TouchableOpacity onPress={onViewActivities}>
              <View style={[styles.bottomItem, styles.bottomPill, { borderColor: colors.border, backgroundColor: colors.background }]}> 
                <MaterialCommunityIcons name="calendar-month" size={16} color={accentColor} />
                <Text style={[styles.bottomText, { color: accentColor }]}>Ver Actividades</Text>
              </View>
            </TouchableOpacity>
          )}
          {!!onViewShareCode && (
            <TouchableOpacity onPress={onViewShareCode}>
              <View style={[styles.bottomItem, styles.bottomPill, { borderColor: colors.border, backgroundColor: colors.background }]}> 
                <MaterialCommunityIcons name="key" size={16} color={accentColor} />
                <Text style={[styles.bottomText, { color: accentColor }]}>Código</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 12, position: 'relative',
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  accentGlow: { position: 'absolute', left: 12, top: -10, width: 120, height: 120, borderRadius: 60, opacity: 0.06 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  title: { fontSize: 20, fontWeight: '800' },
  actionsRight: { flexDirection: 'row', gap: 8 },
  iconBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  detailsWrap: { marginTop: 12, gap: 8, flexDirection: 'row', flexWrap: 'wrap' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 8 },
  detailChip: { borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  detailText: { fontSize: 13, fontWeight: '500' },
  counterBadge: { marginTop: 10, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  bottomRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  bottomItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bottomPill: { borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  bottomText: { fontSize: 12, fontWeight: '700' },
});