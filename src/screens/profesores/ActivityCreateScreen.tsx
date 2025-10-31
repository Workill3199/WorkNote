import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { storage } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createActivity, updateActivity, deleteActivity, Activity } from '../../services/activities';
import { listCourses, Course } from '../../services/courses';
import { darkColors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
// Adjuntos removidos: no usamos Storage aquí

type Props = NativeStackScreenProps<any>;

export default function ActivityCreateScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const editItem = (route as any)?.params?.editItem as Activity | undefined;
  const [title, setTitle] = useState(editItem?.title || '');
  const [description, setDescription] = useState(editItem?.description || '');
  const [dueDate, setDueDate] = useState(editItem?.dueDate ? new Date(editItem.dueDate).toISOString().slice(0,10) : '');
  const [dateFocused, setDateFocused] = useState(false);
  const [category, setCategory] = useState(editItem?.category || '');
  const [courseId, setCourseId] = useState(editItem?.courseId || '');
  const [courseIds, setCourseIds] = useState<string[]>(Array.isArray(editItem?.courseIds) ? (editItem!.courseIds as string[]) : []);
  const [workshopId, setWorkshopId] = useState(editItem?.workshopId || '');
  const [priority, setPriority] = useState<'alta' | 'media' | 'baja'>(editItem?.priority || 'media');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [pendingFiles, setPendingFiles] = useState<any[]>([]); // Web: File[]
  // Adjuntos removidos

  useEffect(() => {
    // Cargar lista de clases (cursos) para el selector
    listCourses().then(setCourses).catch(() => setCourses([]));
  }, []);

  const uploadAttachments = async (activityId: string) => {
    if (!storage || !pendingFiles.length) return [] as { name: string; url: string; contentType?: string; size?: number }[];
    const uploaded: { name: string; url: string; contentType?: string; size?: number }[] = [];
    for (const f of pendingFiles) {
      try {
        const name: string = String((f?.name ?? `archivo-${Date.now()}`)).replace(/[^A-Za-z0-9._-]/g, '_');
        const path = `activities/${activityId}/${Date.now()}-${name}`;
        const r = ref(storage, path);
        const bytes = f instanceof Blob ? f : (f?.blob ?? undefined);
        const toUpload: Blob = bytes || new Blob([await (f?.arrayBuffer?.() ?? Promise.resolve(new ArrayBuffer(0)))]);
        await uploadBytes(r, toUpload, { contentType: f?.type });
        const url = await getDownloadURL(r);
        uploaded.push({ name, url, contentType: f?.type, size: f?.size });
      } catch (e) {
        // Ignorar fallo individual, continuar con los demás
      }
    }
    return uploaded;
  };

  const onSave = async () => {
    setError(null);
    if (!title.trim()) { setError('El título es obligatorio'); return; }
    setLoading(true);
    try {
      const due = dueDate ? new Date(dueDate).toISOString() : undefined;
      const normalizedCourseIds = Array.from(new Set(courseIds.filter(Boolean)));
      const singleCourseId = (courseId || normalizedCourseIds[0] || '').trim();
      if (editItem?.id) {
        await updateActivity(editItem.id, { title: title.trim(), description: description.trim(), dueDate: due, category: category.trim(), courseId: singleCourseId || undefined, courseIds: normalizedCourseIds, workshopId: workshopId.trim() || undefined, priority });
        // Subir adjuntos nuevos si se seleccionaron
        if (pendingFiles.length) {
          const newAtts = await uploadAttachments(editItem.id);
          const prev = Array.isArray(editItem.attachments) ? editItem.attachments : [];
          const merged = [...prev, ...newAtts];
          await updateActivity(editItem.id, { attachments: merged as any });
        }
      } else {
        const newId = await createActivity({ title: title.trim(), description: description.trim(), dueDate: due, category: category.trim(), courseId: singleCourseId || undefined, courseIds: normalizedCourseIds, workshopId: workshopId.trim() || undefined, priority });
        // Subir adjuntos si hay seleccionados
        if (pendingFiles.length) {
          const uploaded = await uploadAttachments(newId);
          if (uploaded.length) {
            await updateActivity(newId, { attachments: uploaded as any });
          }
        }
      }
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message ?? (editItem?.id ? 'Error al actualizar actividad' : 'Error al crear actividad'));
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!editItem?.id) return;
    const performDelete = async () => {
      setLoading(true);
      setError(null);
      try {
        await deleteActivity(editItem.id!);
        navigation.goBack();
      } catch (e: any) {
        setError(e?.message ?? 'Error al eliminar actividad');
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      // Confirmación simple en web
      const ok = (global as any).confirm ? (global as any).confirm('¿Deseas eliminar esta actividad? Esta acción no se puede deshacer.') : true;
      if (ok) performDelete();
    } else {
      Alert.alert(
        'Eliminar actividad',
        '¿Deseas eliminar esta actividad? Esta acción no se puede deshacer.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: performDelete },
        ]
      );
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

        {/* Botón para agregar archivos (funcional en web) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS === 'web') {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.onchange = (e: any) => {
                  const files = Array.from(e?.target?.files || []);
                  setPendingFiles((prev) => [...prev, ...files]);
                };
                input.click();
              } else {
                Alert.alert('Adjuntar archivos', 'Adjuntar archivos está disponible en la versión web. Próximamente habilitaremos adjuntos en móvil.');
              }
            }}
            style={[styles.chip, { flexDirection: 'row', alignItems: 'center' }]}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="file-plus" size={16} color={darkColors.accent} />
            <Text style={[styles.chipText, { marginLeft: 6 }]}>Agregar archivos</Text>
          </TouchableOpacity>
          {!!pendingFiles.length && (
            <View style={[styles.chip, { marginLeft: 8, flexDirection: 'row', alignItems: 'center' }] }>
              <MaterialCommunityIcons name="paperclip" size={16} color={darkColors.primary} />
              <Text style={[styles.chipText, { marginLeft: 6 }]}>Seleccionados: {pendingFiles.length}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Fecha de vencimiento</Text>
        {Platform.OS === 'web' ? (
          <View
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: dateFocused ? (colors as any).primary : colors.border,
              },
            ]}
          >
            {React.createElement('style', {
              dangerouslySetInnerHTML: {
                __html: `
                  .due-date-input::placeholder { color: ${String((colors as any).text)}; opacity: 0.6; }
                  .due-date-input { color-scheme: ${'dark'}; }
                `,
              },
            })}
            {React.createElement('input', {
              type: 'date',
              className: 'due-date-input',
              value: dueDate,
              onChange: (e: any) => setDueDate(e?.target?.value ?? ''),
              onFocus: () => setDateFocused(true),
              onBlur: () => setDateFocused(false),
              style: {
                width: '100%',
                background: 'transparent',
                color: (colors as any).text,
                border: 'none',
                outline: 'none',
                fontSize: 16,
                padding: 0,
                height: 24,
                accentColor: (colors as any).primary,
                caretColor: (colors as any).primary,
              },
            })}
          </View>
        ) : (
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.text}
            value={dueDate}
            onChangeText={setDueDate}
          />
        )}

        <Text style={[styles.label, { color: colors.text }]}>Prioridad</Text>
        <View style={styles.filtersRow}>
          {([
            { key: 'alta', label: 'Alta' },
            { key: 'media', label: 'Media' },
            { key: 'baja', label: 'Baja' },
          ] as const).map((p) => {
            const active = priority === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                onPress={() => setPriority(p.key)}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Asignar a clases</Text>
        <View style={styles.filtersRow}>
          {courses.map((c) => {
            const active = courseIds.includes(c.id!);
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => {
                  setCourseIds((prev) => (prev.includes(c.id!) ? prev.filter((id) => id !== c.id) : [...prev, c.id!]));
                }}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={[styles.hint, { color: colors.text }]}>Puedes seleccionar múltiples clases. Se guardarán asignadas a esta actividad.</Text>

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
        {editItem?.id && (
          <TouchableOpacity style={[styles.button, { backgroundColor: darkColors.error }]} onPress={onDelete} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Eliminar</Text>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontFamily: fonts.bold, marginBottom: 12 },
  formCard: { borderWidth: 1, borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, fontSize: 16 },
  button: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  error: { color: darkColors.error, marginBottom: 12, textAlign: 'center' },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 as any, marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderColor: darkColors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: Platform.OS === 'web' ? 'rgba(20,25,35,0.5)' : darkColors.card,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' } as any) : {}),
  },
  chipActive: { borderColor: 'rgba(110,120,255,0.5)', backgroundColor: 'rgba(110,120,255,0.10)' },
  chipText: { color: darkColors.mutedText, fontSize: 12 },
  chipTextActive: { color: darkColors.primary },
  hint: { fontSize: 11, color: darkColors.mutedText, marginBottom: 12 },
});
