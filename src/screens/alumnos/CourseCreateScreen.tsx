import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createCourse, updateCourse, Course } from '../../services/courses';

type Props = NativeStackScreenProps<any>;

export default function CourseCreateScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const editItem = (route as any)?.params?.editItem as Course | undefined;
  const [title, setTitle] = useState(editItem?.title || '');
  const [description, setDescription] = useState(editItem?.description || '');
  const [classroom, setClassroom] = useState(editItem?.classroom || '');
  // Horario opcional en un único input con máscara HH:MM - HH:MM
  const [schedule, setSchedule] = useState((editItem?.schedule || '').trim());
  const maskSchedule = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 8);
    const h1 = d.slice(0, 2);
    const m1 = d.slice(2, 4);
    const h2 = d.slice(4, 6);
    const m2 = d.slice(6, 8);
    let out = '';
    if (h1) out += h1;
    if (m1) out += ':' + m1;
    if (h2) out += ' - ' + h2;
    if (m2) out += ':' + m2;
    return out;
  };
  const handleScheduleChange = (text: string) => setSchedule(maskSchedule(text));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setError(null);
    if (!title.trim()) { setError('El título es obligatorio'); return; }
    // Valida el horario si se ingresó
    const pattern = /^([01]\d|2[0-3]):([0-5]\d)\s*-\s*([01]\d|2[0-3]):([0-5]\d)$/;
    const scheduleValue = schedule.trim();
    if (scheduleValue && !pattern.test(scheduleValue)) {
      setError('Formato de horario inválido. Usa HH:MM - HH:MM');
      return;
    }
    setLoading(true);
    try {
      if (editItem?.id) {
        await updateCourse(editItem.id, { title: title.trim(), description: description.trim(), classroom: classroom.trim(), schedule: scheduleValue });
      } else {
        await createCourse({ title: title.trim(), description: description.trim(), classroom: classroom.trim(), schedule: scheduleValue });
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

        <Text style={[styles.label, { color: colors.text }]}>Horario (opcional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="HH:MM - HH:MM"
          placeholderTextColor={colors.text}
          value={schedule}
          onChangeText={handleScheduleChange}
          maxLength={13}
          inputMode="numeric"
        />
        <Text style={[styles.hint, { color: colors.mutedText ?? colors.text }]}>Formato 24h. Ej: 08:00 - 09:30</Text>

        

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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hint: { fontSize: 12, marginTop: -6, marginBottom: 8 },
  button: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  error: { color: '#d32f2f', marginBottom: 12, textAlign: 'center' },
});
