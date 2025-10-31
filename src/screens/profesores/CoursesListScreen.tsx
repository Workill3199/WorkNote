// Pantalla de listado de cursos para profesores.
// Permite buscar, unirse por código, crear, editar y eliminar cursos.
import React, { useEffect, useMemo, useState } from 'react'; // React y hooks básicos
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform } from 'react-native'; // Componentes RN
import { useTheme } from '@react-navigation/native'; // Acceso a colores del tema
import { NativeStackScreenProps } from '@react-navigation/native-stack'; // Tipos de navegación
import { listCourses, Course, deleteCourse, joinCourseByShareCode, ensureCourseShareCode } from '../../services/courses'; // Servicios de cursos
import { auth } from '../../config/firebase'; // Autenticación (para verificar dueño de curso)
import { listStudentsByCourse } from '../../services/students'; // Servicio para contar estudiantes por curso
import ManagementCard from '../../components/ManagementCard'; // Tarjeta para móvil
import CourseListItem from '../../components/CourseListItem'; // Item para grid web
import { darkColors } from '../../theme/colors'; // Paleta fija
import { fonts } from '../../theme/typography'; // Tipografías

// Tipos de props de navegación
type Props = NativeStackScreenProps<any>;

export default function CoursesListScreen({ navigation }: Props) {
  const { colors } = useTheme(); // Colores del tema
  const [items, setItems] = useState<Course[]>([]); // Lista de cursos
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({}); // Conteos por curso
  const [loading, setLoading] = useState(true); // Indicador de carga
  const [error, setError] = useState<string | null>(null); // Mensaje de error
  const [query, setQuery] = useState(''); // Texto de búsqueda
  const [joinOpen, setJoinOpen] = useState(false); // UI: fila para unirse por código
  const [joinCode, setJoinCode] = useState(''); // Código ingresado
  const [joining, setJoining] = useState(false); // Indicador de operación de unión

  // Carga cursos y calcula cantidad de estudiantes por curso
  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await listCourses(); // Obtiene cursos
      setItems(data);
      const counts: Record<string, number> = {}; // Mapa de conteos
      await Promise.all(
        data.map(async (c) => {
          try {
            if (!c.id) return; // Ignora sin ID
            const arr = await listStudentsByCourse(c.id); // Lista estudiantes del curso
            counts[c.id] = arr.length; // Guarda conteo
          } catch {
            if (c.id) counts[c.id] = 0; // Fallback ante error
          }
        })
      );
      setStudentCounts(counts); // Actualiza mapa de conteos
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar cursos'); // Muestra error
    } finally {
      setLoading(false);
    }
  };

  // Recarga cursos cada vez que la pantalla gana foco
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

  // Elimina un curso y recarga lista
  const onDelete = async (id?: string) => {
    if (!id) return;
    Alert.alert('Eliminar curso', '¿Seguro que deseas eliminarlo?', [
      { text: 'Cancelar' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await deleteCourse(id); load(); } },
    ]);
  };

  // Filtra cursos por texto (título, aula u horario)
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
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: darkColors.primary }]} onPress={() => navigation.navigate('CourseCreate')}> 
            <Text style={styles.addText}>+ Agregar</Text>
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
        <Text style={[styles.empty, { color: (colors as any).mutedText || colors.text }]}>No hay cursos aún. Crea el primero.</Text>
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
                  onPress={() => navigation.navigate('Activities', { filterCourseId: item.id })}
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
                onViewStudents={() => navigation.navigate('Students', { filterCourseId: item.id })}
                onViewActivities={() => navigation.navigate('Activities', { filterCourseId: item.id })}
              />
            ))}
          </>
        )
      )}
    </View>
  );
}

// Estilos visuales del listado de cursos
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 }, // Contenedor principal
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottomWidth: 1 }, // Encabezado
  title: { fontSize: 18, fontFamily: fonts.bold }, // Título
  addBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }, // Botón de acción
  addText: { color: '#fff', fontWeight: '700' }, // Texto de botón
  error: { marginTop: 8, textAlign: 'center' }, // Mensaje de error
  empty: { marginTop: 12, textAlign: 'center' }, // Mensaje de vacío
  row: { borderWidth: 1, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', marginTop: 8 }, // Fila genérica
  joinRow: { marginTop: 12, marginBottom: 6 }, // Fila de unión por código
  joinBox: { borderWidth: 1, borderColor: darkColors.border, borderRadius: 12, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }, // Caja de unión
  joinInput: { flex: 1, color: '#fff', fontFamily: fonts.regular, fontSize: 14 }, // Input de código
  joinBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }, // Botón de unión
  searchRow: { marginTop: 12, marginBottom: 6 }, // Fila de búsqueda
  searchBox: { borderWidth: 1, borderColor: darkColors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }, // Caja de búsqueda
  searchInput: { color: '#fff', fontFamily: fonts.regular, fontSize: 14 }, // Input de búsqueda

  // Diseño: chips y grid
  // filtros de semestre removidos
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }, // Grid web
  gridItem: { width: '50%', paddingHorizontal: 4 }, // Item half-width
});
  const viewShareCode = async (courseId?: string) => {
    if (!courseId) return;
    try {
      const code = await ensureCourseShareCode(courseId);
      Alert.alert(
        'Código de clase',
        `Comparte este código para unirse: ${code}`,
        [
          { text: 'Copiar', onPress: async () => { try { if (Platform.OS === 'web') { await (navigator as any)?.clipboard?.writeText?.(code); } } catch {} } },
          { text: 'Cerrar' },
        ]
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo obtener el código de la clase');
    }
  };
