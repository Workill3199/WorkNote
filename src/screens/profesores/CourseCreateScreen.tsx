import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createCourse, updateCourse, Course } from '../services/courses';

type Props = NativeStackScreenProps<any>;

export default function CourseCreateScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const editItem = (route as any)?.params?.editItem as Course | undefined;
  const [title, setTitle] = useState(editItem?.title || '');
  const [description, setDescription] = useState(editItem?.description || '');
  const [classroom, setClassroom] = useState(editItem?.classroom || '');
  const [schedule, setSchedule] = useState(editItem?.schedule || '');
  const [semester, setSemester] = useState(editItem?.semester || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setError(null);
    if (!title.trim()) { setError('El título es obligatorio'); return; }
    setLoading(true);
    try {
      if (editItem?.id) {
        await updateCourse(editItem.id, { title: title.trim(), description: description.trim(), classroom: classroom.trim(), schedule: schedule.trim(), semester: semester.trim() });
      } else {
        await createCourse({ title: title.trim(), description: description.trim(), classroom: classroom.trim(), schedule: schedule.trim(), semester: semester.trim() });
      }
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message ?? (editItem?.id ? 'Error al actualizar curso' : 'Error al crear curso'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <Text style={[styles.title, { color: colors.text }]}>{editItem?.id ? 'Editar Curso' : 'Nuevo Curso'}</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }] }>
        <Text style={[styles.label, { color: colors.text }]}>Título</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Ingresa el título del curso"
          placeholderTextColor={colors.text}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { color: colors.text }]}>Descripción</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, height: 100 }]}
          placeholder="Describe el curso"
          placeholderTextColor={colors.text}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={[styles.label, { color: colors.text }]}>Aula</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Ej: Aula 201"
          placeholderTextColor={colors.text}
          value={classroom}
          onChangeText={setClassroom}
        />

        <Text style={[styles.label, { color: colors.text }]}>Horario</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Lunes, Miércoles 8:00-9:30"
          placeholderTextColor={colors.text}
          value={schedule}
          onChangeText={setSchedule}
        />

        <Text style={[styles.label, { color: colors.text }]}>Semestre</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Ej: 2025-1"
          placeholderTextColor={colors.text}
          value={semester}
          onChangeText={setSemester}
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