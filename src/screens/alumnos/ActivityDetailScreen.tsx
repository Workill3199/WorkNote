import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkColors, lightColors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { Activity, getActivity } from '../../services/activities';
import { listCommentsByActivity, createComment, Comment, subscribeCommentsByActivity, deleteComment } from '../../services/comments';
import { getCourse } from '../../services/courses';
import { Linking } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { FileUpload, SelectedFile } from '../../components/files';
import { uploadFilesToServer } from '../../services/file';
import { createSubmission, listSubmissionsByActivity, Submission, updateSubmission } from '../../services/submissions';
import { auth } from '../../config/firebase';
import { useConfig } from '../../context/ConfigContext';
import { getUserRole, getLastSelectedRole } from '../../utils/roles';

type Props = NativeStackScreenProps<any>;

export default function ActivityDetailScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { config } = useConfig();
  const palette = config.lightMode ? lightColors : darkColors;
  const T = palette;
  const isWeb = Platform.OS === 'web';
  const insets = useSafeAreaInsets();
  const activityFromRoute = (route as any)?.params?.activity as Activity | undefined;
  const activityId = (route as any)?.params?.activityId as string | undefined;
  const [activity, setActivity] = useState<Activity | undefined>(activityFromRoute);
  const [loading, setLoading] = useState(!activityFromRoute);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [mySubmission, setMySubmission] = useState<Submission | undefined>(undefined);
  const [uploadFiles, setUploadFiles] = useState<SelectedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isCourseOwner, setIsCourseOwner] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const aid = activity?.id || activityId || '';

  function handleEditActivity() {
    try {
      if (!activity) return;
      (navigation as any).navigate('ActivityCreate', { editItem: activity });
    } catch {}
  }

  useEffect(() => {
    // Detectar rol del usuario (profesor/alumno) para ocultar panel de entrega
    (async () => {
      try {
        const uid = auth?.currentUser?.uid || '';
        const role = (await getUserRole(uid)) || (await getLastSelectedRole());
        setIsTeacher(role === 'profesor');
      } catch {
        setIsTeacher(false);
      }
    })();
    let mounted = true;
    (async () => {
      if (!activity && activityId) {
        setLoading(true);
        const a = await getActivity(activityId);
        if (mounted) setActivity(a ?? undefined);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [activityId]);

  useEffect(() => {
    if (!aid) return;
    // Suscripción en tiempo real a comentarios
    const unsub = subscribeCommentsByActivity(aid, (rows) => setComments(rows));
    // Cargar permisos del curso (para borrar como profesor)
    (async () => {
      try {
        if (activity?.courseId) {
          const course = await getCourse(activity.courseId);
          const uid = auth?.currentUser?.uid || '';
          setIsCourseOwner((course?.ownerId ?? '') === uid);
        } else {
          setIsCourseOwner(false);
        }
      } catch {
        setIsCourseOwner(false);
      }
    })();
    // Cargar entregas y detectar la del alumno actual
    (async () => {
      try {
        const rows = await listSubmissionsByActivity(aid, activity?.courseId);
        setSubmissions(rows);
        const mine = rows.find(r => (r.ownerId ?? '') === (auth?.currentUser?.uid || ''));
        setMySubmission(mine);
      } catch {
        setSubmissions([]);
        setMySubmission(undefined);
      }
    })();
    return () => { try { unsub(); } catch {} };
  }, [aid]);

  async function handleOpenAttachment(url?: string) {
    try {
      if (!url) return;
      if (Platform.OS === 'web') {
        Linking.openURL(url);
        return;
      }
      // En nativo: descargar a cache y compartir/abrir
      const fileName = url.split('/').pop() || 'archivo';
      const dst = FileSystem.cacheDirectory! + fileName;
      const res = await FileSystem.downloadAsync(url, dst);
      if ((await Sharing.isAvailableAsync()) && res?.uri) {
        await Sharing.shareAsync(res.uri);
      } else {
        Linking.openURL(url);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo abrir/descargar el archivo');
    }
  }

  async function handleAddComment() {
    try {
      const text = newComment.trim();
      if (!text || !aid) return;
      await createComment(aid, text, activity?.courseId);
      setNewComment('');
      // No es necesario refrescar manualmente; subscribeCommentsByActivity actualizará la lista
    } catch (err) {
      Alert.alert('Error', 'No se pudo agregar el comentario');
    }
  }

  async function handleDeleteComment(commentId?: string) {
    try {
      if (!commentId) return;
      await deleteComment(commentId);
    } catch (err) {
      Alert.alert('Error', 'No se pudo borrar el comentario');
    }
  }

  async function handleSubmitWork() {
    try {
      if (!aid) return;
      setSubmitting(true);
      let subId = mySubmission?.id;
      if (!subId) {
        subId = await createSubmission({ activityId: aid, courseId: activity?.courseId, title: activity?.title });
      }
      // Subir archivos si hay seleccionados
      let uploaded: { url: string }[] = [];
      if (uploadFiles.length > 0) {
        uploaded = await uploadFilesToServer(uploadFiles);
      }
      // Mezclar con adjuntos existentes
      const existing = mySubmission?.attachments || [];
      const newOnes = uploaded.map((u, idx) => ({
        name: uploadFiles[idx]?.name || 'archivo',
        url: u.url,
        contentType: uploadFiles[idx]?.type,
        size: uploadFiles[idx]?.size,
      }));
      const merged = [...existing, ...newOnes];
      await updateSubmission(subId!, { attachments: merged });
      // refrescar
      const rows = await listSubmissionsByActivity(aid, activity?.courseId);
      setSubmissions(rows);
      const mine = rows.find(r => (r.ownerId ?? '') === (auth?.currentUser?.uid || ''));
      setMySubmission(mine);
      setUploadFiles([]);
      Alert.alert('Listo', 'Tu trabajo fue enviado');
    } catch (err) {
      Alert.alert('Error', 'No se pudo enviar tu trabajo');
    } finally {
      setSubmitting(false);
    }
  }

  const prioColor = useMemo(() => (
    activity?.priority === 'alta'
      ? T.error
      : activity?.priority === 'media'
      ? T.warning
      : T.success
  ), [activity?.priority]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: Math.max(insets.top, 8), paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!activity ? (
          loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={{ color: colors.text }}>No se encontró la actividad.</Text>
          )
        ) : (
          <View style={styles.twoCol}>
            {/* Columna principal (izquierda) */}
            <View style={[styles.card, { borderColor: colors.border, backgroundColor: isWeb ? (config.lightMode ? 'rgba(255,255,255,0.60)' : 'rgba(42,42,58,0.7)') : colors.card }, isWeb ? ({ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' } as any) : {}] }>
              <View style={[styles.leftBar, { backgroundColor: prioColor }]} />
              <View style={styles.cardContent}>
                <View style={styles.headerRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="clipboard-text" size={18} color={colors.text} />
                    <Text style={[styles.title, { color: colors.text, marginLeft: 6 }]}>{activity.title}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 as any, flexWrap: 'wrap' }}>
                    {!!activity.dueDate && (
                      <View style={[styles.badge, { borderColor: prioColor }] }>
                        <MaterialCommunityIcons name="calendar" size={14} color={colors.text} />
                        <Text style={[styles.badgeText, { color: colors.text }]}>Fecha límite: {new Date(activity.dueDate).toLocaleString()}</Text>
                      </View>
                    )}
                    {isCourseOwner && (
                      <TouchableOpacity onPress={handleEditActivity} style={[styles.badge, { borderColor: T.accent }]}>
                        <MaterialCommunityIcons name="pencil" size={14} color={T.accent} />
                        <Text style={[styles.badgeText, { color: T.accent }]}>Editar actividad</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {!!activity.description && (
                  <Text style={[styles.desc, { color: colors.text }]}>{activity.description}</Text>
                )}

                {/* Adjuntos */}
                {!!activity.attachments?.length && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Material</Text>
                    {activity.attachments.map((att, idx) => (
                      <TouchableOpacity key={idx} style={[styles.attachmentRow, { borderColor: colors.border }]} onPress={() => handleOpenAttachment(att.url)}>
                        <MaterialCommunityIcons name="file-pdf-box" size={18} color={colors.text} />
                        <Text style={[styles.attachmentText, { color: colors.text }]} numberOfLines={1}>{att.name || 'Archivo'}</Text>
                        <MaterialCommunityIcons name="open-in-new" size={18} color={T.accent} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Comentarios de la clase */}
                  <View style={styles.section}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="account-multiple" size={18} color={colors.text} />
                    <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 6 }]}>Comentarios de la clase</Text>
                  </View>
                  <View style={[styles.commentInputRow, { borderColor: colors.border, backgroundColor: colors.card }] }>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Agregar comentario"
                      placeholderTextColor={T.mutedText}
                      value={newComment}
                      onChangeText={setNewComment}
                    />
                    <TouchableOpacity onPress={handleAddComment} style={[styles.sendBtn, { backgroundColor: T.accent }] } disabled={!newComment.trim()}>
                      <MaterialCommunityIcons name="send" size={16} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.commentList}>
                    {comments.length === 0 ? (
                      <Text style={{ color: T.mutedText }}>Aún no hay comentarios.</Text>
                    ) : comments.map((c) => (
                      <View key={c.id} style={[styles.commentItem, { borderColor: colors.border }] }>
                        <MaterialCommunityIcons name="account-circle" size={18} color={colors.text} />
                        <View style={{ marginLeft: 8, flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={[styles.commentAuthor, { color: colors.text }]}>{c.ownerName || 'Usuario'}</Text>
                              {!!c.role && (
                                <View style={[styles.roleBadge, { borderColor: c.role === 'profesor' ? T.accent : colors.border }] }>
                                  <Text style={[styles.roleText, { color: c.role === 'profesor' ? T.accent : T.mutedText }]}>{c.role === 'profesor' ? 'Profesor' : 'Alumno'}</Text>
                                </View>
                              )}
                            </View>
                            {((c.ownerId ?? '') === (auth?.currentUser?.uid || '') || isCourseOwner) && (
                              <TouchableOpacity accessibilityRole="button" onPress={() => handleDeleteComment(c.id)} style={styles.deleteBtn}>
                                <MaterialCommunityIcons name="trash-can-outline" size={18} color={T.error} />
                              </TouchableOpacity>
                            )}
                          </View>
                          <Text style={[styles.commentText, { color: colors.text, marginTop: 2 }]}>{c.text}</Text>
                          <Text style={[styles.commentMeta, { color: T.mutedText }]}>{new Date(c.createdAt?.toMillis?.() ?? Date.now()).toLocaleString()}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Panel lateral: Tu trabajo (solo alumnos) */}
            {!isTeacher && (
            <View style={[styles.sidePanel, { borderColor: colors.border, backgroundColor: colors.card }] }>
              <View style={styles.sideHeader}>
                <Text style={[styles.sideTitle, { color: colors.text }]}>Tu trabajo</Text>
                <Text style={[styles.sideStatus, { color: mySubmission ? T.success : T.error }]}>{mySubmission ? 'Entregado' : 'Sin entregar'}</Text>
              </View>
              <View style={{ marginVertical: 12 }}>
                <FileUpload onFilesSelected={setUploadFiles} multiple maxFiles={8} />
              </View>
              {mySubmission?.attachments?.length ? (
                <View style={{ marginBottom: 8 }}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Tus archivos</Text>
                  {mySubmission.attachments!.map((att, idx) => (
                    <TouchableOpacity key={idx} style={[styles.attachmentRow, { borderColor: colors.border }]} onPress={() => handleOpenAttachment(att.url)}>
                      <MaterialCommunityIcons name="paperclip" size={18} color={colors.text} />
                      <Text style={[styles.attachmentText, { color: colors.text }]} numberOfLines={1}>{att.name || 'Archivo'}</Text>
                      <MaterialCommunityIcons name="open-in-new" size={18} color={T.accent} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              <TouchableOpacity
                onPress={handleSubmitWork}
                style={[styles.submitBtn, { backgroundColor: T.accent } ]}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <Text style={[styles.submitText, { color: colors.text }]}>{mySubmission ? 'Actualizar entrega' : 'Marcar como completada'}</Text>
                )}
              </TouchableOpacity>
            </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },
  twoCol: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 16 as any,
    alignItems: 'flex-start',
  },
  card: {
    borderWidth: 1,
    borderColor: darkColors.border,
    backgroundColor: Platform.OS === 'web' ? 'rgba(20,25,35,0.6)' : darkColors.card,
    borderRadius: 16,
    overflow: 'hidden',
    flex: 1,
  },
  leftBar: { width: 6, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  cardContent: { padding: 20 },
  headerRow: { flexDirection: 'column', alignItems: 'flex-start', gap: 8 as any },
  title: { fontSize: 20, fontFamily: fonts.bold },
  desc: { marginTop: 8, fontSize: 14, fontFamily: fonts.regular },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6 as any, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontSize: 12, fontFamily: fonts.medium },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 18, fontFamily: fonts.bold, marginBottom: 8 },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, marginBottom: 8 },
  attachmentText: { flex: 1, marginLeft: 8, fontSize: 14, fontFamily: fonts.medium },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  input: { flex: 1, fontSize: 14, fontFamily: fonts.regular },
  sendBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginLeft: 8 },
  commentList: { marginTop: 12, gap: 8 as any },
  commentItem: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  commentAuthor: { fontSize: 13, fontFamily: fonts.bold },
  commentText: { fontSize: 14, fontFamily: fonts.regular },
  commentMeta: { fontSize: 11, fontFamily: fonts.medium, marginTop: 2 },
  roleBadge: { marginLeft: 8, borderWidth: 1, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  roleText: { fontSize: 11, fontFamily: fonts.medium },
  deleteBtn: { padding: 4, marginLeft: 8, borderRadius: 8 },
  sidePanel: {
    width: Platform.OS === 'web' ? 340 : '100%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  sideHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sideTitle: { fontSize: 16, fontFamily: fonts.bold },
  sideStatus: { fontSize: 13, fontFamily: fonts.medium },
  submitBtn: { marginTop: 8, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  submitText: { fontSize: 14, fontFamily: fonts.medium },
});
