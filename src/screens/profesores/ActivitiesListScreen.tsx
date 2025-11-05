// Listado de actividades para profesores.
// Permite filtrar, marcar como completada, eliminar y navegar.
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import { darkColors } from '../../theme/colors';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { listActivities, Activity, deleteActivity, listActivitiesByCourse, listActivitiesByWorkshop, updateActivity } from '../../services/activities';
import ManagementCard from '../../components/ManagementCard';
import NeonButton from '../../components/NeonButton';
import { listCourses, Course, ensureCourseShareCode, getCourse } from '../../services/courses';
import { auth } from '../../config/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<any>;

export default function ActivitiesListScreen({ navigation, route }: Props) {
  const { colors } = useTheme(); // Colores del tema activo
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Activity[]>([]); // Lista de actividades
  const [loading, setLoading] = useState(true); // Indicador de carga
  const [error, setError] = useState<string | null>(null); // Errores de carga
  const [courses, setCourses] = useState<Course[]>([]); // Cursos para mostrar asignación y código
  const [codeOpen, setCodeOpen] = useState(false); // Popup de código de clase
  const [codeBusy, setCodeBusy] = useState(false); // Indicador de obtención de código
  const [codeValue, setCodeValue] = useState(''); // Valor del código
  const [query, setQuery] = useState(''); // Texto de búsqueda
  const [filter, setFilter] = useState<'Todas' | 'Pendientes' | 'Completadas' | 'Vencidas' | 'Alta' | 'Media' | 'Baja'>('Todas'); // Filtro activo
  const courseTitleById = useMemo(() => Object.fromEntries(courses.map(c => [c.id!, c.title])), [courses]); // Mapa id->título
  const filterCourseId = (route as any)?.params?.filterCourseId as string | undefined; // Filtro por curso
  const selectedCourse = useMemo(() => courses.find(c => c.id === filterCourseId), [courses, filterCourseId]); // Curso seleccionado

  // Tokens portados desde "actividades" basados en el tema oscuro
  // Tokens de color locales (tema oscuro por defecto)
  const T = {
    bg: darkColors.background,
    card: darkColors.card,
    text: darkColors.text,
    textMuted: darkColors.mutedText,
    border: darkColors.border,
    primary: darkColors.primary,
    secondary: darkColors.secondary,
    accent: darkColors.accent,
    prioHigh: darkColors.error,
    prioMedium: darkColors.warning,
    prioLow: darkColors.success,
  } as const;
  const HEX = T;

  // Carga actividades según filtro por curso/taller
  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const filterCourseId = (route as any)?.params?.filterCourseId as string | undefined;
      const filterWorkshopId = (route as any)?.params?.filterWorkshopId as string | undefined;
      let data: Activity[];
      if (filterCourseId) {
        data = await listActivitiesByCourse(filterCourseId);
      } else if (filterWorkshopId) {
        data = await listActivitiesByWorkshop(filterWorkshopId);
      } else {
        data = await listActivities();
      }
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar actividades');
    } finally {
      setLoading(false);
    }
  };

  // Recarga cuando la pantalla gana foco
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    // Carga nombres de cursos para mostrar asignaciones y códigos
    listCourses().then(setCourses).catch(() => setCourses([]));
  }, []);

  // Info de vencimiento para estilos y filtro "Vencidas"
  // Cálculo de vencimiento para estilos y filtro "Vencidas"
  const getDueInfo = (due?: string, completed?: boolean): { kind?: 'overdue' | 'today' | 'tomorrow' | 'date'; label?: string } => {
    if (!due) return {};
    try {
      const now = new Date();
      const d = new Date(due);
      // Normalizar a inicio de día
      now.setHours(0, 0, 0, 0);
      d.setHours(0, 0, 0, 0);
      const diffDays = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (!completed && diffDays < 0) return { kind: 'overdue', label: 'Vencida' };
      if (diffDays === 0) return { kind: 'today', label: 'Vence Hoy' };
      if (diffDays === 1) return { kind: 'tomorrow', label: 'Vence Mañana' };
      return { kind: 'date', label: `Vence ${d.toLocaleDateString()}` };
    } catch {
      return {};
    }
  };

  // Filtra por texto y estado (pendiente/completada/vencida)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesText = (
        (item.title ?? '').toLowerCase().includes(q) ||
        (item.description ?? '').toLowerCase().includes(q)
      );
      const dueInfo = getDueInfo(item.dueDate, item.completed);
      const isOverdue = dueInfo.kind === 'overdue';
      const matchesFilter = (
        filter === 'Todas' ||
        (filter === 'Pendientes' && !item.completed) ||
        (filter === 'Completadas' && !!item.completed) ||
        (filter === 'Vencidas' && isOverdue)
      );
      return matchesText && matchesFilter;
    });
  }, [items, query, filter]);

  // Marca/desmarca una actividad como completada
  const toggleCompleted = async (id?: string, current?: boolean) => {
    if (!id) return;
    try {
      await updateActivity(id, { completed: !current });
      setItems(prev => prev.map(it => it.id === id ? { ...it, completed: !current } : it));
    } catch (e) {}
  };

  // Elimina actividad (con confirmación) y recarga
  const onDelete = async (id?: string) => {
    if (!id) return;
    Alert.alert('Eliminar actividad', '¿Seguro que deseas eliminarla?', [
      { text: 'Cancelar' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await deleteActivity(id); load(); } },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top, 8), paddingBottom: 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="clipboard-list" size={18} color={T.text} />
          <Text style={[styles.title, { color: T.text }]}>Actividades</Text>
        </View>
        <View style={styles.headerRight}>
          {(((route as any)?.params?.filterCourseId as string | undefined) || ((route as any)?.params?.filterWorkshopId as string | undefined)) && (
            <NeonButton
              title="Alumnos"
              onPress={() => {
                const filterCourseId = (route as any)?.params?.filterCourseId as string | undefined;
                const filterWorkshopId = (route as any)?.params?.filterWorkshopId as string | undefined;
                if (filterCourseId) {
                  navigation.navigate('Students', { filterCourseId });
                } else if (filterWorkshopId) {
                  navigation.navigate('Students', { filterWorkshopId });
                }
              }}
              colors={{ ...colors, primary: T.secondary } as any}
              shadowRadius={12}
              elevation={6}
              style={[styles.addBtn, { backgroundColor: T.secondary }]}
              textStyle={[styles.addText, { color: T.text }]}
            />
          )}
          {!!filterCourseId && (
            <NeonButton
              title="Código"
              onPress={async () => {
                setCodeOpen(true);
                setCodeBusy(true);
                try {
                  const course = await getCourse(filterCourseId);
                  let code = course?.shareCode || '';
                  if (!code) {
                    code = await ensureCourseShareCode(filterCourseId);
                    setCourses(prev => prev.map(c => c.id === filterCourseId ? { ...c, shareCode: code } as any : c));
                  }
                  setCodeValue(code);
                } catch (e) {
                  setCodeValue('');
                } finally {
                  setCodeBusy(false);
                }
              }}
              colors={{ ...colors, primary: T.accent } as any}
              shadowRadius={12}
              elevation={6}
              style={[styles.addBtn, { backgroundColor: T.accent }]}
              textStyle={styles.addText}
            />
          )}
          <NeonButton
            title="+ Agregar"
            onPress={() => navigation.navigate('ActivityCreate')}
            colors={{ ...colors, primary: T.primary } as any}
            shadowRadius={12}
            elevation={6}
            style={[styles.addBtn, { backgroundColor: T.primary }]}
            textStyle={styles.addText}
          />
      </View>
      </View>

    {/* Popup de código de clase */}
    {codeOpen && (
      <View style={styles.codePopup}>
        <View style={styles.codeRow}>
          <MaterialCommunityIcons name="key" size={16} color={T.accent} />
          <Text style={[styles.codeText, { color: T.text }]}>{codeBusy ? '...' : (codeValue || selectedCourse?.shareCode || '—')}</Text>
          {Platform.OS === 'web' && (
            <TouchableOpacity
              style={[styles.copyBtn, { backgroundColor: T.primary }]}
              onPress={async () => {
                try {
                  const toCopy = codeValue || selectedCourse?.shareCode || '';
                  if (!toCopy) return;
                  await (navigator as any)?.clipboard?.writeText(toCopy);
                  Alert.alert('Copiado', 'Código copiado al portapapeles');
                } catch {
                  Alert.alert('Aviso', 'No se pudo copiar automáticamente');
                }
              }}
            >
              <Text style={styles.addText}>Copiar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setCodeOpen(false)}>
            <MaterialCommunityIcons name="close" size={16} color={T.text} />
          </TouchableOpacity>
        </View>
      </View>
    )}

      {/* Barra de búsqueda (glass) */}
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchBox,
            Platform.OS === 'web'
              ? ({ backgroundColor: 'rgba(42,42,58,0.7)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } as any)
              : { backgroundColor: HEX.card },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={16} color={T.accent} />
          <TextInput
            placeholder="Buscar actividades..."
            placeholderTextColor={T.textMuted}
            value={query}
            onChangeText={setQuery}
            style={[styles.searchInput, { color: T.text }]}
          />
        </View>
      </View>

      {/* Filtros horizontales - removidos filtros de prioridad */}
      <View style={styles.filtersRow}>
        {(['Todas', 'Pendientes', 'Completadas', 'Vencidas'] as const).map((f) => {
          const active = filter === f;
          return (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.chip, active && styles.chipActive, { borderColor: T.accent }]} activeOpacity={0.8}>
              <Text style={[styles.chipText, active && styles.chipTextActive, { color: active ? T.bg : T.text }]}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />}
      {!!error && <Text style={[styles.error, { color: T.prioHigh }]}>{error}</Text>}

      {!loading && filtered.length === 0 && (
        <Text style={[styles.empty, { color: HEX.textMuted }]}>No hay actividades que coincidan.</Text>
      )}

      {/* Tarjetas estilo glassmorphism */}
      {!loading && filtered.map(item => {
        const prioColor = item.priority === 'alta' ? HEX.prioHigh : item.priority === 'media' ? HEX.prioMedium : HEX.prioLow;
        const coursesText = Array.isArray(item.courseIds) && item.courseIds.length > 0
          ? item.courseIds.map(id => courseTitleById[id] ?? id).join(', ')
          : (item.courseId ? (courseTitleById[item.courseId] ?? item.courseId) : undefined);
        return (
          <View key={item.id} style={[styles.card, { borderColor: T.border, backgroundColor: Platform.OS === 'web' ? 'rgba(42,42,58,0.7)' : T.card }, Platform.OS === 'web' ? ({ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' } as any) : {}] }>
            <View style={[styles.leftBar, { backgroundColor: prioColor }]} />
            <View style={styles.cardContent}>
              <View style={styles.cardHeaderRow}>
                <TouchableOpacity onPress={() => toggleCompleted(item.id, item.completed)} style={[styles.checkbox, { borderColor: HEX.textMuted, backgroundColor: item.completed ? HEX.prioLow : 'transparent' }] }>
                  {item.completed && <MaterialCommunityIcons name="check" size={14} color={HEX.text} />}
                </TouchableOpacity>
                <Text style={[styles.cardTitle, { color: HEX.text }]}>{item.title}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ActivityCreate', { editItem: item })}>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={T.accent} />
                </TouchableOpacity>
              </View>

              {!!item.description && (
                <Text style={[styles.cardDesc, { color: HEX.textMuted }]}>{item.description}</Text>
              )}

              <View style={styles.badgesRow}>
                {!!item.dueDate && (() => {
                  const info = getDueInfo(item.dueDate, item.completed);
                  const sty =
                    info.kind === 'overdue'
                      ? { backgroundColor: 'rgba(248,113,113,0.15)', borderColor: '#F87171' }
                      : info.kind === 'today'
                      ? { backgroundColor: 'rgba(76,123,243,0.15)', borderColor: '#4C7BF3' }
                      : info.kind === 'tomorrow'
                      ? { backgroundColor: 'rgba(60,179,113,0.15)', borderColor: '#3CB371' }
                      : { backgroundColor: 'rgba(96,165,250,0.12)', borderColor: T.accent };
                  const icon = info.kind === 'overdue' ? 'alert-circle' : 'calendar-month';
                  return (
                    <View style={[styles.badge, sty]}>
                      <MaterialCommunityIcons name={icon as any} size={14} color={HEX.text} />
                      <Text style={[styles.badgeText, { color: HEX.text }]}>{info.label}</Text>
                    </View>
                  );
                })()}
                {!!coursesText && (
                  <View style={[styles.badge, { backgroundColor: 'rgba(96,165,250,0.15)', borderColor: T.accent }] }>
                    <MaterialCommunityIcons name="book-open-variant" size={14} color={HEX.text} />
                    <Text style={[styles.badgeText, { color: HEX.text }]}>{coursesText}</Text>
                  </View>
                )}
                {!!item.priority && (
                  <View style={[styles.badge, { backgroundColor: 'transparent', borderColor: prioColor }] }>
                    <MaterialCommunityIcons name={item.priority === 'alta' ? 'alert-circle' : item.priority === 'media' ? 'alert' : 'check-circle'} size={14} color={prioColor} />
                    <Text style={[styles.badgeText, { color: HEX.text }]}>{item.priority[0].toUpperCase() + item.priority.slice(1)}</Text>
                  </View>
                )}
              </View>

              {!!item.workshopId && (
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, { backgroundColor: 'rgba(96,165,250,0.15)', borderColor: T.accent }] }>
                    <MaterialCommunityIcons name="hammer-wrench" size={14} color={HEX.text} />
                    <Text style={[styles.badgeText, { color: HEX.text }]}>Taller: {item.workshopId}</Text>
                  </View>
                </View>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => {
                    const courseId = filterCourseId || item.courseId || ((item.courseIds || [])[0] || '');
                    (navigation as any).navigate('ActivitySubmissions', { activityId: item.id, courseId, activityTitle: item.title });
                  }}
                  activeOpacity={0.9}
                  style={[styles.addBtn, { backgroundColor: T.primary }]}>
                  <Text style={styles.addText}>Revisar entregas</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 as any },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 as any },
  title: { fontSize: 18, fontWeight: '700' },
  addBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addText: { color: '#1A1A2E', fontWeight: '700' },
  error: { marginTop: 8, textAlign: 'center' },
  empty: { marginTop: 12, textAlign: 'center' },
  searchRow: { marginBottom: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8 as any, borderRadius: 12, borderWidth: 1.5, borderColor: darkColors.border, paddingHorizontal: 12, paddingVertical: 10, shadowColor: darkColors.accent, shadowOpacity: Platform.OS === 'web' ? 0 : 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  searchInput: { flex: 1, fontSize: 14 },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 as any, marginBottom: 12 },
  chip: { borderWidth: 1.5, borderColor: darkColors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginRight: 6, marginBottom: 6, backgroundColor: Platform.OS === 'web' ? 'rgba(42,42,58,0.65)' : darkColors.card, ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' } as any) : {}), shadowColor: darkColors.accent, shadowOpacity: Platform.OS === 'web' ? 0 : 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  chipActive: { borderColor: darkColors.primary, backgroundColor: 'rgba(42,42,58,0.8)', shadowColor: darkColors.primary, shadowOpacity: Platform.OS === 'web' ? 0 : 0.35, shadowRadius: 8 },
  chipText: { color: darkColors.mutedText, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: darkColors.primary },
  card: { position: 'relative', borderWidth: 2, borderRadius: 14, padding: 14, marginTop: 12, shadowColor: '#0B1221', shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 7 },
  leftBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
  cardContent: { marginLeft: 8 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '700', flex: 1, marginLeft: 8 },
  cardDesc: { fontSize: 12, marginTop: 6 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 as any, marginTop: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6 as any, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1.25 },
  badgeText: { fontSize: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  codePopup: { position: 'absolute', top: 8, right: 16, borderRadius: 10, borderWidth: 1.5, borderColor: darkColors.border, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Platform.OS === 'web' ? 'rgba(42,42,58,0.8)' : darkColors.card, ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } as any) : {}), shadowColor: darkColors.accent, shadowOpacity: Platform.OS === 'web' ? 0 : 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 as any },
  codeText: { fontSize: 14, fontWeight: '700' },
  copyBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
});