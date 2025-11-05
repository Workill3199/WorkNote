// Perfil de usuario (raíz).
// Muestra datos básicos del alumno y sus clases unidas.
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Student } from '../services/students';
import { getCourse, Course } from '../services/courses';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { darkColors } from '../theme/colors';

type Props = NativeStackScreenProps<any>;

export default function UserProfileScreen({ route }: Props) {
  const { colors } = useTheme() as any; // paleta de colores actual
  const student = (route as any)?.params?.student as Student | undefined;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<Course[]>([]);

  const name = useMemo(() => `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || 'Usuario', [student]);
  const initials = useMemo(() => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U', [name]);

  useEffect(() => {
    // Carga clases asociadas al email del usuario desde la colección students
    (async () => {
      if (!student?.email) {
        setLoading(false);
        return;
      }
      setError(null);
      setLoading(true);
      try {
        // Buscar todas las inscripciones del usuario por email en la colección students
        const q = query(collection(db!, 'students'), where('email', '==', student.email));
        const snap = await getDocs(q);
        const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any[];
        const courseIds: string[] = Array.from(new Set(rows.map(r => (r.courseId || '').trim()).filter(Boolean)));
        const fetched: Course[] = [];
        for (const cid of courseIds) {
          const c = await getCourse(cid);
          if (c) fetched.push(c);
        }
        setClasses(fetched);
      } catch (e: any) {
        setError(e?.message ?? 'No se pudo cargar el perfil');
      } finally {
        setLoading(false);
      }
    })();
  }, [student?.email]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      {/* Encabezado tipo perfil público: avatar con iniciales y estado */}
      <View style={styles.headerWrap}>
        <View style={[styles.avatarWrap, { borderColor: colors.border, shadowColor: colors.text }] }>
          {Platform.OS === 'web' ? (
            <View style={[styles.avatarGrad, { backgroundImage: 'linear-gradient(135deg, #3b82f6, #1e40af)' } as any]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          ) : (
            <View style={[styles.avatarGradNative] }>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.onlineDot} />
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>{name.toUpperCase()}</Text>
      </View>

      {/* Tarjeta de información de contacto */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }] }>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.iconLetter, { color: colors.text }]}>@</Text>
            </View>
            <View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Email</Text>
              <Text style={{ color: colors.text }}>{student?.email || '—'}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.iconLetter, { color: colors.text }]}>☎</Text>
            </View>
            <View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Teléfono</Text>
              <Text style={{ color: colors.text }}>{'—'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Clases unidas del usuario */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>CLASES UNIDAS</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }] }>
        {loading && <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />}
        {!!error && <Text style={[styles.error, { color: '#d32f2f' }]}>{error}</Text>}
        {!loading && classes.length === 0 && (
          <Text style={[styles.empty, { color: colors.mutedText }]}>No se encontraron clases para este usuario.</Text>
        )}
        {!loading && classes.map((c) => (
          <View key={c.id} style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: darkColors.primary }]}>
                <Text style={[styles.iconLetter, { color: '#fff' }]}>📘</Text>
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{c.title}</Text>
                <Text style={{ color: colors.mutedText }}>
                  {[c.classroom, c.schedule, c.semester].filter(Boolean).join(' • ')}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  headerWrap: { alignItems: 'center', paddingTop: 24, paddingBottom: 8 },
  avatarWrap: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', position: 'relative', borderWidth: 4, elevation: 6, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  avatarGrad: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center' },
  avatarGradNative: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e40af' },
  avatarInitials: { fontSize: 36, fontWeight: '800', color: '#fff' },
  onlineDot: { position: 'absolute', right: 6, bottom: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#22c55e', borderWidth: 4 },
  userName: { fontSize: 18, fontWeight: '800', marginTop: 12, letterSpacing: 1 },
  card: { borderWidth: 1, borderRadius: 20, overflow: 'hidden', marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconLetter: { fontSize: 16, fontWeight: '700' },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  separator: { height: 1, marginHorizontal: 16, opacity: 0.4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 18, marginBottom: 8, letterSpacing: 0.75, paddingHorizontal: 4 },
  empty: { paddingHorizontal: 16, paddingVertical: 16 },
  error: { paddingHorizontal: 16, paddingVertical: 8 },
});