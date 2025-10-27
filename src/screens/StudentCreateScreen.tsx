import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createStudent, updateStudent, Student } from '../services/students';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import NeonButton from '../components/NeonButton';

type Props = NativeStackScreenProps<any>;

export default function StudentCreateScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const editItem = (route as any)?.params?.editItem as Student | undefined;
  const [firstName, setFirstName] = useState(editItem?.firstName || '');
  const [lastName, setLastName] = useState(editItem?.lastName || '');
  const [email, setEmail] = useState(editItem?.email || '');
  const [courseId, setCourseId] = useState(editItem?.courseId || '');
  const [workshopId, setWorkshopId] = useState(editItem?.workshopId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const studentSchema = z.object({
    firstName: z.string().trim().min(1, t('Validation.firstNameRequired')),
    lastName: z.string().trim().optional(),
    email: z.string().trim().optional().refine((val) => !val || /.+@.+\..+/.test(val), t('Validation.emailInvalid')),
    courseId: z.string().trim().optional(),
    workshopId: z.string().trim().optional(),
  });

  const onSave = async () => {
    setError(null);
    const parsed = studentSchema.safeParse({ firstName, lastName, email, courseId, workshopId });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || t('Validation.invalidData'));
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
          courseId: data.courseId || undefined,
          workshopId: data.workshopId || undefined,
        });
      } else {
        await createStudent({
          firstName: data.firstName,
          lastName: data.lastName || '',
          email: data.email || '',
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

        <Text style={[styles.label, { color: colors.text }]}>{t('Student.labels.courseOptional')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          placeholder={t('Student.placeholder.courseId')}
          placeholderTextColor={colors.text}
          value={courseId}
          onChangeText={setCourseId}
        />

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
});