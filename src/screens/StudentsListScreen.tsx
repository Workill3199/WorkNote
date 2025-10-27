import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { listStudents, Student, deleteStudent, listStudentsByCourse, listStudentsByWorkshop } from '../services/students';
import ManagementCard from '../components/ManagementCard';

type Props = NativeStackScreenProps<any>;

export default function StudentsListScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const [items, setItems] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

  const onDelete = async (id?: string) => {
    if (!id) return;
    Alert.alert('Eliminar estudiante', '¿Seguro que deseas eliminarlo?', [
      { text: 'Cancelar' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await deleteStudent(id); load(); } },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Estudiantes</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('StudentCreate')}> 
          <Text style={styles.addText}>+ Registrar</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />}
      {!!error && <Text style={[styles.error, { color: '#d32f2f' }]}>{error}</Text>}

      {!loading && items.length === 0 && (
        <Text style={[styles.empty, { color: colors.mutedText }]}>No hay estudiantes aún. Registra el primero.</Text>
      )}

      {!loading && items.map(item => (
        <ManagementCard
          key={item.id}
          title={`${item.firstName} ${item.lastName ?? ''}`.trim()}
          details={[
            ...(item.email ? [{ icon: 'email-outline', text: item.email }] : []),
            ...(item.courseId ? [{ icon: 'book-open-variant', text: `Curso: ${item.courseId}` }] : []),
            ...(item.workshopId ? [{ icon: 'hammer-wrench', text: `Taller: ${item.workshopId}` }] : []),
          ]}
          variant="student"
          onEdit={() => navigation.navigate('StudentCreate', { editItem: item })}
          onDelete={() => onDelete(item.id)}
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