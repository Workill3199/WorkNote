import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { listCourses } from '../services/courses';
import { listWorkshops } from '../services/workshops';
import { listStudents } from '../services/students';
import { listActivities } from '../services/activities';
import { darkColors, lightColors } from '../theme/colors';
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
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Encabezado con blur
  const DashboardHeader = () => (
    <BlurView intensity={40} tint="dark" style={[styles.header, { backgroundColor: 'rgba(0,0,0,0.4)' }]}> 
      <View style={styles.headerContent}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: palette.primary }]}>
                <Text style={[styles.avatarText, { color: '#fff' }]}>{initial}</Text>
              </View>
            )}
          </View>
          <View>
            <Text style={[styles.greeting, { color: '#fff' }]}>¡Hola, {username}!</Text>
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>Aquí tienes el resumen</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="bell" size={20} color="#fff" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>
    </BlurView>
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
        label: 'Estudiantes',
        value: studentsCount.toString(),
        subtitle: 'Conectados hoy',
        icon: 'account-group',
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
    const actions = [
      { icon: 'file-document', label: 'Nueva actividad', color: '#60A5FA', onPress: () => navigation.getParent()?.navigate('ActivityCreate') },
      { icon: 'calendar', label: 'Programar clase', color: '#A78BFA', onPress: () => navigation.getParent()?.navigate('Courses') },
      { icon: 'account-group', label: 'Ver estudiantes', color: '#22D3EE', onPress: () => navigation.getParent()?.navigate('Students') },
      { icon: 'chart-line', label: 'Analíticas', color: '#34D399', onPress: () => navigation.getParent()?.navigate('Activities') },
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background, paddingTop: insets.top }]}>
      <DashboardHeader />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <StatsCards />
        <ActiveWorkload />
        <QuickActions />
        <UpcomingDeadlines />
      </ScrollView>
      <BlurView intensity={30} tint="dark" style={[styles.bottomNav, { backgroundColor: 'rgba(0,0,0,0.35)', borderTopColor: palette.border }]}> 
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.getParent()?.navigate('Inicio')}>
          <MaterialCommunityIcons name="home" size={22} color="#fff" />
          <Text style={styles.navLabel}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.getParent()?.navigate('Clases')}>
          <MaterialCommunityIcons name="file-document" size={22} color="#fff" />
          <Text style={styles.navLabel}>Clases</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.getParent()?.navigate('Estudiantes')}>
          <MaterialCommunityIcons name="account-group" size={22} color="#fff" />
          <Text style={styles.navLabel}>Estudiantes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.getParent()?.navigate('Ajustes')}>
          <MaterialCommunityIcons name="dots-horizontal" size={22} color="#fff" />
          <Text style={styles.navLabel}>Más</Text>
        </TouchableOpacity>
      </BlurView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'sticky',
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
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: (width - 64) / 2,
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
});