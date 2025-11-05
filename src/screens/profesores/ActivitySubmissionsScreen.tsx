// Pantalla de entregas de una actividad para profesores.
// Muestra autores, títulos, descripciones y permite abrir/descargar archivos adjuntos.
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Platform, Linking, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { listSubmissionsByActivity, Submission } from '../../services/submissions';
import { listUsersByUids } from '../../services/users';
import { darkColors } from '../../theme/colors';
import { storage } from '../../config/firebase';
import { getDownloadURL, ref } from 'firebase/storage';

type Props = NativeStackScreenProps<any>;

export default function ActivitySubmissionsScreen({ route }: Props) {
  const { colors } = useTheme() as any; // Colores del tema
  const T = colors.background === darkColors.background ? darkColors : colors; // Tokens según tema

  // Parámetros de ruta (actividad y curso)
  const activityId = (route as any)?.params?.activityId as string | undefined;
  const courseId = (route as any)?.params?.courseId as string | undefined;
  const activityTitle = (route as any)?.params?.activityTitle as string | undefined;

  // Estado de carga, datos y mapa de usuarios
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Submission[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, { fullName?: string; email?: string }>>({});

  const headerTitle = useMemo(() => activityTitle ? `Entregas - ${activityTitle}` : 'Entregas', [activityTitle]); // Título dinámico

  // Carga entregas y resuelve nombres de autores
  useEffect(() => {
    (async () => {
      if (!activityId) {
        setError('Actividad no especificada');
        setLoading(false);
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const subs = await listSubmissionsByActivity(activityId, courseId);
        setItems(subs);
        const uids = Array.from(new Set(subs.map(s => (s.ownerId || '').trim()).filter(Boolean)));
        const users = await listUsersByUids(uids);
        const map = Object.fromEntries(users.map(u => [u.uid!, { fullName: u.fullName, email: u.email }]));
        setUsersMap(map);
      } catch (e: any) {
        setError(e?.message ?? 'No se pudieron cargar las entregas');
      } finally {
        setLoading(false);
      }
    })();
  }, [activityId, courseId]);

  // Normaliza URLs antiguas de Storage con formato REST `o?name=` o gs:// y devuelve `getDownloadURL`
  const resolveAttachmentUrl = async (att: { url: string }): Promise<string | undefined> => {
    const u = att?.url || '';
    try {
      if (u.includes('/o?name=')) {
        if (!storage) return undefined;
        const urlObj = new URL(u);
        const rawName = urlObj.searchParams.get('name') || '';
        const path = decodeURIComponent(rawName);
        const r = ref(storage!, path);
        const fixed = await getDownloadURL(r);
        return fixed;
      }
      if (u.startsWith('gs://')) {
        if (!storage) return undefined;
        const r = ref(storage!, u);
        const fixed = await getDownloadURL(r);
        return fixed;
      }
      return u;
    } catch {
      return undefined;
    }
  };

  // Abre/descarga adjuntos según plataforma (web/móvil)
  const onOpenAttachment = async (url: string, name?: string) => {
    try {
      if (Platform.OS === 'web') {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        if (name) a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        await Linking.openURL(url);
      }
    } catch {
      Alert.alert('Aviso', 'No se pudo abrir el archivo');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: T.background }] }>
      <Text style={[styles.title, { color: T.text }]}>{headerTitle}</Text>
      {loading && <ActivityIndicator color={T.primary} style={{ marginTop: 12 }} />}
      {!!error && <Text style={[styles.error, { color: T.error }]}>{error}</Text>}
      {!loading && items.length === 0 && (
        <Text style={[styles.empty, { color: T.mutedText }]}>Aún no hay entregas.</Text>
      )}
      {!loading && !!items.length && (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {items.map(it => {
            const author = usersMap[it.ownerId || ''] || {};
            return (
              <View key={it.id} style={[styles.card, { borderColor: T.border, backgroundColor: Platform.OS === 'web' ? 'rgba(42,42,58,0.7)' : T.card }, Platform.OS === 'web' ? ({ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' } as any) : {}] }>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="account" size={16} color={T.accent} />
                  <Text style={[styles.cardTitle, { color: T.text }]}>{author.fullName || 'Alumno'}</Text>
                </View>
                {!!it.title && <Text style={[styles.cardSubtitle, { color: T.text }]}>{it.title}</Text>}
                {!!it.description && <Text style={[styles.cardDesc, { color: T.mutedText }]}>{it.description}</Text>}
                {!!(it.attachments && it.attachments.length) && (
                  <View style={styles.filesRow}>
                    {it.attachments!.map((f, idx) => (
                      <View key={(f.url || idx.toString())} style={[styles.fileBadge, { borderColor: T.accent }] }>
                        <MaterialCommunityIcons name="file" size={14} color={T.text} />
                        <Text style={[styles.fileName, { color: T.text }]} numberOfLines={1}>{f.name || 'Archivo'}</Text>
                        <TouchableOpacity onPress={async () => {
                          const url = await resolveAttachmentUrl(f as any);
                          if (!url) {
                            Alert.alert('Aviso', 'El adjunto no está disponible o su URL es inválido.');
                            return;
                          }
                          await onOpenAttachment(url, f.name);
                        }} style={[styles.downloadBtn, { backgroundColor: T.primary }]}>
                          <Text style={styles.downloadText}>Descargar</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  error: { marginTop: 8, textAlign: 'center' },
  empty: { marginTop: 12, textAlign: 'center' },
  card: { position: 'relative', borderWidth: 2, borderRadius: 14, padding: 14, marginTop: 12 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 as any },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSubtitle: { fontSize: 14, fontWeight: '600', marginTop: 6 },
  cardDesc: { marginTop: 6, fontSize: 13 },
  filesRow: { flexDirection: 'column', gap: 8 as any, marginTop: 10 },
  fileBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 as any, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  fileName: { flex: 1, fontSize: 13 },
  downloadBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  downloadText: { color: '#1A1A2E', fontWeight: '700' },
});