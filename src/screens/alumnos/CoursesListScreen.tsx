import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { listCourses, Course, deleteCourse, joinCourseByShareCode } from '../../services/courses';
import { auth } from '../../config/firebase';
import { listStudentsByCourse } from '../../services/students';
import ManagementCard from '../../components/ManagementCard';
import CourseListItem from '../../components/CourseListItem';
import { darkColors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

type Props = NativeStackScreenProps<any>;

export default function CoursesListScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [items, setItems] = useState<Course[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await listCourses();
      setItems(data);
      const counts: Record<string, number> = {};
      await Promise.all(
        data.map(async (c) => {
          try {
            if (!c.id) return;
            const arr = await listStudentsByCourse(c.id);
            counts[c.id] = arr.length;
          } catch {
            if (c.id) counts[c.id] = 0;
          }
        })
      );
      setStudentCounts(counts);
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

  const onDelete = async (id?: string) => {
    if (!id) return;
    Alert.alert('Eliminar curso', '¿Seguro que deseas eliminarlo?', [
      { text: 'Cancelar' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await deleteCourse(id); load(); } },
    ]);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((c) => {
      const textMatch = (
        (c.title ?? '').toLowerCase().includes(q) ||
        (c.classroom ?? '').toLowerCase().includes(q) ||
        (c.schedule ?? '').toLowerCase().includes(q)
      );
      return textMatch;
    });
  }, [items, query]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      {/* Header estilo dashboard */}
      <View style={[styles.header, { borderBottomColor: darkColors.border }] }>
        <Text style={[styles.title, { color: colors.text }]}>Cursos</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: darkColors.accent }]} onPress={() => setJoinOpen(v => !v)}> 
            <Text style={styles.addText}>Unirme</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Unirse a clase por código */}
      {joinOpen && (
        <View style={styles.joinRow}>
          <View
            style={[
              styles.joinBox,
              Platform.OS === 'web'
                ? ({ backgroundColor: 'rgba(20,25,35,0.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' } as any)
                : { backgroundColor: darkColors.card },
            ]}
          >
            <TextInput
              placeholder="Código de clase (ABC123)"
              placeholderTextColor={darkColors.mutedText}
              value={joinCode}
              onChangeText={setJoinCode}
              style={styles.joinInput}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.joinBtn, { backgroundColor: darkColors.accent }]}
              onPress={async () => {
                if (!joinCode.trim()) return;
                setJoining(true);
                try {
                  const course = await joinCourseByShareCode(joinCode.trim());
                  if (!course) {
                    Alert.alert('Código inválido', 'No se encontró un curso con ese código.');
                  } else {
                    Alert.alert('Listo', `Te uniste a "${course.title}"`);
                    setJoinCode('');
                    await load();
                  }
                } catch (e: any) {
                  Alert.alert('Error', e?.message ?? 'No se pudo unir a la clase');
                } finally {
                  setJoining(false);
                }
              }}
              disabled={joining}
            >
              <Text style={styles.addText}>{joining ? '...' : 'Unirme'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Barra de búsqueda */}
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchBox,
            Platform.OS === 'web'
              ? ({ backgroundColor: 'rgba(20,25,35,0.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' } as any)
              : { backgroundColor: darkColors.card },
          ]}
        >
          <TextInput
            placeholder="Buscar por título, aula u horario"
            placeholderTextColor={darkColors.mutedText}
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Filtros de semestre removidos según solicitud */}

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />}
      {!!error && <Text style={[styles.error, { color: '#d32f2f' }]}>{error}</Text>}

      {!loading && filtered.length === 0 && (
        <Text style={[styles.empty, { color: colors.mutedText }]}>No hay cursos aún. Crea el primero.</Text>
      )}
      {/* Grid en web, lista en móvil (mantiene acciones) */}
      {!loading && (
        Platform.OS === 'web' ? (
          <View style={styles.grid}>
            {filtered.map((item) => (
              <View key={item.id} style={styles.gridItem}>
                <CourseListItem
                  title={item.title}
                  classroom={item.classroom}
                  schedule={item.schedule}
                  semester={item.semester}
                  studentsCount={studentCounts[item.id! ] || 0}
                  variant="tile"
                  onPress={() => navigation.navigate('Actividades', { filterCourseId: item.id })}
                  {...(item.ownerId === (auth?.currentUser?.uid || '') ? {
                    onEdit: () => navigation.navigate('CourseCreate', { editItem: item }),
                    onDelete: () => onDelete(item.id),
                  } : {})}
                />
              </View>
            ))}
          </View>
        ) : (
          <>
            {filtered.map(item => (
              <ManagementCard
                key={item.id}
                title={item.title}
                details={[
                  ...(item.classroom ? [{ icon: 'map-marker', text: `Aula: ${item.classroom}` }] : []),
                  ...(item.schedule ? [{ icon: 'clock-outline', text: `Horario: ${item.schedule}` }] : []),
                  ...(item.semester ? [{ icon: 'calendar-blank', text: `Semestre: ${item.semester}` }] : []),
                  { icon: 'account-group', text: `Estudiantes: ${studentCounts[item.id! ] || 0}` },
                ]}
                variant="course"
                onEdit={() => navigation.navigate('CourseCreate', { editItem: item })}
                onDelete={() => onDelete(item.id)}
                onViewStudents={() => navigation.navigate('StudentStudents', { filterCourseId: item.id })}
                onViewActivities={() => navigation.navigate('Actividades', { filterCourseId: item.id })}
              />
            ))}
          </>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottomWidth: 1 },
  title: { fontSize: 18, fontFamily: fonts.bold },
  addBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addText: { color: '#fff', fontWeight: '700' },
  error: { marginTop: 8, textAlign: 'center' },
  empty: { marginTop: 12, textAlign: 'center' },
  row: { borderWidth: 1, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  joinRow: { marginTop: 12, marginBottom: 6 },
  joinBox: { borderWidth: 1, borderColor: darkColors.border, borderRadius: 12, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  joinInput: { flex: 1, color: '#fff', fontFamily: fonts.regular, fontSize: 14 },
  joinBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  searchRow: { marginTop: 12, marginBottom: 6 },
  searchBox: { borderWidth: 1, borderColor: darkColors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { color: '#fff', fontFamily: fonts.regular, fontSize: 14 },

  // Diseño: chips y grid
  // filtros de semestre removidos
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  gridItem: { width: '50%', paddingHorizontal: 4 },
});
