import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createStudent, updateStudent, Student } from '../../services/students';
import { listCourses, Course } from '../../services/courses';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import NeonButton from '../../components/NeonButton';

type Props = NativeStackScreenProps<any>;

export default function StudentCreateScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const editItem = (route as any)?.params?.editItem as Student | undefined;
  const [firstName, setFirstName] = useState(editItem?.firstName || '');
  const [lastName, setLastName] = useState(editItem?.lastName || '');
  const [email, setEmail] = useState(editItem?.email || '');
  const [classLabel, setClassLabel] = useState((editItem?.classLabel || 'A').toUpperCase());
  const [courseId, setCourseId] = useState(editItem?.courseId || '');
  const [workshopId, setWorkshopId] = useState(editItem?.workshopId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseMenuOpen, setCourseMenuOpen] = useState(false);

  useEffect(() => {
    listCourses().then(setCourses).catch(() => setCourses([]));
  }, []);

  const studentSchema = z.object({
    firstName: z.string().trim().min(1, t('Validation.firstNameRequired')),
    lastName: z.string().trim().optional(),
    email: z.string().trim().optional().refine((val) => !val || /.+@.+\..+/.test(val), t('Validation.emailInvalid')),
    classLabel: z.enum(['A', 'B', 'C', 'D']),
    courseId: z.string().trim().optional(),
    workshopId: z.string().trim().optional(),
  });

  const onSave = async () => {
    setError(null);
    const parsed = studentSchema.safeParse({ firstName, lastName, email, classLabel: classLabel as 'A' | 'B' | 'C' | 'D', courseId, workshopId });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || t('Validation.invalidData'));
      return;
    }

    if (!courseId?.trim()) {
      setError('Debes seleccionar una clase existente');
      return;
    }

    setLoading(true);
    const data = parsed.data;
    try {
      if (editItem?.id) {
        await updateStudent(editItem.id, {
          firstName: data.firstName,
          lastName: data.lastName || '',
          email: data.email || '',
          classLabel: data.classLabel,
          courseId: data.courseId || undefined,
          workshopId: data.workshopId || undefined,
        });
      } else {
        await createStudent({
          firstName: data.firstName,
          lastName: data.lastName || '',
          email: data.email || '',
          classLabel: data.classLabel,
          courseId: data.courseId || undefined,
          workshopId: data.workshopId || undefined,
        });
      }
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message ?? (editItem?.id ? t('Validation.invalidData') : t('Validation.invalidData')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <Text style={[styles.title, { color: colors.text }]}>{editItem?.id ? t('Student.titleEdit') : t('Student.titleCreate')}</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }] }>
        <Text style={[styles.label, { color: colors.text }]}>{t('Student.labels.firstName')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder={t('Student.placeholder.firstName')}
          placeholderTextColor={colors.text}
          value={firstName}
          onChangeText={setFirstName}
        />

        <Text style={[styles.label, { color: colors.text }]}>{t('Student.labels.lastName')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder={t('Student.placeholder.lastName')}
          placeholderTextColor={colors.text}
          value={lastName}
          onChangeText={setLastName}
        />

      <Text style={[styles.label, { color: colors.text }]}>{t('Student.labels.email')}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
        placeholder={t('Student.placeholder.email')}
        placeholderTextColor={colors.text}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* Selector de clase */}
      <Text style={[styles.label, { color: colors.text }]}>Clase</Text>
      <View style={styles.chipRow}>
        {(['A','B','C','D'] as const).map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setClassLabel(c)}
            style={[styles.chip, classLabel === c && styles.chipActive]}
            activeOpacity={0.85}
          >
            <Text style={[styles.chipText, classLabel === c && styles.chipTextActive]}>{`Clase ${c}`}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Clase (obligatoria)</Text>
      <View style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.text, fontSize: 16 }}>
            {courseId ? (courses.find(c => c.id === courseId)?.title ?? courseId) : 'Selecciona una clase'}
          </Text>
          <TouchableOpacity onPress={() => setCourseMenuOpen(v => !v)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.primary }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{courseMenuOpen ? 'Cerrar' : 'Elegir'}</Text>
          </TouchableOpacity>
        </View>
        {courseMenuOpen && (
          <View style={[styles.menu, { borderColor: colors.border, backgroundColor: Platform.OS === 'web' ? 'rgba(20,25,35,0.6)' : colors.card }]}> 
            <TouchableOpacity onPress={() => { setCourseId(''); setCourseMenuOpen(false); }} style={[styles.menuItem, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text }}>Todos</Text>
            </TouchableOpacity>
            {courses.map((c) => (
              <TouchableOpacity key={c.id} onPress={() => { setCourseId(c.id!); setCourseMenuOpen(false); }} style={[styles.menuItem, { borderColor: colors.border }]}> 
                <Text style={{ color: colors.text }}>{c.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

        <Text style={[styles.label, { color: colors.text }]}>{t('Student.labels.workshopOptional')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder={t('Student.placeholder.workshopId')}
          placeholderTextColor={colors.text}
          value={workshopId}
          onChangeText={setWorkshopId}
        />

        <NeonButton title={editItem?.id ? t('Common.update') : t('Common.save')} onPress={onSave} colors={colors} loading={loading} style={styles.button} textStyle={styles.buttonText} />
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
  chipRow: { flexDirection: 'row', gap: 8 as any, marginBottom: 12 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderColor: '#404652', backgroundColor: '#0f1420' },
  chipActive: { borderColor: 'rgba(110,120,255,0.5)', backgroundColor: 'rgba(110,120,255,0.10)' },
  chipText: { color: '#9aa3b2', fontSize: 12 },
  chipTextActive: { color: '#7c86ff' },
  menu: { borderWidth: 1, borderRadius: 10, marginTop: 8, maxHeight: 200, overflow: 'hidden' },
  menuItem: { paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1 },
});
