import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { listCourses } from '../services/courses';
import { listWorkshops } from '../services/workshops';
import { listStudents } from '../services/students';
import { listActivities, Activity } from '../services/activities';
import { darkColors, lightColors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<any>;

export default function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const palette = colors.background === darkColors.background ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const user = auth?.currentUser || null;
  const username = user?.displayName || user?.email?.split('@')[0] || 'Usuario Demo';
  const photoURL = user?.photoURL || null;
  const initial = (username?.[0] || 'U').toUpperCase();

  const [coursesCount, setCoursesCount] = useState(0);
  const [workshopsCount, setWorkshopsCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [activitiesCount, setActivitiesCount] = useState(0);
  const [evaluationsThisWeek, setEvaluationsThisWeek] = useState(0);
  const [upcoming, setUpcoming] = useState<Activity[]>([]);
  const [fabOpen, setFabOpen] = useState(false);

  const loadCounts = async () => {
    try {
      const [c, w, s, a] = await Promise.all([
        listCourses(),
        listWorkshops(),
        listStudents(),
        listActivities(),
      ]);
      setCoursesCount(c.length);
      setWorkshopsCount(w.length);
      setStudentsCount(s.length);
      setActivitiesCount(a.length);

      const now = new Date();
      const end = new Date(now);
      end.setDate(now.getDate() + 7);
      const evalsWeek = a.filter(x => (
        (x.category || '').toLowerCase().includes('evalu') &&
        x.dueDate && new Date(x.dueDate) >= now && new Date(x.dueDate) <= end
      )).length;
      setEvaluationsThisWeek(evalsWeek);

      const upcomingSorted = a
        .filter(x => !!x.dueDate)
        .sort((a1, a2) => new Date(a1.dueDate!).getTime() - new Date(a2.dueDate!).getTime());
      setUpcoming(upcomingSorted.slice(0, 5));
    } catch (e) {
      // En caso de error, mantenemos los contadores como están
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadCounts);
    return unsubscribe;
  }, [navigation]);

  const onCreateCourse = () => navigation.navigate('CourseCreate')
  const onCreateWorkshop = () => navigation.navigate('WorkshopCreate');
  const onRegisterStudent = () => navigation.navigate('StudentCreate')
  const onScheduleActivity = () => navigation.navigate('ActivityCreate');

  const formatDueDate = (iso?: string) => {
    if (!iso) return 'Sin fecha';
    const d = new Date(iso);
    const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${weekdays[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${months[d.getMonth()]}`;
  };

  const proximityLabel = (iso?: string) => {
    if (!iso) return 'Sin fecha';
    const d = new Date(iso);
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDue = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((startDue.getTime() - startToday.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays >= 2 && diffDays <= 7) return `Vence en ${diffDays} días`;
    if (diffDays < 0 && diffDays >= -7) return `Hace ${Math.abs(diffDays)} días`;
    return formatDueDate(iso);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        {/* AppBar superior */}
-        <View style={styles.headerRow}>
+        <View style={styles.headerRow}>
           <Text style={[styles.greetingTitle, { color: colors.text }]}>¡Hola, {username}!</Text>
           <View style={styles.appbarAvatarWrap}>
             {photoURL ? (
               <TouchableOpacity onPress={() => navigation.navigate('ProfileSettings')}>
                 <Image source={{ uri: photoURL }} style={styles.appbarAvatar} />
               </TouchableOpacity>
             ) : (
               <TouchableOpacity onPress={() => navigation.navigate('ProfileSettings')}>
                 <View style={[styles.appbarAvatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                   <Text style={styles.appbarAvatarText}>{initial}</Text>
                 </View>
               </TouchableOpacity>
             )}
           </View>
         </View>

        {/* Saludo */}
        {/* Título movido al header; mantenemos solo el subtítulo */}
        <Text style={[styles.greetingSubtitle, { color: palette.mutedText }]}>Aquí tienes el resumen de tu día.</Text>

        {/* Resumen general: tarjetas en columna ocupando todo el ancho */}
        <View style={styles.tilesStack}>
          <TouchableOpacity style={[styles.tileLargePrimaryNeon, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => navigation.navigate('Activities')}>
            <Text style={styles.tileTitleOnPrimary}>Actividades Pendientes</Text>
            <View style={styles.tileContent}>
              <View>
                <Text style={styles.tileNumberOnPrimary}>{activitiesCount}</Text>
                <Text style={styles.tileNoteOnPrimary}>
                  {evaluationsThisWeek > 0 ? `${evaluationsThisWeek} Evaluaciones esta semana` : 'Sin evaluaciones esta semana'}
                </Text>
              </View>
              <View style={[styles.tileIconOnPrimaryWrap, { shadowColor: colors.primary, shadowOpacity: 0.9, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } }]}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={22} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tileSmallFull, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('Courses')}>
            <Text style={[styles.tileTitle, { color: colors.text }]}>Carga Activa</Text>
            <View style={styles.tileSplitRow}>
              <View style={styles.tileSplitCol}>
                <Text style={[styles.tileSplitLabel, { color: palette.mutedText }]}>Cursos</Text>
                <Text style={[styles.tileSplitNumber, { color: colors.text }]}>{coursesCount}</Text>
              </View>
              <View style={styles.tileSplitCol}>
                <Text style={[styles.tileSplitLabel, { color: palette.mutedText }]}>Talleres</Text>
                <Text style={[styles.tileSplitNumber, { color: colors.text }]}>{workshopsCount}</Text>
              </View>
            </View>
+            <Text style={[styles.tileNote, { color: palette.mutedText, marginTop: 6 }]}>Total: {coursesCount + workshopsCount}</Text>
          </TouchableOpacity>

-          <TouchableOpacity style={[styles.tileSmallFull, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('Students')}>
-            <Text style={[styles.tileTitle, { color: colors.text }]}>Estudiantes</Text>
-            <Text style={[styles.tileNote, { color: palette.mutedText }]}>{studentsCount} {studentsCount === 1 ? 'alumno activo' : 'alumnos activos'}</Text>
-          </TouchableOpacity>
+          <TouchableOpacity style={[styles.tileSmallFull, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('Students')}>
+            <Text style={[styles.tileTitle, { color: colors.text }]}>Estudiantes</Text>
+            <Text style={[styles.tileNote, { color: palette.mutedText }]}>{studentsCount} {studentsCount === 1 ? 'alumno activo' : 'alumnos activos'}</Text>
+            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
+              <MaterialCommunityIcons name="account-group" size={16} color={colors.primary} />
+              <Text style={[styles.tileNote, { color: colors.primary, marginLeft: 6 }]}>Ver lista ›</Text>
+            </View>
+          </TouchableOpacity>
        </View>

        {/* Actividades próximas */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Próximamente</Text>
         {upcoming.length === 0 ? (
           <Text style={{ color: palette.mutedText, paddingHorizontal: 12, paddingVertical: 10 }}>No hay actividades próximas</Text>
         ) : (
           upcoming.slice(0, 2).map(item => (
             <UpcomingCard
               key={item.id}
               colors={colors}
               title={item.title}
               proximity={proximityLabel(item.dueDate)}
               timeLabel={item.dueDate ? new Date(item.dueDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : undefined}
               category={item.category}
             />
           ))
         )}


      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ colors, title, value, icon, onPress }: { colors: any; title: string; value: string; icon: string; onPress?: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} disabled={!onPress}>
      <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.summaryTop}>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{value}</Text>
          <View style={[styles.summaryIconWrap, { backgroundColor: colors.background, borderColor: colors.border }] }>
            <Text style={[styles.summaryIcon, { color: colors.text }]}>{icon}</Text>
          </View>
        </View>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

function ActionRow({ colors, icon, title, subtitle, onPress }: { colors: any; icon: string; title: string; subtitle: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: colors.background }]}><Text style={styles.actionIconText}>{icon}</Text></View>
      <View style={styles.actionTextWrap}>
        <Text style={[styles.actionTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.actionSubtitle, { color: colors.mutedText }]}>{subtitle}</Text>
      </View>
      <Text style={[styles.chevron, { color: colors.mutedText }]}>›</Text>
    </TouchableOpacity>
  );
}

function UpcomingCard({ colors, title, proximity, timeLabel, category }: { colors: any; title: string; proximity: string; timeLabel?: string; category?: string }) {
  const primaryNeonBg = 'rgba(25,118,210,0.18)';
  const primaryNeonBorder = 'rgba(25,118,210,0.40)';
  return (
    <View style={[styles.upcomingCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.primary, shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }]}>
      <View style={[styles.upcomingIconBubble, { backgroundColor: primaryNeonBg, borderColor: primaryNeonBorder, shadowColor: colors.primary, shadowOpacity: 0.9, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }]}>
        <MaterialCommunityIcons name="calendar" size={18} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.upcomingTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.upcomingMeta, { color: colors.mutedText }]}>
          {proximity}{timeLabel ? ` • ${timeLabel}` : ''}
        </Text>
        {category ? (
          <Text style={[styles.categoryChip, { color: colors.text, borderColor: colors.primary }]}>{category}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 0,
  },
+  headerRow: {
+    flexDirection: 'row',
+    alignItems: 'center',
+    justifyContent: 'space-between',
+    marginTop: 12,
+  },
  appbar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 0,
  },
  appbarTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: fonts.brand,
  },
  appbarAvatarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appbarAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  appbarAvatarText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
  },
  greetingTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
  },
  greetingSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    width: '48%',
    minWidth: 160,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  summaryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  summaryIcon: {
    fontSize: 18,
  },
  summaryTitle: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  quickActions: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  actionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionIconText: {
    color: '#fff',
    fontSize: 14,
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionSubtitle: {
    marginTop: 2,
    fontSize: 12,
  },
  chevron: {
    fontSize: 20,
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '700',
  },
  upcomingList: {
    marginTop: 4,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  upcomingTextWrap: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  upcomingDetail: {
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 64,
  },
  headerInfo: {
    marginLeft: 16,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
  },
  brand: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Sección de acciones principales reemplazada por lista de acciones rápidas
  signout: {
    marginTop: 24,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Dashboard tiles
  tilesStack: {
    flexDirection: 'column',
    gap: 12,
  },
  tileLargePrimaryNeon: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    shadowOpacity: 0.75,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  tileTitleOnPrimary: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  tileNumberOnPrimary: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  tileNoteOnPrimary: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  tileIconOnPrimaryWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.25)'
  },
  // ---- NUEVOS ESTILOS PARA REPLICAR LA CAPTURA ----
  tileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tilesCol: {
    width: '100%',
    gap: 12,
  },
  tileSmallFull: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  tileNote: {
    fontSize: 12,
    fontWeight: '600',
  },
  tileSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  tileSplitCol: {
    flex: 1,
  },
  tileSplitLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  tileSplitNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  // -----------------------------------------------
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%',
    marginBottom: 8,
  },
  upcomingIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  upcomingMeta: {
    fontSize: 12,
    marginTop: 2,
  },
});

// Remove quick actions and FAB styles usage by keeping styles but not rendering those sections.