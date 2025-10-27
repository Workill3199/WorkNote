import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createActivity, updateActivity, Activity } from '../services/activities';

type Props = NativeStackScreenProps<any>;

export default function ActivityCreateScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const editItem = (route as any)?.params?.editItem as Activity | undefined;
  const [title, setTitle] = useState(editItem?.title || '');
  const [description, setDescription] = useState(editItem?.description || '');
  const [dueDate, setDueDate] = useState(editItem?.dueDate ? new Date(editItem.dueDate).toISOString().slice(0,10) : '');
  const [category, setCategory] = useState(editItem?.category || '');
  const [courseId, setCourseId] = useState(editItem?.courseId || '');
  const [workshopId, setWorkshopId] = useState(editItem?.workshopId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setError(null);
    if (!title.trim()) { setError('El título es obligatorio'); return; }
    setLoading(true);
    try {
      const due = dueDate ? new Date(dueDate).toISOString() : undefined;
      if (editItem?.id) {
        await updateActivity(editItem.id, { title: title.trim(), description: description.trim(), dueDate: due, category: category.trim(), courseId: courseId.trim() || undefined, workshopId: workshopId.trim() || undefined });
      } else {
        await createActivity({ title: title.trim(), description: description.trim(), dueDate: due, category: category.trim(), courseId: courseId.trim() || undefined, workshopId: workshopId.trim() || undefined });
      }
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message ?? (editItem?.id ? 'Error al actualizar actividad' : 'Error al crear actividad'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <Text style={[styles.title, { color: colors.text }]}>{editItem?.id ? 'Editar Actividad' : 'Nueva Actividad'}</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }] }>
        <Text style={[styles.label, { color: colors.text }]}>Título</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Ingresa el título de la actividad"
          placeholderTextColor={colors.text}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { color: colors.text }]}>Descripción</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, height: 100 }]}
          placeholder="Describe la actividad"
          placeholderTextColor={colors.text}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={[styles.label, { color: colors.text }]}>Categoría</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Proyecto, Tarea, Práctica, etc."
          placeholderTextColor={colors.text}
          value={category}
          onChangeText={setCategory}
        />

        <Text style={[styles.label, { color: colors.text }]}>Fecha de vencimiento</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.text}
          value={dueDate}
          onChangeText={setDueDate}
        />

        <Text style={[styles.label, { color: colors.text }]}>Curso (opcional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="ID de Curso"
          placeholderTextColor={colors.text}
          value={courseId}
          onChangeText={setCourseId}
        />

        <Text style={[styles.label, { color: colors.text }]}>Taller (opcional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="ID de Taller"
          placeholderTextColor={colors.text}
          value={workshopId}
          onChangeText={setWorkshopId}
        />

        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={onSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{editItem?.id ? 'Actualizar' : 'Guardar'}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  formCard: { borderWidth: 1, borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, fontSize: 16 },
  button: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  error: { color: '#d32f2f', marginBottom: 12, textAlign: 'center' },
});