import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { listCourses, Course, deleteCourse } from '../services/courses';
import { listStudents, Student } from '../services/students';
import ManagementCard from '../components/ManagementCard';

type Props = NativeStackScreenProps<any>;

export default function CoursesListScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [items, setItems] = useState<Course[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await listCourses();
      setItems(data);
      const students = await listStudents();
      const counts: Record<string, number> = {};
      students.forEach(s => { const k = s.courseId || ''; if (k) counts[k] = (counts[k] || 0) + 1; });
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Cursos</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('CourseCreate')}> 
          <Text style={styles.addText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />}
      {!!error && <Text style={[styles.error, { color: '#d32f2f' }]}>{error}</Text>}

      {!loading && items.length === 0 && (
        <Text style={[styles.empty, { color: colors.mutedText }]}>No hay cursos aún. Crea el primero.</Text>
      )}

      {!loading && items.map(item => (
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
          onViewStudents={() => navigation.navigate('StudentsList', { filterCourseId: item.id })}
          onViewActivities={() => navigation.navigate('ActivitiesList', { filterCourseId: item.id })}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  addBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addText: { color: '#fff', fontWeight: '700' },
  error: { marginTop: 8, textAlign: 'center' },
  empty: { marginTop: 12, textAlign: 'center' },
  row: { borderWidth: 1, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', marginTop: 8 },
});