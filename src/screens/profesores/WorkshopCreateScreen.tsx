import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createWorkshop, updateWorkshop, Workshop } from '../../services/workshops';
import NeonButton from '../../components/NeonButton';

type Props = NativeStackScreenProps<any>;

export default function WorkshopCreateScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const editItem = (route as any)?.params?.editItem as Workshop | undefined;
  const [title, setTitle] = useState(editItem?.title || '');
  const [description, setDescription] = useState(editItem?.description || '');
  const [location, setLocation] = useState(editItem?.location || '');
  const [schedule, setSchedule] = useState(editItem?.schedule || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setError(null);
    if (!title.trim()) { setError('El título es obligatorio'); return; }
    setLoading(true);
    try {
      if (editItem?.id) {
        await updateWorkshop(editItem.id, { title: title.trim(), description: description.trim(), location: location.trim(), schedule: schedule.trim() });
      } else {
        await createWorkshop({ title: title.trim(), description: description.trim(), location: location.trim(), schedule: schedule.trim() });
      }
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message ?? (editItem?.id ? 'Error al actualizar taller' : 'Error al crear taller'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <Text style={[styles.title, { color: colors.text }]}>{editItem?.id ? 'Editar Taller' : 'Nuevo Taller'}</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }] }>
        <Text style={[styles.label, { color: colors.text }]}>Título</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Ingresa el título del taller"
          placeholderTextColor={colors.text}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { color: colors.text }]}>Descripción</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, height: 100 }]}
          placeholder="Describe el taller"
          placeholderTextColor={colors.text}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={[styles.label, { color: colors.text }]}>Lugar</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Ej: Laboratorio 3"
          placeholderTextColor={colors.text}
          value={location}
          onChangeText={setLocation}
        />

        <Text style={[styles.label, { color: colors.text }]}>Horario</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder="Ej: Martes 14:00-16:00"
          placeholderTextColor={colors.text}
          value={schedule}
          onChangeText={setSchedule}
        />


        <NeonButton title={editItem?.id ? 'Actualizar' : 'Guardar'} onPress={onSave} colors={colors} loading={loading} style={styles.button} textStyle={styles.buttonText} />
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
