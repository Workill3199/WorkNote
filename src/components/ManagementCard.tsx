// Componente de tarjeta para gestionar elementos (cursos, talleres, actividades, estudiantes)
// Muestra título, detalles en chips, acciones (editar, eliminar) y atajos para ver estudiantes/actividades.
import React from 'react'; // Importa React para definir componentes
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native'; // Componentes básicos de UI de React Native
import { useTheme } from '@react-navigation/native'; // Hook para acceder al tema de navegación (colores, etc.)
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Iconos de la librería de Expo

// Estructura de una fila de detalle que se mostrará como chip
type DetailRow = { icon: string; text: string };

// Propiedades del componente
type Props = {
  title: string; // Título principal de la tarjeta
  details?: DetailRow[]; // Lista de detalles (chips informativos)
  onEdit?: () => void; // Acción al presionar editar
  onDelete?: () => void; // Acción al presionar eliminar
  onViewStudents?: () => void; // Acción para ver estudiantes asociados
  onViewActivities?: () => void; // Acción para ver actividades asociadas
  onViewShareCode?: () => void; // Acción para ver código de invitación/compartir
  variant?: 'course' | 'workshop' | 'activity' | 'student'; // Tipo de tarjeta para colorear acentos
};

export default function ManagementCard({ title, details = [], onEdit, onDelete, onViewStudents, onViewActivities, onViewShareCode, variant = 'course' }: Props) {
  const { colors } = useTheme(); // Obtiene colores del tema actual (light/dark)
  // Determina el color de acento según el tipo de tarjeta, con fallbacks por si el tema no define claves extra
  const accentColor = variant === 'course'
    ? colors.primary
    : variant === 'workshop'
      ? (colors as any).secondary
      : variant === 'activity'
        ? ((colors as any).purple || colors.primary)
        : (((colors as any).pink) || (colors as any).secondary || colors.primary);
  const initial = (title?.[0] || '•').toUpperCase(); // Inicial para avatar circular
  // Intenta encontrar un detalle que incluya la cantidad de estudiantes
  const studentsDetail = details.find(d => d.text?.toLowerCase().includes('estudiantes:'));
  const studentsCountMatch = studentsDetail?.text?.match(/(\d+)/); // Extrae número del texto
  const studentsCount = studentsCountMatch ? parseInt(studentsCountMatch[1], 10) : undefined; // Convierte a número
  return (
    // Tarjeta presionable con efecto de escala
    <Pressable style={({ pressed }) => [
      styles.card,
      { backgroundColor: colors.card, borderColor: colors.border, transform: [{ scale: pressed ? 0.99 : 1 }] },
    ]}>
      {/* Barra de acento a la izquierda */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      {/* Encabezado con avatar, título y acciones */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {/* Avatar redondo con inicial */}
          <View style={[styles.avatarBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          {/* Título de la tarjeta */}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>
        {/* Botones de acciones a la derecha */}
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

      {/* Sección de detalles en chips */}
      <View style={styles.detailsWrap}>
        {details.map((d, idx) => {
          const text = d.text || '';
          const chip = /^(Categoría|Vence|Semestre|Horario|Aula|Lugar)/i.test(text);
          return (
            <View key={idx} style={[styles.detailRow, chip ? [styles.detailChip, { borderColor: colors.border, backgroundColor: colors.background }] : null]}>
              <MaterialCommunityIcons name={d.icon as any} size={16} color={chip ? accentColor : ((colors as any).mutedText || colors.text)} />
              <Text style={[styles.detailText, { color: colors.text }]}>{text}</Text>
            </View>
          );
        })}
      </View>

      {!!studentsCount && (
        // Badge con cantidad de estudiantes
        <View style={[styles.counterBadge, { borderColor: colors.border, backgroundColor: colors.background }] }>
          <MaterialCommunityIcons name="account-group" size={14} color={accentColor} />
          <Text style={[styles.counterText, { color: colors.text }]}>{studentsCount} estudiantes</Text>
        </View>
      )}

      {(onViewStudents || onViewActivities || onViewShareCode) && (
        // Fila inferior con atajos
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
  // Estilos visuales de la tarjeta y sus secciones
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
  counterText: { fontSize: 12, fontWeight: '700' },
  bottomRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  bottomItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bottomPill: { borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  bottomText: { fontSize: 12, fontWeight: '700' },
});