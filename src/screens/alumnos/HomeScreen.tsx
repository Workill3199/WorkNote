import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, Modal, ActivityIndicator } from 'react-native';
// import { BlurView } from 'expo-blur';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { listCourses, Course } from '../../services/courses';
import { listWorkshops } from '../../services/workshops';
import { listStudents } from '../../services/students';
import { listActivities } from '../../services/activities';
import { darkColors, lightColors } from '../../theme/colors';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<any>;

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const palette = colors.background === darkColors.background ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const user = auth?.currentUser || null;
  const username = user?.displayName || user?.email?.split('@')[0] || 'Alex';
  const photoURL = user?.photoURL || null;
  const initial = (username?.[0] || 'A').toUpperCase();

  const [coursesCount, setCoursesCount] = useState(0);
  const [workshopsCount, setWorkshopsCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [activitiesCount, setActivitiesCount] = useState(0);
  const [evaluationsThisWeek, setEvaluationsThisWeek] = useState(4);
  const [classesThisWeek, setClassesThisWeek] = useState(8);
  // Picker de clase para asistencia
  const [coursePickerOpen, setCoursePickerOpen] = useState(false);
  const [coursePickerLoading, setCoursePickerLoading] = useState(false);
  const [courseItems, setCourseItems] = useState<Course[]>([]);

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
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  };

  useEffect(() => {
    loadCounts();
  }, []);

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Encabezado con blur
  const DashboardHeader = () => (
    <View style={[styles.header, { backgroundColor: palette.card }]}> 
      <View style={styles.headerContent}>
        <View style={styles.userInfo}>
          <TouchableOpacity style={styles.avatarContainer} onPress={() => navigation.navigate('ProfileSettings')} accessibilityLabel="Abrir perfil">
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: palette.primary }]}>
                <Text style={[styles.avatarText, { color: '#fff' }]}>{initial}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View>
            <View style={styles.greetingRow}>
              <Text style={[styles.greeting, { color: '#fff' }]}>¡Hola, {username}!</Text>
              <TouchableOpacity style={styles.editProfileBtn} onPress={() => navigation.navigate('ProfileSettings')} accessibilityLabel="Editar perfil">
                <MaterialCommunityIcons name="account-edit" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>Aquí tienes el resumen</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="bell" size={20} color="#fff" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const StatsCards = () => {
    const stats = [
      {
        label: 'Actividades Pendientes',
        value: activitiesCount.toString(),
        subtitle: 'Sin evaluaciones esta semana',
        icon: 'check-circle',
      },
      {
        label: 'Cursos',
        value: coursesCount.toString(),
        subtitle: 'En curso',
        icon: 'book-open-variant',
      },
      {
        label: 'Notificación',
        value: '•',
        subtitle: 'Dato: revisa tu perfil',
        icon: 'information-outline',
      },
    ];

    return (
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={[styles.statCard, { backgroundColor: palette.card }]}> 
            <View style={[styles.statIconContainer, { backgroundColor: `${palette.primary}20` }]}> 
              <MaterialCommunityIcons name={stat.icon as any} size={18} color={palette.primary} />
            </View>
            <Text style={[styles.statValue, { color: '#fff' }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  const ActiveWorkload = () => (
    <View style={[styles.card, { backgroundColor: palette.card }]}> 
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconContainer, { backgroundColor: `${palette.primary}20` }]}> 
          <MaterialCommunityIcons name="briefcase" size={14} color={palette.primary} />
        </View>
        <Text style={[styles.cardTitle, { color: '#fff' }]}>Carga Activa</Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: palette.textSecondary }]}>Evaluaciones</Text>
            <Text style={[styles.progressValue, { color: '#fff' }]}>{evaluationsThisWeek}/10</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: `${palette.primary}30` }]}> 
            <View style={[styles.progressFill, { backgroundColor: palette.primary, width: `${(evaluationsThisWeek / 10) * 100}%` }]} />
          </View>
        </View>
        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: palette.textSecondary }]}>Clases</Text>
            <Text style={[styles.progressValue, { color: '#fff' }]}>{classesThisWeek}/12</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: `${palette.primary}30` }]}> 
            <View style={[styles.progressFill, { backgroundColor: palette.primary, width: `${(classesThisWeek / 12) * 100}%` }]} />
          </View>
        </View>
      </View>
    </View>
  );

  const QuickActions = () => {
    const rootNav = navigation.getParent()?.getParent();
    const actions = [
      { icon: 'clipboard-text', label: 'Tareas pendientes', color: '#60A5FA', onPress: () => navigation.navigate('Actividades') },
      { icon: 'book-open-variant', label: 'Mis cursos', color: '#A78BFA', onPress: () => navigation.navigate('Courses') },
      { icon: 'account', label: 'Mi perfil', color: '#22D3EE', onPress: () => navigation.navigate('UserProfile') },
      { icon: 'bell', label: 'Notificaciones', color: '#34D399', onPress: () => navigation.navigate('NotificationsSettings') },
    ];

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>Acciones rápidas</Text>
        <View style={styles.actionsGrid}>
          {actions.map((action, index) => (
            <TouchableOpacity key={index} style={[styles.actionButton, { backgroundColor: palette.card }]} onPress={action.onPress}>
              <MaterialCommunityIcons name={action.icon as any} size={20} color={action.color} />
              <Text style={[styles.actionLabel, { color: '#fff' }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const UpcomingDeadlines = () => {
    const deadlines = [
      { title: 'Entrega de proyecto', date: 'Mañana', urgent: true },
      { title: 'Corrección de parciales', date: 'En 3 días', urgent: false },
      { title: 'Reunión con padres', date: 'Viernes', urgent: false },
    ];

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>Próximas fechas límite</Text>
        <View style={styles.deadlinesList}>
          {deadlines.map((deadline, index) => (
            <View key={index} style={[styles.deadlineItem, { backgroundColor: palette.card }]}> 
              <MaterialCommunityIcons name={deadline.urgent ? 'alert-circle' : 'clock'} size={16} color={deadline.urgent ? '#EF4444' : '#60A5FA'} />
              <View style={styles.deadlineContent}>
                <Text style={[styles.deadlineTitle, { color: '#fff' }]}>{deadline.title}</Text>
                <Text style={[styles.deadlineDate, { color: palette.textSecondary }]}>{deadline.date}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Lógica del selector de clase para Asistencia
  const openCoursePicker = async () => {
    setCoursePickerOpen(true);
    setCoursePickerLoading(true);
    try {
      const c = await listCourses();
      setCourseItems(c);
    } catch (e) {
      setCourseItems([]);
    } finally {
      setCoursePickerLoading(false);
    }
  };

  const navigateToAttendance = (courseId: string) => {
    setCoursePickerOpen(false);
    navigation.navigate('Attendance', { filterCourseId: courseId });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background, paddingTop: insets.top }]}>
      <DashboardHeader />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <StatsCards />
        <ActiveWorkload />
        <QuickActions />
        <UpcomingDeadlines />
      </ScrollView>
      {/* Barra inferior personalizada eliminada para evitar duplicado con Tab Navigator */}
      <Modal visible={coursePickerOpen} transparent animationType="fade" onRequestClose={() => setCoursePickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: palette.card, borderColor: 'rgba(255, 255, 255, 0.1)' }] }>
            <Text style={[styles.modalTitle, { color: '#fff' }]}>Selecciona la clase</Text>
            {coursePickerLoading ? (
              <ActivityIndicator color={palette.primary} style={{ marginTop: 12 }} />
            ) : (
              <>
                {courseItems.length === 0 ? (
                  <Text style={[styles.modalEmpty, { color: palette.textSecondary }]}>No hay cursos. Crea uno para tomar asistencia.</Text>
                ) : (
                  <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ paddingBottom: 8 }}>
                    {courseItems.map((c) => (
                      <TouchableOpacity key={c.id} style={[styles.courseItem, { borderColor: 'rgba(255, 255, 255, 0.1)' }]} activeOpacity={0.85} onPress={() => navigateToAttendance(c.id!)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <MaterialCommunityIcons name="book-open-variant" size={18} color={palette.primary} />
                          <Text style={[styles.courseItemTitle, { color: '#fff' }]}>{c.title}</Text>
                        </View>
                        <Text style={[styles.courseItemSubtitle, { color: palette.textSecondary }]}>{[c.classroom, c.schedule].filter(Boolean).join(' · ')}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                  <TouchableOpacity onPress={() => setCoursePickerOpen(false)} style={[styles.modalBtn, { borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                    <Text style={[styles.modalBtnText, { color: '#fff' }]}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'relative',
    top: 0,
    zIndex: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 18,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editProfileBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 100,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  navItem: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  navLabel: {
    color: '#fff',
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  cardIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  progressItem: {
    gap: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    display: "flex",
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  actionButton: {
    width: Math.min((width - 160) / 2, 360),
    minWidth: 160,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  deadlinesList: {
    gap: 8,
  },
  deadlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  deadlineContent: {
    flex: 1,
  },
  deadlineTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  deadlineDate: {
    fontSize: 12,
    marginTop: 2,
  },
  // Modal selector de clase
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalEmpty: {
    marginTop: 8,
    fontSize: 12,
  },
  modalBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  courseItem: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  courseItemTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  courseItemSubtitle: {
    marginTop: 4,
    fontSize: 12,
  },
});