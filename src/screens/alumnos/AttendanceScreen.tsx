import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert, ScrollView, Modal, TextInput } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Student, listStudentsByCourse } from '../../services/students';
import { createActivity, listActivitiesByCourse, Activity } from '../../services/activities';
import { listCourses, Course } from '../../services/courses';
import { darkColors } from '../../theme/colors';
import NeonButton from '../../components/NeonButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<any>;

export default function AttendanceScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const courseId = (route as any)?.params?.filterCourseId as string | undefined;
  const [students, setStudents] = useState<Student[]>([]);
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyDate, setHistoryDate] = useState<string>('');
  const [historyInput, setHistoryInput] = useState<string>('');
  const [historyItems, setHistoryItems] = useState<Activity[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<Activity | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [calYear, setCalYear] = useState<number>(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState<number>(new Date().getMonth()); // 0-11
  const webDateRef = useRef<any>(null);

  useEffect(() => {
    listCourses().then(setCourses).catch(() => setCourses([]));
  }, []);

  const courseName = useMemo(() => {
    if (!courseId) return '';
    const c = courses.find(x => x.id === courseId);
    return c?.title ?? '';
  }, [courses, courseId]);

  const load = async () => {
    if (!courseId) {
      setError('Falta el identificador de la clase');
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await listStudentsByCourse(courseId);
      setStudents(data);
      const initial: Record<string, boolean> = {};
      data.forEach(s => { if (s.id) initial[s.id] = true; });
      setPresent(initial);
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar estudiantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [courseId]);

  // Historial: util y carga por fecha
  const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const loadHistory = async (ymd: string) => {
    if (!courseId) return;
    setHistoryLoading(true);
    try {
      const items = await listActivitiesByCourse(courseId);
      const filtered = items.filter(it => {
        if ((it.category || '').toLowerCase() !== 'asistencia') return false;
        const ts: any = (it as any).createdAt;
        let d: Date | null = null;
        if (ts?.toDate) d = ts.toDate();
        else if (typeof ts === 'string') d = new Date(ts);
        else if (typeof ts === 'number') d = new Date(ts);
        else if (ts instanceof Date) d = ts;
        if (!d) return false;
        const itemYmd = toYMD(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
        return itemYmd === ymd;
      });
      setHistoryItems(filtered);
      setHistoryDate(ymd);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo cargar el historial');
    } finally {
      setHistoryLoading(false);
      setHistoryOpen(false);
    }
  };

  const parseAbsentNames = (desc?: string): string[] => {
    if (!desc) return [];
    const idx = desc.toLowerCase().indexOf('ausentes:');
    if (idx === -1) return [];
    const tail = desc.substring(idx + 'ausentes:'.length).trim();
    return tail
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  };

  const openHistoryDetail = (item: Activity) => {
    setSelectedHistory(item);
    setDetailOpen(true);
  };

  const onSave = async () => {
    if (!courseId) return;
    setSaving(true);
    try {
      const date = new Date();
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      const title = `Asistencia - ${dd}/${mm}/${yyyy}`;
      const presentCount = students.filter(s => s.id && present[s.id]).length;
      const absentList = students.filter(s => s.id && !present[s.id]).map(s => `${s.firstName} ${s.lastName ?? ''}`.trim());
      const description = `Presentes: ${presentCount}/${students.length}` + (absentList.length ? `\nAusentes: ${absentList.join(', ')}` : '');
      await createActivity({
        title,
        description,
        category: 'Asistencia',
        courseId,
        priority: 'media',
        completed: true,
      });
      Alert.alert('Asistencia guardada', 'Se registró la asistencia como una actividad.');
      navigation.navigate('Activities', { filterCourseId: courseId });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar la asistencia');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <View style={[styles.header, { borderBottomColor: darkColors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Asistencia</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <NeonButton
            title={'Historial'}
            onPress={() => { setHistoryInput(toYMD(new Date())); setHistoryOpen(true); }}
            colors={{ ...colors, primary: darkColors.accent } as any}
            shadowRadius={12}
            elevation={6}
            style={[styles.headerBtn, { backgroundColor: darkColors.accent, marginRight: 8 }]}
            textStyle={styles.headerBtnText}
          />
          <NeonButton
            title={saving ? 'Guardando...' : 'Guardar'}
            onPress={onSave}
            colors={{ ...colors, primary: darkColors.success } as any}
            shadowRadius={12}
            elevation={6}
            style={[styles.headerBtn, { backgroundColor: darkColors.success }]}
            textStyle={styles.headerBtnText}
          />
        </View>
      </View>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />}
      {!!error && <Text style={[styles.error, { color: '#d32f2f' }]}>{error}</Text>}

      {!!historyDate && (
        <View style={[styles.historyBox, { borderColor: darkColors.border }] }>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.historyTitle, { color: colors.text }]}>Historial · {historyDate}</Text>
            {historyLoading && <ActivityIndicator color={colors.primary} />}
          </View>
          {historyItems.length === 0 && !historyLoading ? (
            <Text style={[styles.historyEmpty, { color: darkColors.mutedText }]}>No hay registros de asistencia ese día.</Text>
          ) : (
            <View>
              {historyItems.map(it => (
                <TouchableOpacity key={it.id} onPress={() => openHistoryDetail(it)} activeOpacity={0.85} style={[styles.historyItem, { borderColor: darkColors.border }] }>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="calendar-check" size={18} color={darkColors.accent} />
                    <Text style={[styles.historyItemTitle, { color: colors.text }]}>{it.title}</Text>
                  </View>
                  {!!it.description && (
                    <Text style={[styles.historyItemDesc, { color: darkColors.mutedText }]}>{it.description}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {!loading && students.length === 0 && (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>No hay estudiantes en esta clase.</Text>
      )}

      {!loading && students.length > 0 && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }}>
          {students.map(s => {
            const checked = !!present[s.id!];
            return (
              <TouchableOpacity key={s.id} style={[styles.row, { borderColor: darkColors.border, backgroundColor: Platform.OS === 'web' ? 'rgba(20,25,35,0.5)' : darkColors.card }]} activeOpacity={0.8} onPress={() => setPresent(prev => ({ ...prev, [s.id!]: !checked }))}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name={checked ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'} size={20} color={checked ? darkColors.success : darkColors.mutedText} />
                  <Text style={[styles.rowText, { color: colors.text }]}>{`${s.firstName} ${s.lastName ?? ''}`.trim()}</Text>
                </View>
                <Text style={[styles.status, { color: checked ? darkColors.success : darkColors.mutedText }]}>{checked ? 'Presente' : 'Ausente'}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={historyOpen} transparent animationType="fade" onRequestClose={() => setHistoryOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: darkColors.border }] }>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Seleccione una fecha</Text>
            <Text style={[styles.modalHelp, { color: darkColors.mutedText }]}>Puede cargar manualmente en formato YYYY-MM-DD.</Text>
            {/* Calendario (Web: input nativo; Móvil: simple grid) */}
            {Platform.OS === 'web' ? (
              <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: darkColors.border }] }>
                {React.createElement('style', {
                  dangerouslySetInnerHTML: { __html: `.history-date-input { color-scheme: dark; }` },
                })}
                {React.createElement('input', {
                  type: 'date',
                  className: 'history-date-input',
                  value: historyInput,
                  ref: (el: any) => { webDateRef.current = el; },
                  onChange: (e: any) => setHistoryInput(e?.target?.value ?? ''),
                  style: {
                    flex: 1,
                    background: 'transparent',
                    color: (colors as any).text,
                    border: 'none',
                    outline: 'none',
                    fontSize: 16,
                    padding: 0,
                    height: 28,
                    accentColor: (colors as any).primary,
                    caretColor: (colors as any).primary,
                  },
                })}
              </View>
            ) : (
              <>
                <View style={[styles.inputRow, { borderColor: darkColors.border, backgroundColor: colors.card }]}>
                  <TextInput
                    value={historyInput}
                    onChangeText={setHistoryInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={darkColors.mutedText}
                    style={[styles.inputField, { color: colors.text }]}
                  />
                  <TouchableOpacity onPress={() => { /* toggle calendar could be added */ }} style={styles.inputIcon}>
                    <MaterialCommunityIcons name="calendar" size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <View style={styles.calHeaderRow}>
                  <TouchableOpacity
                    style={styles.calNavBtn}
                    onPress={() => {
                      const m = calMonth - 1;
                      if (m < 0) { setCalMonth(11); setCalYear(calYear - 1); } else { setCalMonth(m); }
                    }}
                  >
                    <MaterialCommunityIcons name="chevron-left" size={20} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.calTitle, { color: colors.text }]}>{new Date(calYear, calMonth, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })}</Text>
                  <TouchableOpacity
                    style={styles.calNavBtn}
                    onPress={() => {
                      const m = calMonth + 1;
                      if (m > 11) { setCalMonth(0); setCalYear(calYear + 1); } else { setCalMonth(m); }
                    }}
                  >
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <View style={styles.calWeekRow}>
                  {['L','M','X','J','V','S','D'].map((d, i) => (
                    <Text key={i} style={[styles.calWeekCell, { color: darkColors.mutedText }]}>{d}</Text>
                  ))}
                </View>
                {(() => {
                  const firstDay = new Date(calYear, calMonth, 1).getDay();
                  const startOffset = (firstDay + 6) % 7; // L=0
                  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                  const cells: (number | null)[] = [];
                  for (let i = 0; i < startOffset; i++) cells.push(null);
                  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                  const rows: (number | null)[][] = [];
                  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
                  const selected = (() => {
                    const m = /^\d{4}-\d{2}-\d{2}$/.exec(historyInput || '');
                    if (!m) return null;
                    const dt = new Date(historyInput);
                    if (dt.getFullYear() === calYear && dt.getMonth() === calMonth) return dt.getDate();
                    return null;
                  })();
                  return (
                    <View>
                      {rows.map((row, ri) => (
                        <View key={ri} style={styles.calRow}>
                          {row.map((day, di) => {
                            if (!day) return <View key={di} style={styles.calCell} />;
                            const ymd = toYMD(new Date(calYear, calMonth, day));
                            const isSel = selected === day;
                            return (
                              <TouchableOpacity
                                key={di}
                                style={[styles.calCell, isSel ? { backgroundColor: darkColors.accent, borderRadius: 8 } : null]}
                                onPress={() => setHistoryInput(ymd)}
                              >
                                <Text style={[styles.calCellText, { color: isSel ? '#fff' : colors.text }]}>{day}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ))}
                    </View>
                  );
                })()}
              </>
            )}
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <NeonButton
                title={'Hoy'}
                onPress={() => setHistoryInput(toYMD(new Date()))}
                colors={{ ...colors, primary: darkColors.primary } as any}
                shadowRadius={10}
                elevation={4}
                style={[styles.modalQuickBtn, { backgroundColor: darkColors.primary }]}
                textStyle={styles.modalQuickText}
              />
              <NeonButton
                title={'Ayer'}
                onPress={() => { const d = new Date(); d.setDate(d.getDate() - 1); setHistoryInput(toYMD(d)); }}
                colors={{ ...colors, primary: darkColors.secondary } as any}
                shadowRadius={10}
                elevation={4}
                style={[styles.modalQuickBtn, { backgroundColor: darkColors.secondary }]}
                textStyle={styles.modalQuickText}
              />
            </View>
            {Platform.OS !== 'web' && null}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity onPress={() => setHistoryOpen(false)} style={[styles.modalBtn, { borderColor: darkColors.border }] }>
                <Text style={[styles.modalBtnText, { color: darkColors.mutedText }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const ok = /^\d{4}-\d{2}-\d{2}$/.test(historyInput.trim());
                  if (!ok) { Alert.alert('Fecha inválida', 'Use el formato YYYY-MM-DD'); return; }
                  loadHistory(historyInput.trim());
                }}
                style={[styles.modalBtn, { marginLeft: 8, borderColor: darkColors.success } ]}
              >
                <Text style={[styles.modalBtnText, { color: darkColors.success }]}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal detalle de asistencia del día seleccionado */}
      <Modal visible={detailOpen} transparent animationType="fade" onRequestClose={() => setDetailOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: darkColors.border }] }>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Detalle de asistencia</Text>
            {!!selectedHistory && (
              <>
                <Text style={[styles.modalHelp, { color: darkColors.mutedText }]}>{selectedHistory.title}</Text>
                {(() => {
                  const absents = parseAbsentNames(selectedHistory.description);
                  const absentSet = new Set(absents.map(n => n.toLowerCase()));
                  const presentNames = students
                    .map(s => `${s.firstName} ${s.lastName ?? ''}`.trim())
                    .filter(n => !absentSet.has(n.toLowerCase()));
                  return (
                    <View style={{ marginTop: 12 }}>
                      <Text style={[styles.historyTitle, { color: colors.text }]}>Presentes</Text>
                      {presentNames.length === 0 ? (
                        <Text style={[styles.historyEmpty, { color: darkColors.mutedText }]}>Ninguno</Text>
                      ) : (
                        presentNames.map((n, idx) => (
                          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                            <MaterialCommunityIcons name="checkbox-marked-circle" size={16} color={darkColors.success} />
                            <Text style={{ marginLeft: 8, color: colors.text }}>{n}</Text>
                          </View>
                        ))
                      )}
                      <Text style={[styles.historyTitle, { color: colors.text, marginTop: 12 }]}>Ausentes</Text>
                      {absents.length === 0 ? (
                        <Text style={[styles.historyEmpty, { color: darkColors.mutedText }]}>Ninguno</Text>
                      ) : (
                        absents.map((n, idx) => (
                          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                            <MaterialCommunityIcons name="close-circle" size={16} color={darkColors.error} />
                            <Text style={{ marginLeft: 8, color: colors.text }}>{n}</Text>
                          </View>
                        ))
                      )}
                    </View>
                  );
                })()}
              </>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity onPress={() => setDetailOpen(false)} style={[styles.modalBtn, { borderColor: darkColors.border }] }>
                <Text style={[styles.modalBtnText, { color: colors.text }]}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '700' },
  headerBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  headerBtnText: { color: '#fff', fontWeight: '700' },
  error: { marginTop: 8, textAlign: 'center' },
  empty: { marginTop: 12, textAlign: 'center' },
  row: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowText: { marginLeft: 10, fontSize: 15 },
  status: { fontSize: 12, fontWeight: '700' },
  historyBox: { marginTop: 12, padding: 12, borderWidth: 1, borderRadius: 12 },
  historyTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  historyEmpty: { fontSize: 12 },
  historyItem: { marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
  historyItemTitle: { marginLeft: 6, fontSize: 13, fontWeight: '600' },
  historyItemDesc: { fontSize: 12, marginTop: 6 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalBox: { width: '100%', maxWidth: 420, borderRadius: 14, borderWidth: 1, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  modalHelp: { fontSize: 12, marginTop: 4 },
  modalQuickBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginRight: 8 },
  modalQuickText: { fontSize: 12, fontWeight: '600' },
  modalInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: Platform.OS === 'web' ? 10 : 8, marginTop: 10 },
  modalBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  modalBtnText: { fontSize: 12, fontWeight: '700' },
  // Input combinado
  inputRow: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: Platform.OS === 'web' ? 6 : 6, flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  inputField: { flex: 1, fontSize: 16, paddingVertical: 4 },
  inputIcon: { marginLeft: 8, padding: 6, borderRadius: 8 },
  // Estilos calendario móvil
  calHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  calNavBtn: { padding: 6, borderRadius: 8 },
  calTitle: { fontSize: 14, fontWeight: '700' },
  calWeekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  calWeekCell: { width: 36, textAlign: 'center', fontSize: 12 },
  calRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  calCell: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  calCellText: { fontSize: 12, fontWeight: '600' },
});
