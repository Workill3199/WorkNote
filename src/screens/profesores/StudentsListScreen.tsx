// Listado de estudiantes para profesores.
// Permite buscar, filtrar por clase/curso, navegar a perfil y registrar.
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform, useWindowDimensions, type DimensionValue } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { listStudents, Student, deleteStudent, listStudentsByCourse, listStudentsByWorkshop } from '../../services/students';
import { listCourses, Course } from '../../services/courses';
import NeonButton from '../../components/NeonButton';
import ScreenContainer from '../../components/ScreenContainer';
import StudentListItem from '../../components/StudentListItem';
import { fonts } from '../../theme/typography';
import { darkColors, lightColors } from '../../theme/colors';
import { useConfig } from '../../context/ConfigContext';

type Props = NativeStackScreenProps<any>;

export default function StudentsListScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const cols = width < 420 ? 1 : width < 768 ? 2 : 3;
  const itemWidth: DimensionValue = `${100 / cols}%`;
  const { colors } = useTheme() as any; // paleta del tema
  const { config } = useConfig();
  const palette = config.lightMode ? lightColors : darkColors;
  const isWeb = Platform.OS === 'web';
  const surface = isWeb ? (config.lightMode ? 'rgba(255,255,255,0.55)' : 'rgba(20,25,35,0.5)') : palette.card;
  const blurFx = isWeb ? ({ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' } as any) : {};
  const [items, setItems] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const filterCourseId = (route as any)?.params?.filterCourseId as string | undefined; // curso sugerido desde navegación

  // Carga/recarga del listado (considera filtros recibidos por ruta)
  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const filterCourseId = (route as any)?.params?.filterCourseId as string | undefined;
      const filterWorkshopId = (route as any)?.params?.filterWorkshopId as string | undefined;
      let data: Student[];
      if (filterCourseId) {
        data = await listStudentsByCourse(filterCourseId);
      } else if (filterWorkshopId) {
        data = await listStudentsByWorkshop(filterWorkshopId);
      } else {
        data = await listStudents();
      }
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar estudiantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Recargar al volver a enfocar la pantalla
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    // Cargar cursos para mostrar chips de filtro
    listCourses().then(setCourses).catch(() => setCourses([]));
  }, []);

  // Eliminar estudiante con confirmación y refrescar
  const onDelete = async (id?: string) => {
    if (!id) return;
    Alert.alert('Eliminar estudiante', '¿Seguro que deseas eliminarlo?', [
      { text: 'Cancelar' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await deleteStudent(id); load(); } },
    ]);
  };

  // Filtro en memoria: por texto (nombre/email) y curso seleccionado
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((s) => {
      const nameEmailMatch = (`${s.firstName} ${s.lastName ?? ''}`.toLowerCase().includes(q) || (s.email ?? '').toLowerCase().includes(q));
      const courseMatch = !selectedCourseId || (s.courseId ?? '') === selectedCourseId;
      return nameEmailMatch && courseMatch;
    });
  }, [items, query, selectedCourseId]);

  return (
    <ScreenContainer contentPadding={16}>
      {/* Header estilo dashboard: título + acciones rápidas */}
      <View style={[styles.header, { borderBottomColor: palette.border }] }>
        <Text style={[styles.title, { color: colors.text }]}>Estudiantes</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {!!filterCourseId && (
            <NeonButton
              title="Asistencia"
              onPress={() => navigation.navigate('Attendance', { filterCourseId })}
              colors={{ ...colors, primary: palette.success } as any}
              shadowRadius={12}
              elevation={6}
              style={[styles.addBtn, { backgroundColor: palette.success, marginRight: 8 }]}
              textStyle={styles.addText}
            />
          )}
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: palette.primary }]} onPress={() => navigation.navigate('StudentCreate')}> 
            <Text style={styles.addText}>+ Registrar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: surface, borderColor: palette.border },
            blurFx,
          ]}
        >
          <TextInput
            placeholder="Buscar por nombre o email"
            placeholderTextColor={palette.mutedText}
            value={query}
            onChangeText={setQuery}
            style={[styles.searchInput, { color: colors.text }]}
          />
      </View>
    </View>

      {/* Mini menú de clases (chips de filtro por curso) */}
      <View style={styles.filtersRow}>
        <TouchableOpacity onPress={() => setMenuOpen(v => !v)} style={[styles.chip, { borderColor: palette.border, backgroundColor: surface }, blurFx, menuOpen && { borderColor: palette.accent, backgroundColor: isWeb ? 'rgba(76,123,243,0.10)' : surface }]} activeOpacity={0.8}>
          <Text style={[styles.chipText, { color: palette.mutedText }, menuOpen && { color: colors.text }]}>{selectedCourseId ? (courses.find(c => c.id === selectedCourseId)?.title ?? 'Clase seleccionada') : 'Filtrar por clase'}</Text>
        </TouchableOpacity>
      </View>
      {menuOpen && (
        <View style={[styles.menu, { borderColor: palette.border, backgroundColor: surface }, blurFx]}> 
          <TouchableOpacity onPress={() => { setSelectedCourseId(''); setMenuOpen(false); }} style={[styles.menuItem, { borderColor: palette.border }]}>
            <Text style={[styles.menuText, { color: colors.text }]}>Todos</Text>
          </TouchableOpacity>
          {courses.map((c) => (
            <TouchableOpacity key={c.id} onPress={() => { setSelectedCourseId(c.id!); setMenuOpen(false); }} style={[styles.menuItem, { borderColor: palette.border }]}> 
              <Text style={[styles.menuText, { color: colors.text }]}>{c.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />}
      {!!error && <Text style={[styles.error, { color: palette.error }]}>{error}</Text>}

      {!loading && filtered.length === 0 && (
        <Text style={[styles.empty, { color: palette.mutedText }]}>No hay estudiantes que coincidan.</Text>
      )}

      {/* Grid en web, lista en móvil */}
      {!loading && (
        Platform.OS === 'web' ? (
          <View style={styles.grid}>
            {filtered.map((item) => (
              <View key={item.id} style={[styles.gridItem, { width: itemWidth }]}>
                <StudentListItem
                  name={`${item.firstName} ${item.lastName ?? ''}`.trim()}
                  email={item.email ?? ''}
                  progress={0}
                  status={'Activo'}
                  classLabel={(item.classLabel || 'A').toUpperCase()}
                  variant="tile"
                  onPress={() => navigation.navigate('UserProfile', { student: item })}
                />
              </View>
            ))}
          </View>
        ) : (
          <>
            {filtered.map((item) => (
              <StudentListItem
                key={item.id}
                name={`${item.firstName} ${item.lastName ?? ''}`.trim()}
                email={item.email ?? ''}
                progress={0}
                status={'Activo'}
                classLabel={(item.classLabel || 'A').toUpperCase()}
                onPress={() => navigation.navigate('UserProfile', { student: item })}
              />
            ))}
          </>
        )
      )}
    </ScreenContainer>
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
  searchRow: { marginTop: 12, marginBottom: 6 },
  searchBox: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { fontFamily: fonts.regular, fontSize: 14 },
  
  // Diseño: chips y grid
  filtersRow: { flexDirection: 'row', gap: 8 as any, marginBottom: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: {},
  chipText: { fontSize: 12 },
    chipTextActive: {},
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  gridItem: { width: '50%' as DimensionValue, paddingHorizontal: 4 },
  menu: { borderWidth: 1, borderRadius: 10, marginBottom: 8, overflow: 'hidden', maxHeight: 220 },
  menuItem: { paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1 },
  menuText: {},
  
});
