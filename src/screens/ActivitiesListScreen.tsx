import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { listActivities, Activity, deleteActivity, listActivitiesByCourse, listActivitiesByWorkshop } from '../services/activities';
import ManagementCard from '../components/ManagementCard';
import NeonButton from '../components/NeonButton';

type Props = NativeStackScreenProps<any>;

export default function ActivitiesListScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const filterCourseId = (route as any)?.params?.filterCourseId as string | undefined;
      const filterWorkshopId = (route as any)?.params?.filterWorkshopId as string | undefined;
      let data: Activity[];
      if (filterCourseId) {
        data = await listActivitiesByCourse(filterCourseId);
      } else if (filterWorkshopId) {
        data = await listActivitiesByWorkshop(filterWorkshopId);
      } else {
        data = await listActivities();
      }
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar actividades');
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
    Alert.alert('Eliminar actividad', '¿Seguro que deseas eliminarla?', [
      { text: 'Cancelar' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await deleteActivity(id); load(); } },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Actividades</Text>

        <NeonButton title="+ Agregar" onPress={() => navigation.navigate('ActivityCreate')} colors={colors} shadowRadius={12} elevation={6} style={styles.addBtn} textStyle={styles.addText} />
      </View>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />}
      {!!error && <Text style={[styles.error, { color: '#d32f2f' }]}>{error}</Text>}

      {!loading && items.length === 0 && (
        <Text style={[styles.empty, { color: colors.mutedText }]}>No hay actividades aún. Crea la primera.</Text>
      )}

      {!loading && items.map(item => (
        <ManagementCard
          key={item.id}
          title={item.title}
          details={[
            ...(item.description ? [{ icon: 'text-long', text: item.description }] : []),
            ...(item.category ? [{ icon: 'label-outline', text: `Categoría: ${item.category}` }] : []),
            ...(item.dueDate ? [{ icon: 'calendar-month', text: `Vence: ${new Date(item.dueDate).toLocaleDateString()}` }] : []),
            ...(item.courseId ? [{ icon: 'book-open-variant', text: `Curso: ${item.courseId}` }] : []),
            ...(item.workshopId ? [{ icon: 'hammer-wrench', text: `Taller: ${item.workshopId}` }] : []),
          ]}
          variant="activity"
          onEdit={() => navigation.navigate('ActivityCreate', { editItem: item })}
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