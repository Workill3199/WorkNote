// Listado de talleres para profesores.
// Muestra conteos de estudiantes, permite crear/editar y eliminar.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { listWorkshops, Workshop, deleteWorkshop } from '../../services/workshops';
import { listStudents, Student } from '../../services/students';
import ManagementCard from '../../components/ManagementCard';

type Props = NativeStackScreenProps<any>;

export default function WorkshopsListScreen({ navigation }: Props) {
  const { colors } = useTheme(); // paleta de colores del tema
  const [items, setItems] = useState<Workshop[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carga talleres y calcula estudiantes por taller
  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await listWorkshops();
      setItems(data);
      const students = await listStudents();
      const counts: Record<string, number> = {};
      students.forEach(s => { const k = s.workshopId || ''; if (k) counts[k] = (counts[k] || 0) + 1; });
      setStudentCounts(counts);
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar talleres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Recarga al enfocarse la pantalla
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

  // Eliminar taller con confirmación y refrescar
  const onDelete = async (id?: string) => {
    if (!id) return;
    Alert.alert('Eliminar taller', '¿Seguro que deseas eliminarlo?', [
      { text: 'Cancelar' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await deleteWorkshop(id); load(); } },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Talleres</Text>
        {/* Acción para crear taller */}
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('WorkshopCreate')}> 
          <Text style={styles.addText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />}
      {!!error && <Text style={[styles.error, { color: '#d32f2f' }]}>{error}</Text>}

      {!loading && items.length === 0 && (
        // En el tema por defecto de React Navigation no existe 'mutedText'.
        // Usamos una aproximación segura: si el tema extendido provee 'mutedText'
        // la usamos; de lo contrario caemos a 'colors.text'.
        <Text style={[styles.empty, { color: (colors as any).mutedText || colors.text }]}>No hay talleres aún. Crea el primero.</Text>
      )}

      {/* Lista de talleres */}
      {!loading && items.map(item => (
        <ManagementCard
          key={item.id}
          title={item.title}
          details={[
            ...(item.location ? [{ icon: 'map-marker', text: `Lugar: ${item.location}` }] : []),
            ...(item.schedule ? [{ icon: 'clock-outline', text: `Horario: ${item.schedule}` }] : []),
            { icon: 'account-group', text: `Estudiantes: ${studentCounts[item.id! ] || 0}` },
          ]}
          variant="workshop"
          onEdit={() => navigation.navigate('WorkshopCreate', { editItem: item })}
          onDelete={() => onDelete(item.id)}
          onViewStudents={() => navigation.navigate('Students', { filterWorkshopId: item.id })}
          onViewActivities={() => navigation.navigate('Activities', { filterWorkshopId: item.id })}
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
